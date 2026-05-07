import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isLang, type Lang } from "@/types";
import { resolveLangFromRequest } from "@/lib/i18n/server-lang";
import {
  getDailyClaudemdAttemptCount,
  getLessonProgress,
  getUserProfile,
  incrementDailyClaudemdAttemptCount,
  logSafetyEvent,
  todayUtcDate,
} from "@/lib/supabase/queries";
import { evaluateClaudemd } from "@/lib/lessons/v3/claudemd-evaluate";

// Lesson 2 — CLAUDE.md interactive evaluator.
//
// Auth-gated route. Three layers of anti-abuse on top of input validation:
//
//   A. Per-lesson cap (3 attempts) — read from user_progress.step_state for
//      the editor step. Mirrors the client-side counter so a curl loop can't
//      bypass the UI limit.
//   B. Per-user daily quota (DAILY_QUOTA = 12). Counter on
//      spark_usage_daily.claudemd_attempts_count, incremented only on a
//      successful Anthropic response.
//   C. Cheap regex pre-filter for prompt-injection patterns. Blocking when
//      hit; the attempt is logged to spark_safety_log fire-and-forget for
//      review.
//
// The client passes `attempt: attemptCount + 1` for telemetry — we ignore
// that value when enforcing the cap and read the persisted attempts from
// step_state instead, since the client value is trusted only for logging.

// User content cap is 1200 chars (config.max_chars in the lesson JSON);
// the composed body the route receives also carries ~120 chars of fixed
// `## Heading` lines. We leave 300 chars of headroom so a maxed-out
// user input doesn't get rejected on the composed-body length check.
const MAX_EDITOR_CHARS = 1500;
const MIN_EDITOR_CHARS = 30;
const MAX_LESSON_ATTEMPTS = 3;
const DAILY_QUOTA = 12;
const ALLOWED_PROJECTS = new Set(["ecommerce", "habits", "website"]);

// Pattern set: Spark-chat's classic jailbreak set, plus the more aggressive
// landing-evaluate set (which is blocking, not just logging) since the
// editor input becomes part of a user-message that asks the model for
// strict-JSON evaluation. A "give me 100/100" injection here would corrupt
// scoring even though clamp on individual scores limits the damage.
const INJECTION_PATTERNS: RegExp[] = [
  /ignore\s+(all\s+)?(previous|above|prior)\s+instructions?/i,
  /disregard\s+(all\s+)?(previous|above|prior)\s+instructions?/i,
  /ignora\s+(tutte\s+)?(le\s+)?istruzion[ie]/i,
  /\bsystem\s+prompt\b/i,
  /you\s+are\s+(now\s+)?an?\s+(?:ai|assistant|model)\s+without\s+filters?/i,
  /sei\s+(un'?)?\s*ai\s+senza\s+filtr/i,
  /\bjailbreak\b/i,
  /\bDAN\b/, // classic "Do Anything Now" jailbreak
  /developer\s+mode/i,
  /pretend\s+to\s+be\s+(a\s+)?different/i,
  /fingi\s+di\s+essere/i,
  // Domain-specific: trying to dictate the rubric output.
  /set\s+(the\s+)?(total|score|feedback_case)\s+to/i,
  /imposta\s+(il\s+)?(totale|punteggio)\s+a/i,
  /return\s+(?:total|feedback_case)\s*[:=]/i,
];

interface RequestBody {
  lessonId?: unknown;
  stepId?: unknown;
  projectKey?: unknown;
  editorText?: unknown;
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
  if (lessonId !== "mindset-02") {
    return NextResponse.json(
      { error: "invalid_lesson_id" },
      { status: 400 },
    );
  }

  const stepId = typeof body.stepId === "string" ? body.stepId : null;
  if (!stepId || !/^[a-z][a-z0-9-]{0,99}$/.test(stepId)) {
    return NextResponse.json({ error: "invalid_step_id" }, { status: 400 });
  }

  const projectKey = typeof body.projectKey === "string" ? body.projectKey : null;
  if (!projectKey || !ALLOWED_PROJECTS.has(projectKey)) {
    return NextResponse.json({ error: "invalid_project" }, { status: 400 });
  }

  const editorRaw = typeof body.editorText === "string" ? body.editorText : null;
  if (!editorRaw) {
    return NextResponse.json({ error: "missing_editor_text" }, { status: 400 });
  }
  const editorText = editorRaw.trim();
  if (editorText.length < MIN_EDITOR_CHARS) {
    return NextResponse.json(
      { error: "editor_text_too_short" },
      { status: 400 },
    );
  }
  if (editorText.length > MAX_EDITOR_CHARS) {
    return NextResponse.json(
      { error: "editor_text_too_long" },
      { status: 413 },
    );
  }

  // ── C. Injection pre-filter (blocking) + fire-and-forget safety log.
  if (matchesInjection(editorText)) {
    logSafetyEvent(supabase, {
      userId: user.id,
      lessonId,
      signal: "claudemd_injection_attempt",
      excerpt: editorText,
    }).catch(() => {
      /* silent — logging failures must not change the response */
    });
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  // ── A. Per-lesson cap (read persisted attempts, ignore client claim).
  const progress = await getLessonProgress(supabase, user.id, lessonId);
  const persistedAttempts = readPersistedAttempts(progress?.step_state, stepId);
  if (persistedAttempts >= MAX_LESSON_ATTEMPTS) {
    return NextResponse.json(
      {
        error: "lesson_attempts_exceeded",
        limit: MAX_LESSON_ATTEMPTS,
        used: persistedAttempts,
      },
      { status: 403 },
    );
  }

  // ── B. Per-user daily quota.
  const today = todayUtcDate();
  const dailyUsed = await getDailyClaudemdAttemptCount(supabase, user.id, today);
  if (dailyUsed >= DAILY_QUOTA) {
    return NextResponse.json(
      {
        error: "daily_quota_exceeded",
        limit: DAILY_QUOTA,
        used: dailyUsed,
      },
      { status: 403 },
    );
  }

  const lang: Lang = isLang(profile.language)
    ? profile.language
    : resolveLangFromRequest();

  const result = await evaluateClaudemd({
    lang,
    projectKey,
    editorText,
    // Client `attempt` is for telemetry only; the rubric reads it as a
    // soft signal. Falls back to the persisted count + 1 when missing.
    attempt:
      typeof body.attempt === "number" && Number.isFinite(body.attempt)
        ? Math.max(1, Math.min(5, Math.round(body.attempt)))
        : persistedAttempts + 1,
    preferredTool: profile.preferred_tool,
    experienceLevel: profile.experience_level,
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

  // Only burn the daily counter on a successful Anthropic call. Failed
  // calls don't waste the user's budget — same convention as spark-chat.
  await incrementDailyClaudemdAttemptCount(supabase, {
    userId: user.id,
    date: today,
  });

  return NextResponse.json({ evaluation: result.evaluation });
}

function matchesInjection(text: string): boolean {
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(text)) return true;
  }
  return false;
}

/**
 * Pull the attempts counter the lesson view persisted into step_state for
 * the CLAUDE.md editor step. The shape is owned by ClaudemdEditor, which
 * stores `result.attempts` (number) inside `stepState[stepId]` after each
 * submit. We trust the persisted value (it's RLS-scoped to the user) but
 * still bound it to a sane integer.
 */
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
