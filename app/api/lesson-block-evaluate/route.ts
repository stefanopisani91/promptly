import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  isLang,
  type BlockLevel,
  type BlockOption,
  type BlockPickerEvaluation,
  type BlockQuality,
  type Lang,
} from "@/types";
import { resolveLangFromRequest } from "@/lib/i18n/server-lang";
import {
  getLessonProgress,
  getUserProfile,
  logUsageEvent,
} from "@/lib/supabase/queries";
import { loadLessonById } from "@/lib/lessons/load";
import { isLessonV3Content } from "@/types";

// Lesson 3 — block_picker deterministic evaluator.
//
// Auth-gated. Scoring is pure server-side math (no AI call):
//
//   COVERAGE  +10 per level covered (max 40 = all 4)
//   QUALITY   +15 correct / +5 generic / -5 off_scenario per block
//
//   feedback_case (priority order):
//     levelsCovered < 4 OR totalScore < 60   → "incomplete"
//     totalScore === 100 AND all 4 correct    → "excellent"
//     totalScore >= 80                        → "good"
//     otherwise                               → "missing_one"
//
// Anti-abuse layers retained:
//   A. Per-lesson cap (3 attempts) — read from user_progress.step_state.
//
// What's dropped vs. the legacy AI evaluator:
//   - No daily quota (deterministic = zero marginal cost).
//   - No injection pre-filter (the body carries block ids, not free text).
//   - No safety logging.
//
// The server NEVER trusts the body for block text / level / quality —
// blocks are resolved by id against the lesson JSON (loaded via
// loadLesson, which runs the strict block_picker validator).

const MAX_LESSON_ATTEMPTS = 3;
const REQUIRED_BLOCKS = 4;
const LESSON_ID = "mindset-03";

interface RequestBody {
  lessonId?: unknown;
  stepId?: unknown;
  scenarioKey?: unknown;
  selectedBlockIds?: unknown;
  attempt?: unknown;
}

// Canned Spark replies per feedback_case × language. Server-only — these
// are model voice, not UI strings (so they don't live in lib/i18n/lessons.ts
// which is client-bundled). Italian uses guillemets («»), no decorative
// emoji, no «bravissimo/geniale» per Spark voice rules.
const SPARK_REPLIES: Record<
  BlockPickerEvaluation["feedback_case"],
  Record<Lang, string>
> = {
  excellent: {
    it: "Quattro su quattro. Hai contestualizzato come si deve: progetto, codice, vincoli, esempi. Questo è un prompt ricco — quello che chiedo io.",
    en: "Four out of four. You contextualised it the way it should be done: project, code, constraints, examples. This is a rich prompt — the kind I ask for.",
  },
  good: {
    it: "Hai coperto i quattro livelli, ma qualche blocco è più generico del possibile. Riprova mirando alle frasi che dicono qualcosa di concreto.",
    en: "You covered all four levels, but some blocks are more generic than they could be. Try again aiming at the lines that say something concrete.",
  },
  missing_one: {
    it: "Quattro livelli coperti, ma alcune scelte non c'entrano con lo scenario. Un prompt ricco è anche pertinente: ogni strato deve parlare di questo progetto.",
    en: "Four levels covered, but some choices don't fit the scenario. A rich prompt is also relevant: every layer has to speak about this project.",
  },
  incomplete: {
    it: "Manca uno strato. Un prompt ricco ha bisogno di tutti e quattro: progetto, codice, vincoli, esempi. Riprova aggiungendo quello che manca.",
    en: "A layer is missing. A rich prompt needs all four: project, code, constraints, examples. Try again by adding the one that's missing.",
  },
};

const LEVEL_ORDER: BlockLevel[] = ["project", "code", "constraints", "examples"];

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
  if (lessonId !== LESSON_ID) {
    return NextResponse.json({ error: "invalid_lesson_id" }, { status: 400 });
  }

  const stepId = typeof body.stepId === "string" ? body.stepId : null;
  if (!stepId || !/^[a-z][a-z0-9-]{0,99}$/.test(stepId)) {
    return NextResponse.json({ error: "invalid_step_id" }, { status: 400 });
  }

  const scenarioKey =
    typeof body.scenarioKey === "string" ? body.scenarioKey : null;
  if (!scenarioKey || !/^[a-z][a-z0-9_-]{0,40}$/.test(scenarioKey)) {
    return NextResponse.json({ error: "invalid_scenario" }, { status: 400 });
  }

  const rawIds = Array.isArray(body.selectedBlockIds)
    ? body.selectedBlockIds
    : null;
  if (
    !rawIds ||
    rawIds.length !== REQUIRED_BLOCKS ||
    !rawIds.every((x) => typeof x === "string" && x.length <= 80)
  ) {
    return NextResponse.json({ error: "invalid_block_ids" }, { status: 400 });
  }
  const selectedIds = rawIds as string[];
  // No duplicates.
  if (new Set(selectedIds).size !== selectedIds.length) {
    return NextResponse.json({ error: "invalid_block_ids" }, { status: 400 });
  }

  const lang: Lang = isLang(profile.language)
    ? profile.language
    : resolveLangFromRequest();

  // Resolve the lesson + scenario + block pool server-side.
  const lesson = await loadLessonById(LESSON_ID, lang);
  if (!lesson || !isLessonV3Content(lesson)) {
    return NextResponse.json({ error: "lesson_not_found" }, { status: 404 });
  }
  const step = lesson.steps.find(
    (s) => s.type === "interactive" && s.id === stepId,
  );
  if (
    !step ||
    step.type !== "interactive" ||
    step.widget !== "block_picker" ||
    !step.block_config
  ) {
    return NextResponse.json({ error: "invalid_step_id" }, { status: 400 });
  }
  const scenario = step.block_config.scenarios.find(
    (s) => s.key === scenarioKey,
  );
  if (!scenario) {
    return NextResponse.json({ error: "invalid_scenario" }, { status: 400 });
  }

  const poolById = new Map<string, BlockOption>();
  for (const b of scenario.blocks) poolById.set(b.id, b);

  // Every id must belong to the pool.
  const resolved: BlockOption[] = [];
  for (const id of selectedIds) {
    const b = poolById.get(id);
    if (!b) {
      return NextResponse.json({ error: "invalid_block_ids" }, { status: 400 });
    }
    resolved.push(b);
  }

  // Max 1 block per level.
  const levelSet = new Set<BlockLevel>();
  for (const b of resolved) {
    if (levelSet.has(b.level)) {
      return NextResponse.json({ error: "invalid_block_ids" }, { status: 400 });
    }
    levelSet.add(b.level);
  }

  // ── A. Per-lesson cap (read persisted attempts, ignore client claim).
  const progress = await getLessonProgress(supabase, user.id, lessonId);
  const persistedAttempts = readPersistedAttempts(progress?.step_state, stepId);
  if (persistedAttempts >= MAX_LESSON_ATTEMPTS) {
    void logUsageEvent(supabase, {
      userId: user.id,
      accountType: profile.account_type,
      eventType: "lesson_attempts",
      endpoint: "lesson-block-evaluate",
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

  const evaluation = scoreBlocks(resolved, lang);
  return NextResponse.json({ evaluation });
}

function scoreBlocks(
  selected: BlockOption[],
  lang: Lang,
): BlockPickerEvaluation {
  const perBlock = selected.map((b) => ({
    blockId: b.id,
    level: b.level,
    quality: b.quality,
    points: pointsForQuality(b.quality),
  }));
  const coveredSet = new Set<BlockLevel>(selected.map((b) => b.level));
  const levelsCovered = LEVEL_ORDER.filter((l) => coveredSet.has(l));
  const coverageBonus = levelsCovered.length * 10;
  const pertinenceTotal = perBlock.reduce((sum, p) => sum + p.points, 0);
  const raw = coverageBonus + pertinenceTotal;
  const totalScore = Math.max(0, Math.min(100, raw));

  const allCorrect = perBlock.every((p) => p.quality === "correct");

  let feedback_case: BlockPickerEvaluation["feedback_case"];
  if (levelsCovered.length < 4 || totalScore < 60) {
    feedback_case = "incomplete";
  } else if (totalScore >= 100 && allCorrect) {
    feedback_case = "excellent";
  } else if (totalScore >= 80) {
    // A "good" run can still hide an off_scenario block — only flag
    // "missing_one" if at least one off_scenario block is in the mix.
    const hasOff = perBlock.some((p) => p.quality === "off_scenario");
    feedback_case = hasOff ? "missing_one" : "good";
  } else {
    feedback_case = "missing_one";
  }

  let missing_level: BlockLevel | undefined;
  if (levelsCovered.length === 3) {
    missing_level = LEVEL_ORDER.find((l) => !coveredSet.has(l));
  }

  return {
    perBlock,
    levelsCovered,
    coverageBonus,
    totalScore,
    feedback_case,
    spark_reply: SPARK_REPLIES[feedback_case][lang],
    missing_level,
  };
}

function pointsForQuality(q: BlockQuality): number {
  switch (q) {
    case "correct":
      return 15;
    case "generic":
      return 5;
    case "off_scenario":
      return -5;
  }
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
