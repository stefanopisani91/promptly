"use client";

// BLOCK_PICKER — interactive widget for Lesson 3.
//
// Flow (Lezione3_QuickWin_V4_Blueprint.md):
//   1. The user sees the scenario brief + an empty starter prompt at the top.
//   2. Below sits a pool of 12 pre-written blocks (4 levels × 3 qualities).
//      Tapping a block adds it to the rich prompt being composed. Tapping a
//      block of an already-filled level REPLACES the previous occupant
//      (which returns to the pool). Tapping a selected block deselects it.
//   3. Once all 4 levels are covered (selectedIds.length === 4), the "Send
//      to Spark" button unlocks. We call /api/lesson-block-evaluate with
//      the selected block ids; the server resolves the canonical text +
//      quality and returns a deterministic feedback case + canned reply.
//   4. Spark reacts inline. "incomplete" shakes the picker; "missing_one"
//      flashes amber; "good" flashes yellow; "excellent" fires confetti
//      and (when scored 100 with all 4 correct) a fireworks burst.
//   5. 3 attempts max. After the third attempt or after "excellent" the
//      final CTA persists the result and advances.
//
// Generic by design: scenarios is an array so a future lesson can ship the
// same widget with N scenarios + its own pool. Lesson 3 walks on
// scenarios[0] without a scenario picker.

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Send, Sparkles, X } from "lucide-react";
import confetti from "canvas-confetti";
import type {
  BlockLevel,
  BlockOption,
  BlockPickerConfig,
  BlockPickerEvaluation,
  InteractiveStep as InteractiveStepType,
} from "@/types";
import { Spark } from "../Spark";
import { StepCard } from "../StepCard";
import { fireConfetti } from "@/lib/confetti";
import type { InteractiveStepResult } from "./InteractiveStep";

const LEVEL_ORDER: BlockLevel[] = ["project", "code", "constraints", "examples"];

// Per-level pastel palette applied to the composed-prompt blocks (NOT the
// pool below — pool stays neutral so the learner has to recognise the
// level on their own). Each entry pairs a soft surface, a faint border
// and a deeper label tint.
const LEVEL_COLORS: Record<
  BlockLevel,
  { surface: string; border: string; label: string }
> = {
  project: {
    surface: "bg-blue-50",
    border: "border-blue-200",
    label: "text-blue-700",
  },
  code: {
    surface: "bg-emerald-50",
    border: "border-emerald-200",
    label: "text-emerald-700",
  },
  constraints: {
    surface: "bg-orange-50",
    border: "border-orange-200",
    label: "text-orange-700",
  },
  examples: {
    surface: "bg-violet-50",
    border: "border-violet-200",
    label: "text-violet-700",
  },
};

export type BlockPickerFeedbackCase = BlockPickerEvaluation["feedback_case"];

export interface BlockPickerStrings {
  intro: string;
  // Eyebrow above the empty starter line ("PROMPT DI PARTENZA").
  emptyPromptLabel: string;
  // Eyebrow above the composed rich prompt ("IL TUO PROMPT RICCO").
  richPromptLabel: string;
  // Placeholder shown inside the empty composed-prompt card.
  composedPlaceholder: string;
  // Eyebrow above the pool of blocks ("BLOCCHI DISPONIBILI").
  poolLabel: string;
  // "{covered} / {total} livelli" counter under the composed prompt.
  levelsCounterTemplate: string;
  // Submit hint when not yet 4/4 covered. "{missing}" = the localised
  // missing level labels, joined.
  submitHintIncomplete: string;
  // Helper line shown under the pool: "tocca un blocco per ogni livello".
  poolHelper: string;
  attemptCounterTemplate: string;
  submitCta: string;
  submitting: string;
  retryCta: string;
  finalCta: string;
  awaitingPrompt: string;
  outOfAttempts: string;
  networkError: string;
  apiError: string;
  rateLimitError: string;
  invalidInputError: string;
  // Localised labels for the 4 levels — used as chips above the
  // composed-prompt blocks ([PROGETTO] / [CODICE] / [VINCOLI] / [ESEMPI]).
  levelLabels: Record<BlockLevel, string>;
  // Used in the "manca: …" hint to join level names.
  levelLabelsAccusative?: Record<BlockLevel, string>;
}

interface Props {
  step: InteractiveStepType;
  userId: string;
  strings: BlockPickerStrings;
  state:
    | {
        result?: InteractiveStepResult;
        selectedBlockIds?: string[];
        // Persisted from the last submit so Spark's reply + the score
        // survive navigation/reload (rule #3 in LESSON-GUIDELINES.md §V3).
        lastEvaluation?: BlockPickerEvaluation;
        lastReaction?: string;
      }
    | undefined;
  onComplete: (
    result: InteractiveStepResult,
    extras: {
      selectedBlockIds: string[];
      lastEvaluation: BlockPickerEvaluation | null;
      lastReaction: string | null;
    },
  ) => void;
  onAdvance: () => void;
}

export function BlockPicker({
  step,
  userId,
  strings,
  state,
  onComplete,
  onAdvance,
}: Props) {
  const config = step.block_config!;
  const scenario = config.scenarios[0];
  const persisted = state?.result;
  const finishedRef = useRef(Boolean(persisted));
  // Synchronous lock against double-submit (Regola 2 — LESSON-GUIDELINES.md §V3).
  const submitInFlightRef = useRef(false);

  const sessionStorageKey = `block_picker:${userId}:${step.id}`;

  // Initial state must be server-coherent (no sessionStorage access) so
  // the first client render matches the server HTML — otherwise the
  // levels-covered counter triggers a hydration mismatch. The
  // sessionStorage draft is merged in a useEffect on mount.
  const [selectedIds, setSelectedIds] = useState<string[]>(
    state?.selectedBlockIds ?? [],
  );
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const cached = window.sessionStorage.getItem(sessionStorageKey);
      if (!cached) return;
      const parsed = JSON.parse(cached) as unknown;
      if (
        !Array.isArray(parsed) ||
        !parsed.every((x) => typeof x === "string")
      ) {
        return;
      }
      // Only override if the cache differs from server state — avoids
      // a useless re-render on the common case.
      const cachedIds = parsed as string[];
      const serverIds = state?.selectedBlockIds ?? [];
      const same =
        cachedIds.length === serverIds.length &&
        cachedIds.every((id, i) => id === serverIds[i]);
      if (!same) setSelectedIds(cachedIds);
    } catch {
      /* ignore */
    }
    // Intentionally runs once on mount; sessionStorageKey is stable for
    // the lifetime of this widget instance.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [attemptCount, setAttemptCount] = useState(persisted?.attempts ?? 0);
  const [bestScore, setBestScore] = useState(persisted?.bestScore ?? 0);
  const [evaluation, setEvaluation] = useState<BlockPickerEvaluation | null>(
    state?.lastEvaluation ?? null,
  );
  const [reaction, setReaction] = useState<string | null>(
    state?.lastReaction ?? state?.lastEvaluation?.spark_reply ?? null,
  );
  const [evaluating, setEvaluating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pickerEffect, setPickerEffect] = useState<
    "shake" | "flashAmber" | "flashYellow" | "glowGreen" | null
  >(null);
  // The id of the block currently being faded out as part of a "replace"
  // animation. Used to cross-fade the new block in without layout shift.
  const [replacingId, setReplacingId] = useState<string | null>(null);

  // Build a quick lookup for resolving a block id → its metadata.
  const blockById = useMemo(() => {
    const m = new Map<string, BlockOption>();
    for (const b of scenario.blocks) m.set(b.id, b);
    return m;
  }, [scenario.blocks]);

  const selectedBlocks = useMemo(
    () =>
      selectedIds
        .map((id) => blockById.get(id))
        .filter((b): b is BlockOption => Boolean(b)),
    [selectedIds, blockById],
  );

  const levelsCovered = useMemo(() => {
    const set = new Set<BlockLevel>();
    for (const b of selectedBlocks) set.add(b.level);
    return set;
  }, [selectedBlocks]);

  const missingLevels = useMemo(
    () => LEVEL_ORDER.filter((l) => !levelsCovered.has(l)),
    [levelsCovered],
  );

  const exhausted = attemptCount >= step.max_attempts;
  const won =
    evaluation?.feedback_case === "excellent" &&
    (evaluation?.totalScore ?? 0) >= 100;

  const submitDisabled =
    evaluating ||
    levelsCovered.size < config.required_blocks ||
    selectedIds.length < config.required_blocks ||
    exhausted ||
    won;

  // Reset picker effect once the CSS animation settles so a retry can
  // re-trigger the same effect.
  useEffect(() => {
    if (!pickerEffect) return;
    const t = window.setTimeout(() => setPickerEffect(null), 1100);
    return () => window.clearTimeout(t);
  }, [pickerEffect]);

  // Autosave selection to sessionStorage so the user doesn't lose work on
  // tab refresh / step navigation. Skipped on SSR + after the run is final.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (finishedRef.current) return;
    try {
      window.sessionStorage.setItem(
        sessionStorageKey,
        JSON.stringify(selectedIds),
      );
    } catch {
      /* sessionStorage may be disabled (private mode) — silent skip */
    }
  }, [selectedIds, sessionStorageKey]);

  const handleTap = useCallback(
    (block: BlockOption) => {
      if (evaluating || won || exhausted) return;
      // Deselect if already selected.
      if (selectedIds.includes(block.id)) {
        setSelectedIds((prev) => prev.filter((id) => id !== block.id));
        return;
      }
      // Find current occupant of the same level (if any).
      const occupantId = selectedBlocks.find((b) => b.level === block.level)?.id;
      if (occupantId) {
        setReplacingId(occupantId);
        window.setTimeout(() => {
          setSelectedIds((prev) =>
            prev.filter((id) => id !== occupantId).concat(block.id),
          );
          setReplacingId(null);
        }, 150);
        return;
      }
      // Slot free — append.
      setSelectedIds((prev) => [...prev, block.id]);
    },
    [evaluating, won, exhausted, selectedIds, selectedBlocks],
  );

  const handleRemove = useCallback(
    (id: string) => {
      if (evaluating || won || exhausted) return;
      setSelectedIds((prev) => prev.filter((x) => x !== id));
    },
    [evaluating, won, exhausted],
  );

  const handleSubmit = useCallback(async () => {
    if (submitInFlightRef.current) return;
    if (submitDisabled) return;
    submitInFlightRef.current = true;
    setEvaluating(true);
    setError(null);
    try {
      const res = await fetch("/api/lesson-block-evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonId: "mindset-03",
          stepId: step.id,
          scenarioKey: scenario.key,
          selectedBlockIds: selectedIds,
          attempt: attemptCount + 1,
        }),
      });
      if (!res.ok) {
        let payload: { error?: string; limit?: number; used?: number } = {};
        try {
          payload = (await res.json()) as typeof payload;
        } catch {
          /* keep payload empty */
        }
        if (res.status === 400) {
          setError(strings.invalidInputError);
        } else if (
          res.status === 403 &&
          payload.error === "lesson_attempts_exceeded"
        ) {
          setAttemptCount(step.max_attempts);
          setError(strings.outOfAttempts);
        } else if (res.status === 429) {
          setError(strings.rateLimitError);
        } else if (res.status === 502 || res.status === 503) {
          setError(strings.networkError);
        } else {
          setError(strings.apiError);
        }
        return;
      }
      const body = (await res.json()) as {
        evaluation?: BlockPickerEvaluation;
      };
      const ev = body.evaluation;
      if (!ev) {
        setError(strings.apiError);
        return;
      }
      setEvaluation(ev);
      setReaction(ev.spark_reply);
      const newAttempt = attemptCount + 1;
      setAttemptCount(newAttempt);
      const newBest = Math.max(bestScore, ev.totalScore);
      setBestScore(newBest);
      setPickerEffect(effectForCase(ev.feedback_case));
      if (ev.feedback_case === "excellent") {
        fireConfetti();
        if (ev.totalScore >= 100) {
          fireFireworks();
        }
      }
    } catch {
      setError(strings.networkError);
    } finally {
      setEvaluating(false);
      submitInFlightRef.current = false;
    }
  }, [
    submitDisabled,
    selectedIds,
    scenario.key,
    attemptCount,
    bestScore,
    step.id,
    step.max_attempts,
    strings,
  ]);

  function handleFinalize() {
    if (evaluation) {
      const band = bandForCase(evaluation.feedback_case);
      const xpEarned = xpForResult(
        evaluation.feedback_case,
        bestScore,
        config,
        attemptCount,
      );
      onComplete(
        {
          attempts: attemptCount,
          bestScore,
          victory: evaluation.feedback_case === "excellent",
          band,
          xpEarned,
        },
        {
          selectedBlockIds: selectedIds,
          lastEvaluation: evaluation,
          lastReaction: reaction,
        },
      );
    }
    finishedRef.current = true;
    onAdvance();
  }

  const sparkLine = reaction ?? strings.awaitingPrompt;
  const showFinalCta =
    won || exhausted || attemptCount >= 1 || Boolean(persisted);
  const isPartialStop = !won && !exhausted && attemptCount >= 1;

  const levelsCounter = strings.levelsCounterTemplate
    .replace("{covered}", String(levelsCovered.size))
    .replace("{total}", String(config.required_blocks));

  const attemptCounter = strings.attemptCounterTemplate
    .replace(
      "{current}",
      String(Math.min(attemptCount + 1, step.max_attempts)),
    )
    .replace("{max}", String(step.max_attempts));

  const submitHint = (() => {
    if (evaluating || won || exhausted || !submitDisabled) return null;
    if (levelsCovered.size < config.required_blocks) {
      const labels = strings.levelLabelsAccusative ?? strings.levelLabels;
      const missing = missingLevels.map((l) => labels[l]).join(", ");
      return strings.submitHintIncomplete.replace("{missing}", missing);
    }
    return null;
  })();

  const pickerEffectClass =
    pickerEffect === "shake"
      ? "claudemd-editor-shake"
      : pickerEffect === "flashAmber"
      ? "claudemd-editor-flash-amber"
      : pickerEffect === "flashYellow"
      ? "claudemd-editor-flash-yellow"
      : pickerEffect === "glowGreen"
      ? "claudemd-editor-glow-green"
      : "";

  // Compose preview blocks ordered by canonical level order (project →
  // code → constraints → examples), not by tap order. Reads cleaner.
  const orderedSelected = useMemo(() => {
    const byLevel = new Map<BlockLevel, BlockOption>();
    for (const b of selectedBlocks) byLevel.set(b.level, b);
    return LEVEL_ORDER.map((l) => byLevel.get(l)).filter(
      (b): b is BlockOption => Boolean(b),
    );
  }, [selectedBlocks]);

  return (
    <StepCard wide>
      <div className="flex flex-col gap-5">
        {step.intro && (
          <p className="text-base leading-relaxed text-text-secondary sm:text-lg">
            {step.intro}
          </p>
        )}

        {/* Empty starter prompt (read-only, "where you come from") */}
        <div className="rounded-2xl border-2 border-dashed border-border bg-surface-muted/40 p-4">
          <p className="eyebrow mb-2 text-text-muted">
            {strings.emptyPromptLabel}
          </p>
          <p className="font-mono text-sm italic leading-relaxed text-text-muted">
            “{scenario.empty_prompt}”
          </p>
        </div>

        {/* Composed rich prompt (the live target) */}
        <div
          className={`rounded-2xl border-2 border-primary/40 bg-white p-4 transition-shadow ${
            pickerEffect ? pickerEffectClass : ""
          }`}
        >
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-primary-deep" aria-hidden="true" />
              <p className="eyebrow text-primary-deep">
                {strings.richPromptLabel}
              </p>
            </div>
            <p className="font-mono text-[11px] text-text-muted">
              {levelsCounter}
            </p>
          </div>
          {orderedSelected.length === 0 ? (
            <p className="text-sm italic leading-relaxed text-text-muted">
              {strings.composedPlaceholder}
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {orderedSelected.map((b) => {
                const palette = LEVEL_COLORS[b.level];
                return (
                  <li
                    key={b.id}
                    className={`flex flex-col gap-1 rounded-xl border ${palette.border} ${palette.surface} p-3 transition-all duration-150 ${
                      replacingId === b.id ? "opacity-0 -translate-y-1" : "opacity-100 translate-y-0"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className={`font-mono text-[10px] uppercase tracking-wider ${palette.label}`}>
                        [{strings.levelLabels[b.level]}]
                      </span>
                      {!won && !exhausted && !evaluating && (
                        <button
                          type="button"
                          onClick={() => handleRemove(b.id)}
                          aria-label={`Remove ${strings.levelLabels[b.level]}`}
                          className="flex h-7 w-7 items-center justify-center rounded-full text-text-muted hover:bg-surface-muted hover:text-text-primary"
                        >
                          <X size={14} aria-hidden="true" />
                        </button>
                      )}
                    </div>
                    <p className="text-sm leading-relaxed text-text-primary">
                      {b.text}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Pool of 12 available blocks */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="eyebrow text-text-muted">{strings.poolLabel}</p>
            <p className="text-[11px] italic text-text-muted">
              {strings.poolHelper}
            </p>
          </div>
          <ul className="grid auto-rows-fr grid-cols-1 gap-3 sm:grid-cols-2">
            {scenario.blocks
              .filter((b) => !selectedIds.includes(b.id))
              .map((b) => {
                const disabled = evaluating || won || exhausted;
                return (
                  <li key={b.id} className="h-full">
                    <button
                      type="button"
                      onClick={() => handleTap(b)}
                      disabled={disabled}
                      className={`flex h-full min-h-[44px] w-full items-start rounded-xl border border-stone-200 bg-white p-3 text-left text-sm leading-relaxed text-text-primary transition-all duration-150 hover:border-stone-300 hover:bg-stone-50 active:scale-[0.98] ${
                        disabled ? "cursor-not-allowed opacity-60 active:scale-100" : ""
                      }`}
                    >
                      <span>{b.text}</span>
                    </button>
                  </li>
                );
              })}
          </ul>
        </div>

        {/* Spark dialogue panel */}
        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <Spark
              state={
                won
                  ? "happy"
                  : evaluating
                  ? "thinking"
                  : evaluation?.feedback_case === "incomplete"
                  ? "sad"
                  : evaluation
                  ? "thinking"
                  : "listening"
              }
              size={48}
            />
            <div className="flex-1">
              <p className="eyebrow mb-1 text-primary-deep">spark</p>
              <p className="text-sm italic leading-relaxed text-text-primary">
                {sparkLine}
              </p>
              {evaluation && (
                <p className="mt-2 font-mono text-[10px] text-text-muted">
                  Σ {evaluation.totalScore}/100 · {attemptCounter}
                </p>
              )}
            </div>
          </div>

          {!won && !exhausted && (
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitDisabled}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-primary-hover active:scale-[0.97] disabled:opacity-50 disabled:active:scale-100"
              >
                {evaluating
                  ? strings.submitting
                  : evaluation
                  ? strings.retryCta
                  : strings.submitCta}
                {!evaluating && <Send size={14} aria-hidden="true" />}
              </button>
              {submitHint && (
                <p className="text-[11px] italic leading-relaxed text-text-muted">
                  {submitHint}
                </p>
              )}
              {error && (
                <div
                  className="flex items-start gap-2 rounded-xl border border-error/30 bg-error/5 px-3 py-2"
                  role="status"
                >
                  <Spark state="sad" size={28} />
                  <p className="text-xs leading-relaxed text-text-primary">
                    {error}
                  </p>
                </div>
              )}
            </div>
          )}

          {exhausted && !won && (
            <p className="text-xs italic text-text-muted">
              {strings.outOfAttempts}
            </p>
          )}

          {showFinalCta && (
            <button
              type="button"
              onClick={handleFinalize}
              className={`mt-3 inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition-all active:scale-[0.97] ${
                isPartialStop
                  ? "border border-border bg-surface text-text-primary hover:bg-surface-muted"
                  : "bg-primary text-white hover:bg-primary-hover"
              }`}
            >
              {strings.finalCta}
            </button>
          )}
        </div>
      </div>
    </StepCard>
  );
}

function effectForCase(
  c: BlockPickerFeedbackCase,
): "shake" | "flashAmber" | "flashYellow" | "glowGreen" | null {
  switch (c) {
    case "incomplete":
      return "shake";
    case "missing_one":
      return "flashAmber";
    case "good":
      return "flashYellow";
    case "excellent":
      return "glowGreen";
    default:
      return null;
  }
}

function bandForCase(
  c: BlockPickerFeedbackCase,
): InteractiveStepResult["band"] {
  switch (c) {
    case "incomplete":
      return "poor";
    case "missing_one":
      return "one_bug";
    case "good":
      return "all_bugs";
    case "excellent":
      return "perfect";
  }
}

function xpForResult(
  c: BlockPickerFeedbackCase,
  bestScore: number,
  config: BlockPickerConfig,
  attempts: number,
): number {
  const xp = config.xp_by_case;
  const base =
    c === "excellent"
      ? xp.excellent
      : c === "good"
      ? xp.good
      : c === "missing_one"
      ? xp.missing_one
      : xp.incomplete;
  // First-attempt bonus only on excellent (mirrors the legacy editor's
  // "perfect" tier — the XP table compresses to 4 buckets, so the bonus
  // path lives on top of `excellent` rather than as a 5th bucket).
  if (c === "excellent" && attempts === 1 && bestScore >= 100) return base + 50;
  return base;
}

function fireFireworks(): void {
  if (typeof window === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const palette = ["#E8703F", "#EAB308", "#16A34A", "#FFF1EB"];
  const burst = () => {
    confetti({
      particleCount: 50,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.6 },
      colors: palette,
    });
    confetti({
      particleCount: 50,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.6 },
      colors: palette,
    });
  };
  burst();
  window.setTimeout(burst, 400);
  window.setTimeout(burst, 800);
}
