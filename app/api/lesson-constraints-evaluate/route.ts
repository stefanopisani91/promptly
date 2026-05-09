import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isLang, type Lang } from "@/types";
import { resolveLangFromRequest } from "@/lib/i18n/server-lang";
import {
  getDailyConstraintsAttemptCount,
  getLessonProgress,
  getUserProfile,
  incrementDailyConstraintsAttemptCount,
  logSafetyEvent,
  logUsageEvent,
  todayUtcDate,
} from "@/lib/supabase/queries";
import { evaluateConstraints } from "@/lib/lessons/v3/constraints-evaluate";
import { getProjectDescriptionShort } from "@/lib/onboarding/project";
import { isUnlimited, limitsFromTier } from "@/lib/rate-limits/account-limits";

// Lesson 4 — constraints interactive evaluator.
//
// Auth-gated. Three layers of anti-abuse on top of input validation:
//   A. Per-lesson cap (3 attempts) — read from user_progress.step_state
//      for the editor step. Mirrors the client-side counter so a curl
//      loop can't bypass the UI limit.
//   B. Per-user daily quota (DAILY_QUOTA = 12). Counter on
//      spark_usage_daily.constraints_attempts_count, incremented only
//      on a successful Anthropic response.
//   C. Cheap regex pre-filter for prompt-injection patterns. Blocking
//      when hit; the attempt is logged to spark_safety_log fire-and-
//      forget for review.
//
// Mirrors the lesson-claudemd / lesson-context routes — same defenses,
// different rubric and column.

const MAX_TEXTAREA_CHARS = 250; // 200 from blueprint + 50 headroom
const MIN_TEXTAREA_CHARS = 30;
const MAX_LESSON_ATTEMPTS = 3;
// Per-day cap is now resolved per user via account_type — see
// /lib/rate-limits/account-limits.ts. 'standard' = 10/day for this
// route; qa/dev are uncapped (skip both check and increment).

const INJECTION_PATTERNS: RegExp[] = [
  /ignore\s+(all\s+)?(previous|above|prior)\s+instructions?/i,
  /disregard\s+(all\s+)?(previous|above|prior)\s+instructions?/i,
  /ignora\s+(tutte\s+)?(le\s+)?istruzion[ie]/i,
  /\bsystem\s+prompt\b/i,
  /you\s+are\s+(now\s+)?an?\s+(?:ai|assistant|model)\s+without\s+filters?/i,
  /sei\s+(un'?)?\s*ai\s+senza\s+filtr/i,
  /\bjailbreak\b/i,
  /\bDAN\b/,
  /developer\s+mode/i,
  /pretend\s+to\s+be\s+(a\s+)?different/i,
  /fingi\s+di\s+essere/i,
  /set\s+(the\s+)?(total|score|feedback_case|would_have_prevented)\s+to/i,
  /imposta\s+(il\s+)?(totale|punteggio)\s+a/i,
  /return\s+(?:total|feedback_case|would_have_prevented)\s*[:=]/i,
];

interface RequestBody {
  lessonId?: unknown;
  stepId?: unknown;
  protective?: unknown;
  process?: unknown;
  style?: unknown;
  attempt?: unknown;
}

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const profile = await getUserProfile(supabase, user.id);
  if (!profile) {
    return NextResponse.json({ error: "no_profile" }, { status: 401 });
  }

  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const lessonId = typeof body.lessonId === "string" ? body.lessonId : null;
  if (lessonId !== "mindset-04") {
    return NextResponse.json(
      { error: "invalid_lesson_id" },
      { status: 400 },
    );
  }

  const stepId = typeof body.stepId === "string" ? body.stepId : null;
  if (!stepId || !/^[a-z][a-z0-9-]{0,99}$/.test(stepId)) {
    return NextResponse.json({ error: "invalid_step_id" }, { status: 400 });
  }

  const validateText = (raw: unknown): string | null => {
    if (typeof raw !== "string") return null;
    const t = raw.trim();
    if (t.length < MIN_TEXTAREA_CHARS) return null;
    if (t.length > MAX_TEXTAREA_CHARS) return null;
    return t;
  };

  const protective = validateText(body.protective);
  const processConstraint = validateText(body.process);
  const style = validateText(body.style);
  if (!protective || !processConstraint || !style) {
    return NextResponse.json(
      { error: "invalid_constraints" },
      { status: 400 },
    );
  }

  // ── C. Injection pre-filter (blocking) + safety log.
  const combined = `${protective}\n${processConstraint}\n${style}`;
  if (matchesInjection(combined)) {
    logSafetyEvent(supabase, {
      userId: user.id,
      lessonId,
      signal: "constraints_injection_attempt",
      excerpt: combined,
    }).catch(() => {
      /* silent */
    });
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  // ── A. Per-lesson cap (read persisted attempts, ignore client claim).
  const progress = await getLessonProgress(supabase, user.id, lessonId);
  const persistedAttempts = readPersistedAttempts(progress?.step_state, stepId);
  if (persistedAttempts >= MAX_LESSON_ATTEMPTS) {
    void logUsageEvent(supabase, {
      userId: user.id,
      accountType: profile.account_type,
      eventType: "lesson_attempts",
      endpoint: "lesson-constraints-evaluate",
      lessonId,
      attemptNumber: persistedAttempts,
      limitValue: MAX_LESSON_ATTEMPTS,
    }).catch(() => {});
    return NextResponse.json(
      {
        error: "lesson_attempts_exceeded",
        limit: MAX_LESSON_ATTEMPTS,
        used: persistedAttempts,
      },
      { status: 403 },
    );
  }

  // ── B. Per-user daily quota — driven by users.account_type.
  //   'standard' → 10/day, beta → 100, press → 50, qa/dev → uncapped.
  // Uncapped tiers skip BOTH the check and the increment so the
  // counter table stays clean.
  const limits = limitsFromTier(profile.account_type);
  const dailyCap = limits.evaluations_per_day_per_route;
  const today = todayUtcDate();
  if (!isUnlimited(dailyCap)) {
    const dailyUsed = await getDailyConstraintsAttemptCount(
      supabase,
      user.id,
      today,
    );
    if (dailyUsed >= dailyCap) {
      void logUsageEvent(supabase, {
        userId: user.id,
        accountType: profile.account_type,
        eventType: "daily_quota",
        endpoint: "lesson-constraints-evaluate",
        lessonId,
        attemptNumber: dailyUsed,
        limitValue: dailyCap,
      }).catch(() => {});
      return NextResponse.json(
        {
          error: "daily_quota_exceeded",
          limit: dailyCap,
          used: dailyUsed,
        },
        { status: 403 },
      );
    }
  }

  const lang: Lang = isLang(profile.language)
    ? profile.language
    : resolveLangFromRequest();

  const result = await evaluateConstraints({
    lang,
    protective,
    process: processConstraint,
    style,
    attempt:
      typeof body.attempt === "number" && Number.isFinite(body.attempt)
        ? Math.max(1, Math.min(5, Math.round(body.attempt)))
        : persistedAttempts + 1,
    preferredTool: profile.preferred_tool,
    experienceLevel: profile.experience_level,
    // Mitigation 2 (2026-05-09) — same as the other evaluator routes:
    // pass the compressed view so the rubric prompt stays cheap.
    projectDescription: getProjectDescriptionShort(profile) || null,
  });

  if (!result.ok) {
    if (result.error.kind === "missing_api_key") {
      return NextResponse.json({ error: "missing_api_key" }, { status: 503 });
    }
    if (result.error.kind === "network_error") {
      return NextResponse.json({ error: "network_error" }, { status: 502 });
    }
    if (result.error.kind === "anthropic_error") {
      const code =
        result.error.status >= 400 && result.error.status < 500
          ? result.error.status
          : 502;
      return NextResponse.json({ error: "anthropic_error" }, { status: code });
    }
    return NextResponse.json(
      { error: "invalid_ai_response" },
      { status: 502 },
    );
  }

  // Skip the increment for uncapped tiers — see comment on the check.
  if (!isUnlimited(dailyCap)) {
    await incrementDailyConstraintsAttemptCount(supabase, {
      userId: user.id,
      date: today,
    });
  }

  return NextResponse.json({ evaluation: result.evaluation });
}

function matchesInjection(text: string): boolean {
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(text)) return true;
  }
  return false;
}

function readPersistedAttempts(
  stepState: Record<string, unknown> | null | undefined,
  stepId: string,
): number {
  if (!stepState) return 0;
  const entry = stepState[stepId];
  if (!entry || typeof entry !== "object") return 0;
  const result = (entry as Record<string, unknown>).result;
  if (!result || typeof result !== "object") return 0;
  const attempts = (result as Record<string, unknown>).attempts;
  if (typeof attempts !== "number" || !Number.isFinite(attempts)) return 0;
  return Math.max(0, Math.min(99, Math.round(attempts)));
}

export const dynamic = "force-dynamic";
