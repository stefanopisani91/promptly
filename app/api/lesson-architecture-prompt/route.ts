import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isLang, type Lang } from "@/types";
import { resolveLangFromRequest } from "@/lib/i18n/server-lang";
import {
  getDailyArchitectureAttemptCount,
  getUserProfile,
  incrementDailyArchitectureAttemptCount,
  logUsageEvent,
  todayUtcDate,
} from "@/lib/supabase/queries";
import { generateArchitecturePrompt } from "@/lib/lessons/v3/architecture-prompt-generate";
import { getProjectDescriptionShort } from "@/lib/onboarding/project";
import { isUnlimited, limitsFromTier } from "@/lib/rate-limits/account-limits";

// Lesson 6 — prompt-architecture personalised generation route.
//
// Auth-gated. Two-layer cap:
//   A. Per-user daily quota — reuses the same numeric cap as the
//      lesson evaluators (`evaluations_per_day_per_route`) since
//      the cost shape is similar (~1 Haiku call). Counter on
//      spark_usage_daily.architecture_attempts_count, incremented
//      only on a successful Anthropic response.
//   B. Account_type tier — qa/dev are uncapped (skip both check
//      and increment to keep the counter table clean).
//
// Unlike the evaluator routes, this one does NOT receive user-typed
// text — the prompt is built server-side from the user's stored
// project_description + tools_used. So we don't run the prompt-
// injection regex pre-filter (no surface for it to attack).

interface RequestBody {
  lessonId?: unknown;
  stepId?: unknown;
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
  if (lessonId !== "mindset-06") {
    return NextResponse.json({ error: "invalid_lesson_id" }, { status: 400 });
  }

  const stepId = typeof body.stepId === "string" ? body.stepId : null;
  if (!stepId || !/^[a-z][a-z0-9-]{0,99}$/.test(stepId)) {
    return NextResponse.json({ error: "invalid_step_id" }, { status: 400 });
  }

  // ── Per-user daily quota — driven by users.account_type.
  //   'standard' → 10/day, beta → 100, press → 50, qa/dev → uncapped.
  // Uncapped tiers skip BOTH the check and the increment so the
  // counter table stays clean.
  const limits = limitsFromTier(profile.account_type);
  const dailyCap = limits.evaluations_per_day_per_route;
  const today = todayUtcDate();
  if (!isUnlimited(dailyCap)) {
    const dailyUsed = await getDailyArchitectureAttemptCount(
      supabase,
      user.id,
      today,
    );
    if (dailyUsed >= dailyCap) {
      void logUsageEvent(supabase, {
        userId: user.id,
        accountType: profile.account_type,
        eventType: "daily_quota",
        endpoint: "lesson-architecture-prompt",
        lessonId,
        attemptNumber: dailyUsed,
        limitValue: dailyCap,
      }).catch(() => {});
      return NextResponse.json(
        { error: "daily_quota_exceeded", limit: dailyCap, used: dailyUsed },
        { status: 403 },
      );
    }
  }

  const lang: Lang = isLang(profile.language)
    ? profile.language
    : resolveLangFromRequest();

  const result = await generateArchitecturePrompt({
    lang,
    projectDescription: getProjectDescriptionShort(profile) || null,
    toolsUsed: profile.tools_used ?? [],
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

  // Skip the increment for uncapped tiers — see comment on the check.
  if (!isUnlimited(dailyCap)) {
    await incrementDailyArchitectureAttemptCount(supabase, {
      userId: user.id,
      date: today,
    });
  }

  return NextResponse.json({ blocks: result.blocks });
}

// Note: the 3-try-per-lesson cap is enforced CLIENT-SIDE by the
// PromptArchitecture widget. This route is hit at most once per
// attempt anyway, so a server-side enforcement would just duplicate
// the client logic without changing the abuse surface (the daily
// quota above is the real cap). MAX_LESSON_ATTEMPTS = 3 sits in
// the widget code; not exported here because Next.js route files
// only allow specific named exports (GET/POST/dynamic/...).

export const dynamic = "force-dynamic";
