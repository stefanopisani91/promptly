import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isLang, type Lang } from "@/types";
import { resolveLangFromRequest } from "@/lib/i18n/server-lang";
import {
  getLessonProgress,
  getUserProfile,
  logSafetyEvent,
  logUsageEvent,
} from "@/lib/supabase/queries";
import { evaluateAnatomy } from "@/lib/lessons/v3/anatomy-evaluate";
import { getProjectDescriptionShort } from "@/lib/onboarding/project";

// Path 2 Lesson 1 — prompt anatomy builder evaluator.
//
// Auth-gated. Two layers of anti-abuse on top of input validation:
//   A. Per-lesson cap (3 attempts) — read from user_progress.step_state
//      for this step. Mirrors the client-side counter so a curl loop
//      can't bypass the UI limit.
//   B. Cheap regex pre-filter for prompt-injection patterns. Blocking
//      when hit; the attempt is logged to spark_safety_log for review.
//
// Per-day quota is intentionally skipped on first cut — adding it would
// require a new spark_usage_daily column (migration) and the per-lesson
// cap + injection filter already give solid coverage. Easy to layer in
// later by following the lesson-constraints-evaluate route.

const MIN_TASK_CHARS = 12;
const MAX_TASK_CHARS = 500;
const MAX_ASSEMBLED_CHARS = 2_500;
const MAX_SCENARIO_BRIEF_CHARS = 500;
const MAX_LESSON_ATTEMPTS = 3;

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
  /set\s+(the\s+)?(total|score|task|feedback_case)\s+to/i,
  /imposta\s+(il\s+)?(totale|punteggio|task)\s+a/i,
  /return\s+(?:total|feedback_case|task)\s*[:=]/i,
];

interface RequestBody {
  lessonId?: unknown;
  stepId?: unknown;
  task?: unknown;
  assembledPrompt?: unknown;
  scenarioBrief?: unknown;
  tileScores?: unknown;
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
  if (lessonId !== "prompt-01") {
    return NextResponse.json({ error: "invalid_lesson_id" }, { status: 400 });
  }

  const stepId = typeof body.stepId === "string" ? body.stepId : null;
  if (!stepId || !/^[a-z][a-z0-9-]{0,99}$/.test(stepId)) {
    return NextResponse.json({ error: "invalid_step_id" }, { status: 400 });
  }

  const task = validateText(body.task, MIN_TASK_CHARS, MAX_TASK_CHARS);
  if (!task) {
    return NextResponse.json({ error: "invalid_task" }, { status: 400 });
  }

  const assembledPrompt = validateText(
    body.assembledPrompt,
    1,
    MAX_ASSEMBLED_CHARS,
  );
  if (!assembledPrompt) {
    return NextResponse.json(
      { error: "invalid_assembled_prompt" },
      { status: 400 },
    );
  }

  const scenarioBrief = validateText(
    body.scenarioBrief,
    1,
    MAX_SCENARIO_BRIEF_CHARS,
  );
  if (!scenarioBrief) {
    return NextResponse.json(
      { error: "invalid_scenario_brief" },
      { status: 400 },
    );
  }

  const tileScores = parseTileScores(body.tileScores);
  if (!tileScores) {
    return NextResponse.json({ error: "invalid_tile_scores" }, { status: 400 });
  }

  // ── B. Injection pre-filter (blocking) + safety log.
  // We only check the user's free-text TASK — the assembled prompt + the
  // scenario brief are server-supplied templates concatenated with the
  // task, so checking them would just produce duplicate hits.
  if (matchesInjection(task)) {
    logSafetyEvent(supabase, {
      userId: user.id,
      lessonId,
      signal: "anatomy_injection_attempt",
      excerpt: task,
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
      endpoint: "lesson-anatomy-evaluate",
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

  const lang: Lang = isLang(profile.language)
    ? profile.language
    : resolveLangFromRequest();

  const result = await evaluateAnatomy({
    lang,
    task,
    assembledPrompt,
    scenarioBrief,
    tileScores,
    attempt:
      typeof body.attempt === "number" && Number.isFinite(body.attempt)
        ? Math.max(1, Math.min(5, Math.round(body.attempt)))
        : persistedAttempts + 1,
    preferredTool: profile.preferred_tool,
    experienceLevel: profile.experience_level,
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
    return NextResponse.json({ error: "invalid_ai_response" }, { status: 502 });
  }

  return NextResponse.json({ evaluation: result.evaluation });
}

function validateText(raw: unknown, min: number, max: number): string | null {
  if (typeof raw !== "string") return null;
  const t = raw.trim();
  if (t.length < min) return null;
  if (t.length > max) return null;
  return t;
}

function parseTileScores(
  raw: unknown,
): { context: number; constraints: number; format: number } | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const context = clampTile(r.context);
  const constraints = clampTile(r.constraints);
  const format = clampTile(r.format);
  if (context === null || constraints === null || format === null) return null;
  return { context, constraints, format };
}

function clampTile(v: unknown): number | null {
  if (typeof v !== "number" || !Number.isFinite(v)) return null;
  return Math.max(0, Math.min(25, Math.round(v)));
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
