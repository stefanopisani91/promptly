// Spark Helper — the contextual tutor that lives INSIDE a V3 quick-win
// widget. Authenticated route. Deliberately narrow: it explains terms,
// gives examples, helps the learner think — it never hands over the
// exercise's answer.
//
// Security posture (the feature was specced with "particolare attenzione
// alle misure di sicurezza" — keep it that way):
//
//   • Auth-gated. No anonymous calls.
//   • Scope-locked. pathSlug must be "mindset" and widgetKey must be in the
//     server-side allowlist (lib/lessons/v3/spark-helper-config.ts). The
//     lesson is loaded server-side and its interactive step's widget is
//     cross-checked against the client-supplied widgetKey — so you can't
//     point one lesson's id at another lesson's widget, and you can't reach
//     this route from a text/principle step or from a Path 2 V1 lesson.
//   • No exercise content in the model context. The route never receives
//     (and never sends) what the learner typed in the quick-win, and the
//     "correct answers" are nowhere in the prompt — only a per-widget
//     scenario brief that explicitly tells Spark what NOT to reveal.
//   • Cost caps, server-enforced. Per-quick-win cap (10 for standard) on
//     user_progress.spark_helper_count + per-day cap (30/300/150, uncapped
//     for qa·dev) on spark_usage_daily.helper_messages_count. Input ≤200
//     chars, history clamped to the last few turns server-side, output
//     capped at ~300 tokens. Counters bump only on a successful reply.
//   • Fail-closed. If the counter columns don't exist yet (migration
//     20260512120000 not applied), the read throws and the route returns
//     503 — the feature stays dark rather than running uncapped.
//   • Jailbreak / crisis pre-flight. Cheap regexes, logged fire-and-forget
//     to spark_safety_log; the call still proceeds (Spark's persona handles
//     these in-character — same as spark-chat).
//
// Backed by Anthropic Claude Haiku 4.5 via lib/ai/anthropic.ts. The persona
// block is the SAME, unchanged SPARK_PERSONA_* cache block used by
// spark-chat (cache stays warm, even shared between the two routes); the
// helper-specific rules + per-widget brief ride in the per-call,
// non-cached context.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getDailySparkHelperUsage,
  getSparkHelperCount,
  incrementDailySparkHelperUsage,
  incrementSparkHelperCount,
  logSafetyEvent,
  logUsageEvent,
  todayUtcDate,
} from "@/lib/supabase/queries";
import { requestSparkReply } from "@/lib/ai/anthropic";
import {
  getHelperPhaseGuidance,
  SPARK_PERSONA_EN,
  SPARK_PERSONA_IT,
  sparkHelperContextEN,
  sparkHelperContextIT,
} from "@/lib/ai/spark-system-prompt";
import {
  getHelperContextNote,
  isSparkHelperWidget,
  isSparkHelperPhase,
} from "@/lib/lessons/v3/spark-helper-config";
import { loadLessonById } from "@/lib/lessons/load";
import { toolDisplayName } from "@/lib/onboarding/tools";
import { isLang, isLessonV3Content, isPathSlug, type Lang } from "@/types";
import { isUnlimited, limitsFromTier } from "@/lib/rate-limits/account-limits";

const MAX_MESSAGE_CHARS = 200; // spec: keeps the scope tight, conversation short
const MIN_MESSAGE_CHARS = 2;
const MAX_HISTORY_TURNS = 6; // last 3 exchanges — bounds the prompt size
const MAX_HISTORY_TURN_CHARS = 320; // each remembered turn, defensively clamped
const LESSON_ID_RE = /^[a-z]+-\d{2}$/;
const UNLIMITED_SENTINEL = 9_999;
// The raw project_description Spark sees in the per-call block. Larger than
// the 80-char compressed view used in spark-chat (which is cache-eligible
// and token-sensitive): the helper context is rebuilt per call and lives
// outside the prompt cache, so paying for a longer description is fine and
// helps Spark actually cite project specifics in personalized examples.
const MAX_PROJECT_CHARS = 200;
const PHASE_KEY_RE = /^[a-z][a-z0-9_]{0,63}$/;

// Heuristic for BUG 2 / mitigation: detect when the learner is asking
// Spark Helper for an example fitted to their own project. Fires the
// missed-personalization analytic only when this matches AND the reply
// doesn't mention any significant project word — see below.
const PERSONALIZED_EXAMPLE_PATTERNS: RegExp[] = [
  /\besempi[oa]\b.*\b(mio|mi[ao]\s+(progetto|caso|app|sito)|nel\s+mio|adattat[oa]|per\s+me)\b/i,
  /\b(nel\s+mio\s+caso|per\s+il\s+mio\s+(progetto|caso)|adattat[oa]\s+al\s+mio)\b/i,
  /\bexample\b.*\b(my|mine|fitted\s+to\s+my|for\s+my|in\s+my\s+(case|project))\b/i,
  /\b(in\s+my\s+case|for\s+my\s+project|fitted\s+to\s+my)\b/i,
];

function isAskingPersonalizedExample(message: string): boolean {
  return PERSONALIZED_EXAMPLE_PATTERNS.some((p) => p.test(message));
}

// Best-effort: pick "significant" tokens from the project_description
// (≥4 chars, not a generic stopword) and check if any appear in the
// reply. Heuristic only — false positives/negatives expected, but it
// gives an aggregate signal in PostHog so we can monitor drift.
const PROJECT_STOPWORDS = new Set([
  "anche", "come", "della", "delle", "degli", "dello", "essere",
  "fare", "loro", "molto", "nostro", "nostri", "nostra", "ogni",
  "quale", "quali", "quando", "quello", "quella", "questo", "questa",
  "sono", "stato", "stessa", "stesso", "tutto", "tutta", "vista",
  "voglio", "vuoi", "vuole", "with", "about", "after", "again", "their",
  "would", "there", "where", "which", "while", "could", "should", "every",
  "between", "before", "because", "create", "creating", "build", "building",
]);

function projectTokens(raw: string): string[] {
  const out: string[] = [];
  for (const t of raw.toLowerCase().split(/[^\p{L}\p{N}]+/u)) {
    if (t.length < 4) continue;
    if (PROJECT_STOPWORDS.has(t)) continue;
    out.push(t);
    if (out.length >= 12) break;
  }
  return out;
}

function replyCitesProject(reply: string, project: string): boolean {
  const tokens = projectTokens(project);
  if (tokens.length === 0) return true; // nothing to cite → no-op pass
  const haystack = reply.toLowerCase();
  return tokens.some((t) => haystack.includes(t));
}

// Same cheap pre-flight as spark-chat. Not a wall — Spark's persona is the
// real defence — but a useful audit trail. False positives are fine: this
// only inserts a log row, it does NOT block the reply.
const JAILBREAK_PATTERNS: RegExp[] = [
  /ignora\s+(tutte\s+)?(le\s+)?istruzion[ie]/i,
  /ignore\s+(all\s+)?(previous\s+|prior\s+|above\s+)?instructions?/i,
  /system\s*prompt/i,
  /sei\s+(un'?)?\s*ai\s+senza\s+filtr/i,
  /you\s+are\s+(now\s+)?an?\s+ai\s+without\s+filters?/i,
  /\bjailbreak\b/i,
  /\bDAN\b/,
  /developer\s+mode/i,
  /pretend\s+to\s+be\s+(a\s+)?different/i,
  /fingi\s+di\s+essere/i,
  // Helper-specific: explicit "just give me the answer" attempts. Logged,
  // not blocked — the per-call rules tell Spark to decline these in-character.
  /(dammi|scrivimi|dimmi)\s+(tu\s+)?la\s+risposta\s+(giusta|corretta|perfetta)/i,
  /(give|write|tell)\s+me\s+the\s+(right|correct|perfect)\s+answer/i,
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
  widgetKey?: unknown;
  message?: unknown;
  history?: unknown;
  // Optional client-provided per-widget phase (e.g. "recovery_question").
  // Server-side validated against an allowlist before being used.
  currentPhase?: unknown;
  // Optional previous-attempt summary. Sent on between_attempts; the
  // learner's TYPED text is intentionally NOT part of this — keeping the
  // "Spark never sees what the learner typed" rule intact.
  previousAttempt?: unknown;
}

// Bounds for the previousAttempt fields. Generous enough for a Spark line
// (~200 chars in practice) but small enough to never balloon the prompt.
const MAX_PREV_REPLY_CHARS = 240;
const MAX_PREV_WEAKNESS_CHARS = 48;

function sanitisePreviousAttempt(
  raw: unknown,
): { score: number; weakness: string | null; sparkReply: string | null } | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  // Score: required and must be a finite 0-100 number. Clamp defensively.
  if (typeof obj.score !== "number" || !Number.isFinite(obj.score)) return null;
  const score = Math.max(0, Math.min(100, Math.round(obj.score)));
  const weakness =
    typeof obj.weakness === "string" && obj.weakness.trim().length > 0
      ? obj.weakness.trim().slice(0, MAX_PREV_WEAKNESS_CHARS)
      : null;
  const sparkReply =
    typeof obj.sparkReply === "string" && obj.sparkReply.trim().length > 0
      ? obj.sparkReply.replace(/\s+/g, " ").trim().slice(0, MAX_PREV_REPLY_CHARS)
      : null;
  return { score, weakness, sparkReply };
}

interface HistoryTurn {
  role: "user" | "spark";
  content: string;
}

function sanitiseHistory(raw: unknown): HistoryTurn[] {
  if (!Array.isArray(raw)) return [];
  const out: HistoryTurn[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const role = (item as { role?: unknown }).role;
    const content = (item as { content?: unknown }).content;
    if ((role !== "user" && role !== "spark") || typeof content !== "string") continue;
    const trimmed = content.replace(/\s+/g, " ").trim();
    if (!trimmed) continue;
    out.push({ role, content: trimmed.slice(0, MAX_HISTORY_TURN_CHARS) });
  }
  // Keep only the most recent turns — the prompt should never balloon.
  return out.slice(-MAX_HISTORY_TURNS);
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
    !LESSON_ID_RE.test(body.lessonId) ||
    typeof body.pathSlug !== "string" ||
    !isPathSlug(body.pathSlug) ||
    body.pathSlug !== "mindset" ||
    typeof body.widgetKey !== "string" ||
    !isSparkHelperWidget(body.widgetKey) ||
    typeof body.message !== "string"
  ) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  const lessonId = body.lessonId;
  const widgetKey = body.widgetKey;
  const pathSlug = body.pathSlug;

  const message = body.message.trim();
  if (message.length < MIN_MESSAGE_CHARS) {
    return NextResponse.json({ error: "empty_message" }, { status: 400 });
  }
  if (message.length > MAX_MESSAGE_CHARS) {
    return NextResponse.json({ error: "message_too_long" }, { status: 413 });
  }
  const history = sanitiseHistory(body.history);
  // Defensive sanitisation of the optional phase: must be a short ASCII
  // snake_case token AND in the per-widget allowlist. Anything else is
  // silently dropped (we don't fail the request — phase is purely
  // additional context, not a security boundary).
  const phaseCandidate =
    typeof body.currentPhase === "string" ? body.currentPhase.trim() : "";
  const currentPhase =
    phaseCandidate.length > 0 &&
    PHASE_KEY_RE.test(phaseCandidate) &&
    isSparkHelperPhase(widgetKey, phaseCandidate)
      ? phaseCandidate
      : null;
  // previousAttempt is only meaningful when the phase says "between_attempts".
  // Dropping it on every other phase is defensive — the client shouldn't send
  // it then anyway, but the server stays the source of truth on what reaches
  // Spark.
  const previousAttempt =
    currentPhase === "between_attempts"
      ? sanitisePreviousAttempt(body.previousAttempt)
      : null;

  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Tier → quotas. Single cheap column read; the broader profile read
  // happens below regardless.
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
  const dailyCap = limits.helper_messages_per_day;
  const quickWinCap = limits.helper_messages_per_quick_win;

  // Read both counters up front. If the columns don't exist yet (migration
  // not applied), this throws → 503, feature stays dark. qa/dev skip both
  // reads (uncapped), so the route works for them even pre-migration.
  const today = todayUtcDate();
  let dailyUsed = 0;
  let usedSoFar = 0;
  try {
    if (!isUnlimited(dailyCap)) {
      dailyUsed = await getDailySparkHelperUsage(supabase, user.id, today);
    }
    if (!isUnlimited(quickWinCap)) {
      usedSoFar = await getSparkHelperCount(supabase, user.id, lessonId);
    }
  } catch {
    return NextResponse.json({ error: "feature_unavailable" }, { status: 503 });
  }

  if (!isUnlimited(dailyCap) && dailyUsed >= dailyCap) {
    void logUsageEvent(supabase, {
      userId: user.id,
      accountType: accountTypeSnapshot,
      eventType: "daily_helper_quota",
      endpoint: "spark-helper",
      lessonId,
      attemptNumber: dailyUsed,
      limitValue: dailyCap,
    }).catch(() => {});
    return NextResponse.json(
      { error: "daily_quota_exceeded", limit: dailyCap, used: dailyUsed },
      { status: 403 },
    );
  }

  if (!isUnlimited(quickWinCap) && usedSoFar >= quickWinCap) {
    void logUsageEvent(supabase, {
      userId: user.id,
      accountType: accountTypeSnapshot,
      eventType: "per_quick_win_helper_quota",
      endpoint: "spark-helper",
      lessonId,
      attemptNumber: usedSoFar,
      limitValue: quickWinCap,
    }).catch(() => {});
    return NextResponse.json(
      { error: "quota_exceeded", limit: quickWinCap, used: usedSoFar },
      { status: 403 },
    );
  }

  // Profile: language (system-prompt locale), compressed project (grounded
  // examples), tools (jargon adaptation). Same compressed-or-truncate
  // fallback as spark-chat.
  const { data: profileRow } = await supabase
    .from("users")
    .select(
      "language, project_description, project_description_compressed, preferred_tool, tools_used",
    )
    .eq("id", user.id)
    .maybeSingle();
  const lang: Lang = isLang(profileRow?.language)
    ? (profileRow!.language as Lang)
    : "it";

  const compressedProject = profileRow?.project_description_compressed?.trim();
  const rawProject = profileRow?.project_description?.trim();
  // Prefer the raw description (up to ~200 chars) over the 80-char
  // compressed view: spark-helper's per-call context isn't prompt-cached,
  // so the few extra tokens are worth the concrete detail Spark needs to
  // cite the project naturally in personalized examples.
  const projectContext = (() => {
    if (rawProject && rawProject.length > 0) {
      return rawProject.length <= MAX_PROJECT_CHARS
        ? rawProject
        : rawProject.slice(0, MAX_PROJECT_CHARS).trimEnd() + "…";
    }
    return compressedProject && compressedProject.length > 0
      ? compressedProject
      : null;
  })();
  // True when the learner has no real project (no raw and no compressed).
  // The system prompt uses this to make the lack of a project explicit
  // when giving generic examples — never fake personalization.
  const projectIsVague = !projectContext;

  const toolsLabel = (() => {
    const preferred = profileRow?.preferred_tool;
    if (typeof preferred === "string" && preferred.trim().length > 0) {
      return toolDisplayName(preferred, lang);
    }
    const used = profileRow?.tools_used;
    if (Array.isArray(used) && used.length > 0 && typeof used[0] === "string") {
      return toolDisplayName(used[0], lang);
    }
    return null;
  })();

  // Server-truth the lesson: real title (no injection via a client title),
  // and a sanity check that this lessonId's interactive step really uses
  // the widgetKey the client claimed.
  const lesson = await loadLessonById(lessonId, lang);
  if (!lesson || !isLessonV3Content(lesson) || lesson.path_slug !== "mindset") {
    return NextResponse.json({ error: "lesson_not_found" }, { status: 400 });
  }
  const interactiveStep = lesson.steps.find((s) => s.type === "interactive");
  if (!interactiveStep || interactiveStep.widget !== widgetKey) {
    return NextResponse.json({ error: "widget_mismatch" }, { status: 400 });
  }
  const lessonTitle = lesson.title;

  // Lesson 3 — when the learner is on a specific scenario_*_writing phase
  // (or between_attempts after picking a scenario), pluck the per-scenario
  // briefing from the loaded lesson JSON and hand it to Spark so she can
  // hint about the briefing's «ingredients» (the user expects this — they
  // just read it in the widget). Server is the authority: never trust a
  // client-supplied briefing string. Drops gracefully when the phase
  // doesn't name a scenario (e.g. choosing_scenario or non-lesson-3
  // widgets).
  const scenarioBriefing = (() => {
    if (
      widgetKey !== "context_prompt_editor" ||
      !currentPhase ||
      !currentPhase.startsWith("scenario_") ||
      !currentPhase.endsWith("_writing")
    ) {
      return null;
    }
    const scenarioKey = currentPhase.slice(
      "scenario_".length,
      currentPhase.length - "_writing".length,
    );
    const config = interactiveStep.context_config;
    const scenario = config?.scenarios.find((s) => s.key === scenarioKey);
    return scenario?.briefing ?? null;
  })();

  // Safety pre-flight on the message AND any history (a jailbreak attempt
  // smuggled in via an earlier turn still gets logged). Fire-and-forget;
  // never blocks the reply.
  const safetyTarget =
    detectSafetySignal(message) ??
    history.map((h) => detectSafetySignal(h.content)).find(Boolean) ??
    null;
  if (safetyTarget) {
    logSafetyEvent(supabase, {
      userId: user.id,
      lessonId,
      signal: `spark_helper_${safetyTarget}`,
      excerpt: message,
    }).catch(() => {});
  }

  const persona = lang === "en" ? SPARK_PERSONA_EN : SPARK_PERSONA_IT;
  const helperContext = (
    lang === "en" ? sparkHelperContextEN : sparkHelperContextIT
  )({
    lessonTitle,
    contextNote: getHelperContextNote(widgetKey, lang),
    projectContext,
    projectIsVague,
    toolsLabel,
    currentPhase,
    phaseGuidance: currentPhase
      ? getHelperPhaseGuidance(widgetKey, currentPhase, lang)
      : null,
    scenarioBriefing,
    previousAttempt,
    history,
  });

  const result = await requestSparkReply({
    persona,
    sessionContext: helperContext,
    userMessage: message,
    // Spec: 3-4 sentences. The persona prescribes 2-4 by default and the
    // helper rules reinforce "max 3-4"; 300 tokens is a hard ceiling that
    // covers ~5 Italian sentences without inviting an essay. Raised from
    // 200 after testing showed examples + analogies getting truncated.
    maxOutputTokens: 300,
    temperature: 0.6,
  });

  if (!result.ok) {
    if (result.error.kind === "missing_api_key") {
      return NextResponse.json({ error: "missing_api_key" }, { status: 503 });
    }
    if (result.error.kind === "network_error") {
      return NextResponse.json({ error: "network_error" }, { status: 502 });
    }
    return NextResponse.json({ error: "api_error" }, { status: 502 });
  }

  // Bump counters only on a successful reply. qa/dev skip both so the
  // counter tables stay clean. (getLessonProgress isn't needed here —
  // incrementSparkHelperCount upserts the row if missing, like
  // incrementSparkChatCount.)
  if (!isUnlimited(quickWinCap)) {
    await incrementSparkHelperCount(supabase, {
      userId: user.id,
      lessonId,
      pathSlug,
    });
  }
  if (!isUnlimited(dailyCap)) {
    await incrementDailySparkHelperUsage(supabase, { userId: user.id, date: today });
  }

  const newRemaining = isUnlimited(quickWinCap)
    ? UNLIMITED_SENTINEL
    : Math.max(0, quickWinCap - (usedSoFar + 1));
  const newDailyRemaining = isUnlimited(dailyCap)
    ? UNLIMITED_SENTINEL
    : Math.max(0, dailyCap - (dailyUsed + 1));

  // Heuristic personalization audit (BUG 2 mitigation). When (a) the
  // learner clearly asked for a project-fitted example, (b) a real
  // project description is available, and (c) the reply doesn't mention
  // any significant project token, surface a flag the client uses to
  // fire the PostHog `spark_helper_missed_personalization` event. We
  // don't act on it server-side — it's purely an aggregate signal.
  const missedPersonalization =
    projectContext !== null &&
    !projectIsVague &&
    isAskingPersonalizedExample(message) &&
    !replyCitesProject(result.reply, projectContext);

  return NextResponse.json({
    reply: result.reply,
    remaining: newRemaining,
    limit: isUnlimited(quickWinCap) ? UNLIMITED_SENTINEL : quickWinCap,
    dailyRemaining: newDailyRemaining,
    dailyLimit: isUnlimited(dailyCap) ? UNLIMITED_SENTINEL : dailyCap,
    missedPersonalization,
  });
}

export const dynamic = "force-dynamic";
