// Free-form chat with Spark, scoped to a lesson. Authenticated route — gates
// every call behind two quotas:
//
//   1. PER_LESSON_QUOTA (5) — counted in user_progress.spark_chat_count.
//      Forces the user to actually progress instead of camping on one
//      lesson's free chat.
//   2. DAILY_QUOTA (20) — counted in spark_usage_daily. Caps total daily
//      Anthropic spend per user, regardless of how many lessons they
//      bounce across. UTC date; resets at UTC midnight.
//
// Both checks are read-then-write — a double-click race can squeeze in
// exactly one extra message, acceptable at our volumes. Failures of the
// downstream Anthropic call do NOT consume either counter (we increment
// only after the model returns a valid reply).
//
// Backed by Anthropic Claude Haiku 4.5 via lib/ai/anthropic.ts (NOT OpenAI —
// see Promptly_Spark_Master_Configuration.md §6, "Sessione 1"). The persona
// block is sent with prompt-cache headers; the per-call session context is
// not cached.
//
// Sensitive-message detection (jailbreak attempts, crisis-keyword hits)
// is done with cheap regexes BEFORE the model call, then logged to
// spark_safety_log fire-and-forget. The chat call itself proceeds — Spark's
// persona handles those situations correctly in-character; we just want a
// trail for human review.
//
// Pro tier (20/lesson, 80/day per master config §3) is intentionally NOT
// implemented yet — there's no Stripe wiring, no path for a user to BE
// Pro. When that lands, branch the quotas based on a `users.tier` column.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getDailySparkUsage,
  getLessonProgress,
  incrementDailySparkUsage,
  incrementSparkChatCount,
  logSafetyEvent,
  logUsageEvent,
  todayUtcDate,
} from "@/lib/supabase/queries";
import { requestSparkReply } from "@/lib/ai/anthropic";
import {
  SPARK_PERSONA_EN,
  SPARK_PERSONA_IT,
  sparkSessionContextEN,
  sparkSessionContextIT,
} from "@/lib/ai/spark-system-prompt";
import { isLang, isPathSlug, type Lang } from "@/types";
import { isUnlimited, limitsFromTier } from "@/lib/rate-limits/account-limits";

// Both quotas (per-lesson + per-day) are now resolved per user via
// account_type — see /lib/rate-limits/account-limits.ts.
//   'standard' → 5 / lesson, 30 / day
//   'beta'     → 50 / lesson, 300 / day
//   'press'    → 25 / lesson, 150 / day
//   'qa', 'dev' → uncapped (skip both check and increment).
const MAX_MESSAGE_CHARS = 600;
const MIN_MESSAGE_CHARS = 2;

// Cheap regex pre-flight on the user's message. Not exhaustive — Spark's
// persona is the real defence — but a useful audit trail and a signal we
// can graph if abuse spikes. False positives are acceptable: this only
// inserts a row, it does NOT block the chat.
const JAILBREAK_PATTERNS: RegExp[] = [
  /ignora\s+(tutte\s+)?(le\s+)?istruzion[ie]/i,
  /ignore\s+(all\s+)?(previous\s+|prior\s+|above\s+)?instructions?/i,
  /system\s*prompt/i,
  /sei\s+(un'?)?\s*ai\s+senza\s+filtr/i,
  /you\s+are\s+(now\s+)?an?\s+ai\s+without\s+filters?/i,
  /\bjailbreak\b/i,
  /\bDAN\b/, // "Do Anything Now" classic jailbreak prompt
  /developer\s+mode/i,
  /pretend\s+to\s+be\s+(a\s+)?different/i,
  /fingi\s+di\s+essere/i,
];

const CRISIS_PATTERNS: RegExp[] = [
  /voglio\s+farmi\s+(del\s+)?male/i,
  /\bsuicid(io|armi|are)\b/i,
  /non\s+ce\s+la\s+faccio\s+pi[uù]/i,
  /(want|going)\s+to\s+(kill|hurt)\s+myself/i,
  /\bsuicid(e|al)\b/i,
  /can'?t\s+take\s+it\s+anymore/i,
  /\bself[- ]?harm\b/i,
];

function detectSafetySignal(message: string): string | null {
  for (const p of JAILBREAK_PATTERNS) if (p.test(message)) return "jailbreak_attempt";
  for (const p of CRISIS_PATTERNS) if (p.test(message)) return "crisis_keywords";
  return null;
}

interface RequestBody {
  lessonId?: unknown;
  pathSlug?: unknown;
  lessonTitle?: unknown;
  contextSummary?: unknown;
  stepIndex?: unknown;
  totalSteps?: unknown;
  message?: unknown;
}

export async function POST(request: Request) {
  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (
    typeof body.lessonId !== "string" ||
    typeof body.lessonTitle !== "string" ||
    typeof body.pathSlug !== "string" ||
    !isPathSlug(body.pathSlug) ||
    typeof body.message !== "string" ||
    typeof body.stepIndex !== "number" ||
    typeof body.totalSteps !== "number"
  ) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const message = body.message.trim();
  if (message.length < MIN_MESSAGE_CHARS) {
    return NextResponse.json({ error: "empty_message" }, { status: 400 });
  }
  if (message.length > MAX_MESSAGE_CHARS) {
    return NextResponse.json({ error: "message_too_long" }, { status: 413 });
  }

  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Resolve the user's tier first — every quota below depends on it.
  // Single column read (cheap), and the broader profile read below
  // happens regardless of the outcome.
  const { data: tierRow } = await supabase
    .from("users")
    .select("account_type")
    .eq("id", user.id)
    .maybeSingle();
  const accountTypeSnapshot: "standard" | "beta" | "qa" | "dev" | "press" =
    (tierRow?.account_type as
      | "standard"
      | "beta"
      | "qa"
      | "dev"
      | "press"
      | undefined) ?? "standard";
  const limits = limitsFromTier(tierRow?.account_type ?? null);
  const dailyCap = limits.chat_messages_per_day;
  const perLessonCap = limits.chat_messages_per_lesson;

  // Daily quota first — if the user has hit the daily cap, no point checking
  // per-lesson; the answer is always "come back tomorrow". Uncapped tiers
  // (qa/dev) skip the check AND the increment so spark_usage_daily stays
  // clean.
  const today = todayUtcDate();
  let dailyUsed = 0;
  if (!isUnlimited(dailyCap)) {
    dailyUsed = await getDailySparkUsage(supabase, user.id, today);
    if (dailyUsed >= dailyCap) {
      void logUsageEvent(supabase, {
        userId: user.id,
        accountType: accountTypeSnapshot,
        eventType: "daily_chat_quota",
        endpoint: "spark-chat",
        lessonId: body.lessonId,
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

  // Per-lesson quota — same uncapped short-circuit.
  const progress = await getLessonProgress(supabase, user.id, body.lessonId);
  const usedSoFar = progress?.spark_chat_count ?? 0;
  if (!isUnlimited(perLessonCap) && usedSoFar >= perLessonCap) {
    void logUsageEvent(supabase, {
      userId: user.id,
      accountType: accountTypeSnapshot,
      eventType: "per_lesson_quota",
      endpoint: "spark-chat",
      lessonId: body.lessonId,
      attemptNumber: usedSoFar,
      limitValue: perLessonCap,
    }).catch(() => {});
    return NextResponse.json(
      { error: "quota_exceeded", limit: perLessonCap, used: usedSoFar },
      { status: 403 },
    );
  }

  // Safety pre-flight. Fire-and-forget log; do NOT block the chat call —
  // Spark's persona handles these in-character, we just want the trail.
  const safetySignal = detectSafetySignal(message);
  if (safetySignal) {
    logSafetyEvent(supabase, {
      userId: user.id,
      lessonId: body.lessonId,
      signal: safetySignal,
      excerpt: message,
    }).catch(() => {
      /* silent — logging failures must not break the chat */
    });
  }

  // Pick the system prompt language from the profile when available, with a
  // fallback to italian (the default profile language). We also pull the
  // compressed project + motivation views (mitigation 2 of the
  // project_description audit + mitigation 2/4 of the deep_motivation
  // audit, 2026-05-09) so Spark can ground her answers in the user's
  // actual domain AND deploy an emotional anchor in empathic moments
  // without paying for the full prose on every call.
  const { data: profileRow } = await supabase
    .from("users")
    .select(
      "language, project_description, project_description_compressed, deep_motivation, deep_motivation_compressed",
    )
    .eq("id", user.id)
    .maybeSingle();
  const lang: Lang = isLang(profileRow?.language)
    ? (profileRow!.language as Lang)
    : "it";

  // Prefer the compressed view; fall back to a deterministic truncate
  // of the raw when compressed is null (legacy users / not yet back-
  // filled). Two helpers inlined here so we don't have to load the
  // whole UserProfile shape just to read two columns.
  const compressedProject = profileRow?.project_description_compressed?.trim();
  const rawProject = profileRow?.project_description?.trim();
  const projectContext =
    compressedProject && compressedProject.length > 0
      ? compressedProject
      : rawProject
      ? rawProject.length <= 80
        ? rawProject
        : rawProject.slice(0, 80).trimEnd() + "…"
      : null;

  const compressedMotivation = profileRow?.deep_motivation_compressed?.trim();
  const rawMotivation = profileRow?.deep_motivation?.trim();
  const motivationAnchor =
    compressedMotivation && compressedMotivation.length > 0
      ? compressedMotivation
      : rawMotivation
      ? rawMotivation.length <= 100
        ? rawMotivation
        : rawMotivation.slice(0, 100).trimEnd() + "…"
      : null;

  const persona = lang === "en" ? SPARK_PERSONA_EN : SPARK_PERSONA_IT;
  const sessionContext = (
    lang === "en" ? sparkSessionContextEN : sparkSessionContextIT
  )({
    lessonTitle: body.lessonTitle,
    stepIndex: Math.max(0, Math.floor(body.stepIndex)),
    totalSteps: Math.max(1, Math.floor(body.totalSteps)),
    contextSummary:
      typeof body.contextSummary === "string"
        ? body.contextSummary
        : undefined,
    projectContext,
    motivationAnchor,
  });

  const result = await requestSparkReply({
    persona,
    sessionContext,
    userMessage: message,
    // Hard budget on response length. Spark's persona prescribes 2-4
    // sentences by default, with an exception up to 8 sentences when the
    // learner explicitly asks for in-depth ("explain in detail",
    // "thoroughly", "the full picture"). 8 EN sentences run ~350 tokens
    // worst case; 300 covers ~95% without inviting multi-paragraph
    // essays. See coherence-test length compliance metric in
    // scripts/spark-coherence-test.mjs.
    maxOutputTokens: 300,
    temperature: 0.7,
  });

  if (!result.ok) {
    if (result.error.kind === "missing_api_key") {
      return NextResponse.json(
        { error: "missing_api_key" },
        { status: 503 },
      );
    }
    if (result.error.kind === "network_error") {
      return NextResponse.json(
        { error: "network_error" },
        { status: 502 },
      );
    }
    return NextResponse.json({ error: "api_error" }, { status: 502 });
  }

  // Only increment counters on a successful response — failed calls
  // shouldn't burn the user's quota. Uncapped tiers (qa/dev) skip
  // both increments so the counter tables aren't polluted.
  if (!isUnlimited(perLessonCap)) {
    await incrementSparkChatCount(supabase, {
      userId: user.id,
      lessonId: body.lessonId,
      pathSlug: body.pathSlug,
    });
  }
  if (!isUnlimited(dailyCap)) {
    await incrementDailySparkUsage(supabase, {
      userId: user.id,
      date: today,
    });
  }

  // For uncapped tiers we report a sentinel high "remaining" so the
  // client UI doesn't render a misleading "0 messages left" pill.
  // The client treats values ≥ a large threshold as "unlimited".
  const UNLIMITED_SENTINEL = 9_999;
  const newRemaining = isUnlimited(perLessonCap)
    ? UNLIMITED_SENTINEL
    : Math.max(0, perLessonCap - (usedSoFar + 1));
  const newDailyRemaining = isUnlimited(dailyCap)
    ? UNLIMITED_SENTINEL
    : Math.max(0, dailyCap - (dailyUsed + 1));

  return NextResponse.json({
    reply: result.reply,
    remaining: newRemaining,
    limit: isUnlimited(perLessonCap) ? UNLIMITED_SENTINEL : perLessonCap,
    dailyRemaining: newDailyRemaining,
    dailyLimit: isUnlimited(dailyCap) ? UNLIMITED_SENTINEL : dailyCap,
  });
}

export const dynamic = "force-dynamic";
