// Archetype scoring for V3 lessons. Pure functions — no I/O. The container
// collects each CHOICE answer that has `scores_archetype: true`, then calls
// `resolveArchetype` once we hit the REWARD step to figure out which result
// to display.
//
// Tie-breaking: we sort archetype keys by the lesson's `tie_breaker_priority`
// list (lower index wins). This keeps reveals deterministic instead of
// surfacing whichever entry the JS engine happens to hit first.

import type { ArchetypeRevealConfig, LessonV3Step } from "@/types";

export interface ArchetypeAnswer {
  stepId: string;
  archetypeKey: string;
}

/**
 * Walk the lesson body and return every archetype-scoring answer recorded
 * in `stepState`. Steps that don't contribute, or that the user hasn't
 * answered yet, are silently skipped.
 *
 * ChoiceStep persists answers as `{ selectedKey: string }` objects (see
 * LessonV3View.handleChoicePick). Earlier versions of this helper only
 * accepted a bare string and skipped every object, which made the tally
 * always empty and the tie-break loop in `resolveArchetype` collapse to
 * the first key in `tie_breaker_priority` (i.e. "Costruttore Ostinato"
 * for Lesson 1). The flat-string branch is kept as a defensive fallback
 * in case we ever serialise differently in the future.
 */
export function collectArchetypeAnswers(
  steps: LessonV3Step[],
  stepState: Record<string, unknown>,
): ArchetypeAnswer[] {
  const out: ArchetypeAnswer[] = [];
  for (const step of steps) {
    if (step.type !== "choice" || !step.scores_archetype) continue;
    const raw = stepState[step.id];

    let answerKey: string | null = null;
    if (typeof raw === "string") {
      answerKey = raw;
    } else if (raw && typeof raw === "object" && "selectedKey" in raw) {
      const sk = (raw as { selectedKey?: unknown }).selectedKey;
      if (typeof sk === "string") answerKey = sk;
    }
    if (!answerKey) continue;

    const option = step.options.find((o) => o.key === answerKey);
    if (!option || !option.archetype_key) continue;
    out.push({ stepId: step.id, archetypeKey: option.archetype_key });
  }
  return out;
}

export interface ResolvedArchetype {
  key: string;
  title: string;
  description: string;
  // Number of answers that pointed at this archetype.
  score: number;
}

/**
 * Resolve which archetype to show given the user's answers and the reveal
 * config. Falls back to the first archetype in `tie_breaker_priority` when
 * the user has no scoring answers (defensive — should not happen for a
 * complete quiz).
 */
export function resolveArchetype(
  answers: ArchetypeAnswer[],
  config: ArchetypeRevealConfig,
): ResolvedArchetype | null {
  if (config.archetypes.length === 0) return null;

  const counts = new Map<string, number>();
  for (const a of answers) {
    counts.set(a.archetypeKey, (counts.get(a.archetypeKey) ?? 0) + 1);
  }

  let winnerKey: string | null = null;
  let winnerScore = -1;
  for (const key of config.tie_breaker_priority) {
    const score = counts.get(key) ?? 0;
    if (score > winnerScore) {
      winnerScore = score;
      winnerKey = key;
    }
  }

  if (!winnerKey) winnerKey = config.archetypes[0].key;
  const def = config.archetypes.find((a) => a.key === winnerKey);
  if (!def) return null;
  return {
    key: def.key,
    title: def.title,
    description: def.description,
    score: counts.get(def.key) ?? 0,
  };
}
