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

const PER_LESSON_QUOTA = 5;
const DAILY_QUOTA = 20;
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

  // Daily quota first — if the user has hit the daily cap, no point checking
  // per-lesson; the answer is always "come back tomorrow".
  const today = todayUtcDate();
  const dailyUsed = await getDailySparkUsage(supabase, user.id, today);
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

  // Per-lesson quota.
  const progress = await getLessonProgress(supabase, user.id, body.lessonId);
  const usedSoFar = progress?.spark_chat_count ?? 0;
  if (usedSoFar >= PER_LESSON_QUOTA) {
    return NextResponse.json(
      { error: "quota_exceeded", limit: PER_LESSON_QUOTA, used: usedSoFar },
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
  // fallback to italian (the default profile language).
  const { data: profileRow } = await supabase
    .from("users")
    .select("language")
    .eq("id", user.id)
    .maybeSingle();
  const lang: Lang = isLang(profileRow?.language)
    ? (profileRow!.language as Lang)
    : "it";

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
  });

  const result = await requestSparkReply({
    persona,
    sessionContext,
    userMessage: message,
    // Hard budget on response length — Spark's persona prescribes max 4
    // sentences (~80–110 tokens). 220 leaves room without inviting the
    // model to drift into multi-paragraph essays. See coherence-test
    // length compliance metric in scripts/spark-coherence-test.mjs.
    maxOutputTokens: 220,
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
  // shouldn't burn the user's quota.
  await incrementSparkChatCount(supabase, {
    userId: user.id,
    lessonId: body.lessonId,
    pathSlug: body.pathSlug,
  });
  await incrementDailySparkUsage(supabase, {
    userId: user.id,
    date: today,
  });

  const newRemaining = Math.max(0, PER_LESSON_QUOTA - (usedSoFar + 1));
  const newDailyRemaining = Math.max(0, DAILY_QUOTA - (dailyUsed + 1));

  return NextResponse.json({
    reply: result.reply,
    remaining: newRemaining,
    limit: PER_LESSON_QUOTA,
    dailyRemaining: newDailyRemaining,
    dailyLimit: DAILY_QUOTA,
  });
}

export const dynamic = "force-dynamic";
