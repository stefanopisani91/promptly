"use client";

// Top-level interactive widget for Path 2 Lesson 1 ("Anatomy of a great
// prompt"). Mounts inside LessonV3View's `interactive` dispatcher when
// `step.widget === "prompt_anatomy_builder"`.
//
// Owns:
//   - the 6-screen internal flow (intro → ctx → task → constraints →
//     format → review → verdict overlay)
//   - persistence (sessionStorage on every state change, hydration from
//     state + sessionStorage on mount — cascade per LESSON-GUIDELINES R1)
//   - tile scoring (deterministic, client-side, 0-25 each)
//   - the API submit + verdict surfacing
//   - sync-lock against double submit (LESSON-GUIDELINES R2)
//   - reaction persistence so a return-and-leave loop doesn't drop
//     Spark's last reply (R3)
//   - reopenability of screens with attempts remaining (R4)
//
// Five quick-win rules (LESSON-GUIDELINES.md §1-5) are enforced here.
//
// Pedagogy: the BUILDER is the *artefact* — every choice on the way is
// the lesson. The verdict is the cherry, not the meat.

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ArrowRight, ChevronLeft, Send } from "lucide-react";
import type {
  AnatomyDimension,
  AnatomyEvaluation,
  AnatomyFeedbackCase,
  AnatomyOptionTile,
  AnatomyTileBand,
  AnatomyConstraintWeight,
  InteractiveStep as InteractiveStepType,
} from "@/types";
import { SparkSphere } from "@/components/promptly/SparkSphere";
import { StepCard } from "../../StepCard";
import type { InteractiveStepResult } from "../InteractiveStep";
import {
  AnatomyProgressBar,
  type SegmentState,
} from "./AnatomyProgressBar";
import { OptionTile } from "./OptionTile";
import { ScenarioCard, type ScenarioCardStrings } from "./ScenarioCard";
import {
  TaskComposer,
  type TaskChecklistStrings,
} from "./TaskComposer";
import {
  AssembledPromptCard,
  type AssembledPromptStrings,
} from "./AssembledPromptCard";
import {
  SparkVerdict,
  isFinalVerdict,
  type SparkVerdictStrings,
} from "./SparkVerdict";

const FIRST_TRY_BONUS = 60;

const ACCENT_VAR: Record<AnatomyDimension, string> = {
  context: "var(--anatomy-context)",
  task: "var(--anatomy-task)",
  constraints: "var(--anatomy-constraints)",
  format: "var(--anatomy-format)",
};

type AnatomyScreen =
  | "intro"
  | "ctx"
  | "task"
  | "constraints"
  | "format"
  | "review"
  | "verdict";

export interface AnatomyStepStateShape {
  result?: InteractiveStepResult;
  contextTileId?: string | null;
  task?: string;
  constraintTileIds?: string[];
  formatTileId?: string | null;
  lastEvaluation?: AnatomyEvaluation | null;
  lastReaction?: string | null;
}

export interface PromptAnatomyBuilderStrings {
  // Localised dimension labels, used in the progress bar SR text and
  // the assembled-prompt chips.
  dimensionLabels: Record<AnatomyDimension, string>;
  scenario: ScenarioCardStrings;
  // "{current} / {max}" template for the textarea counter.
  charCounterTemplate: string;
  taskChecklist: TaskChecklistStrings;
  // Bottom CTA labels (per ingredient screen).
  continueCta: string;
  // "Posso modificarlo dopo" reassurance below the CTA.
  cta_disabled_hint: {
    context: string;
    task: string;
    constraints: string;
    format: string;
  };
  // "Tentativo {current} / {max}" template for the AttemptDots row.
  attemptCounterTemplate: string;
  // Review screen — section eyebrow + Spark line + submit CTA.
  reviewEyebrow: string;
  reviewSparkPrompt: string;
  submitCta: string;
  submitting: string;
  assembled: AssembledPromptStrings;
  verdict: SparkVerdictStrings;
  // Header text on the constraints screen when the user has hit the
  // cap (already 2 selected, trying to add a 3rd).
  constraintsCapHint: string;
  // Screen titles + helper that wraps the per-question copy.
  questionEyebrows: Record<AnatomyDimension, string>;
  // ARIA-only template for the progress bar.
  progressSrTemplate: string;
  // Error strings shared with the API contract.
  networkError: string;
  apiError: string;
  invalidInputError: string;
  attemptsExceededError: string;
  // Localised stop-message after all 3 attempts spent. Includes the
  // model answer separator copy and the reveal label ("Risposta-modello").
  revealAnswerLabel: string;
  finalCta: string;
}

interface Props {
  step: InteractiveStepType;
  userId: string;
  filenameSlug: string;
  strings: PromptAnatomyBuilderStrings;
  state: AnatomyStepStateShape | undefined;
  onComplete: (
    result: InteractiveStepResult,
    extras: {
      contextTileId: string | null;
      task: string;
      constraintTileIds: string[];
      formatTileId: string | null;
      lastEvaluation: AnatomyEvaluation | null;
      lastReaction: string | null;
    },
  ) => void;
  onAdvance: () => void;
}

export function PromptAnatomyBuilder({
  step,
  userId,
  filenameSlug,
  strings,
  state,
  onComplete,
  onAdvance,
}: Props) {
  const config = step.anatomy_config!;
  const sessionStorageKey = `prompt_anatomy_builder:${userId}:${step.id}`;

  const persisted = state?.result;
  const finishedRef = useRef(Boolean(persisted));
  const submitInFlightRef = useRef(false);

  // ── Hydration cascade: sessionStorage → stepState → empty. Rule R1.
  const hydrated = useMemo(
    () => hydrateState(state, sessionStorageKey),
    [state, sessionStorageKey],
  );
  const [contextTileId, setContextTileId] = useState<string | null>(
    hydrated.contextTileId,
  );
  const [task, setTask] = useState<string>(hydrated.task);
  const [constraintTileIds, setConstraintTileIds] = useState<string[]>(
    hydrated.constraintTileIds,
  );
  const [formatTileId, setFormatTileId] = useState<string | null>(
    hydrated.formatTileId,
  );
  const [attemptsUsed, setAttemptsUsed] = useState<number>(
    hydrated.attemptsUsed,
  );
  const [evaluation, setEvaluation] = useState<AnatomyEvaluation | null>(
    hydrated.lastEvaluation,
  );
  const [lastReaction, setLastReaction] = useState<string | null>(
    hydrated.lastReaction,
  );
  // Persisted "stop point" — drives initial screen on remount. A user
  // who finished → reopen lands on `review` to inspect their work; a
  // user mid-flow lands on the deepest screen they had data for.
  const [screen, setScreen] = useState<AnatomyScreen>(() =>
    derivePersistedScreen(hydrated),
  );

  // Recompute the won + exhausted booleans on every render — they're
  // simple derivations, no point caching.
  const won = evaluation?.feedback_case === "excellent";
  const exhausted = attemptsUsed >= step.max_attempts;
  const attemptsLeft = Math.max(0, step.max_attempts - attemptsUsed);

  // ── Persist state to sessionStorage on every change (rule R1). The
  // finishedRef gate keeps post-finalise navigation from re-saving
  // stale-but-still-tracked state.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (finishedRef.current) return;
    try {
      const payload = {
        contextTileId,
        task,
        constraintTileIds,
        formatTileId,
        attemptsUsed,
        lastEvaluation: evaluation,
        lastReaction,
      };
      window.sessionStorage.setItem(
        sessionStorageKey,
        JSON.stringify(payload),
      );
    } catch {
      /* sessionStorage may be disabled — silent skip */
    }
  }, [
    sessionStorageKey,
    contextTileId,
    task,
    constraintTileIds,
    formatTileId,
    attemptsUsed,
    evaluation,
    lastReaction,
  ]);

  // ── Derived: tile scores (deterministic, never trusted to the AI).
  // 0-25 each. Visible in the progress bar segments and shipped to the
  // API as `tileScores`.
  const contextScore = useMemo(
    () => scoreSingleTile(contextTileId, config.ingredients.context.tiles, config.bands),
    [contextTileId, config.ingredients.context.tiles, config.bands],
  );
  const formatScore = useMemo(
    () => scoreSingleTile(formatTileId, config.ingredients.format.tiles, config.bands),
    [formatTileId, config.ingredients.format.tiles, config.bands],
  );
  const constraintsScore = useMemo(
    () =>
      scoreConstraintTiles(
        constraintTileIds,
        config.ingredients.constraints.tiles,
        config.weights,
      ),
    [
      constraintTileIds,
      config.ingredients.constraints.tiles,
      config.weights,
    ],
  );

  // ── Progress bar segment states.
  const segments: Record<AnatomyDimension, SegmentState> = useMemo(
    () => ({
      context: stateForSingle(contextTileId, config.ingredients.context.tiles),
      task: stateForTaskBucket(task),
      constraints: stateForConstraints(
        constraintTileIds,
        config.ingredients.constraints.tiles,
        config.ingredients.constraints.select_count,
      ),
      format: stateForSingle(formatTileId, config.ingredients.format.tiles),
    }),
    [
      contextTileId,
      task,
      constraintTileIds,
      formatTileId,
      config.ingredients,
    ],
  );

  // ── Assembled prompt — kept in sync with the picks so the review
  // card and the API payload see the exact same string.
  const assembledPrompt = useMemo(() => {
    const ctxTile = config.ingredients.context.tiles.find(
      (t) => t.id === contextTileId,
    );
    const fmtTile = config.ingredients.format.tiles.find(
      (t) => t.id === formatTileId,
    );
    const conTiles = constraintTileIds
      .map((id) =>
        config.ingredients.constraints.tiles.find((t) => t.id === id),
      )
      .filter((t): t is AnatomyOptionTile => Boolean(t));
    const constraintsBody = conTiles.map((t) => t.label).join(" · ");
    return config.assembly_template
      .replace("{context}", ctxTile?.label ?? "—")
      .replace("{task}", task.trim() || "—")
      .replace("{constraints}", constraintsBody || "—")
      .replace("{format}", fmtTile?.label ?? "—");
  }, [
    config.ingredients,
    config.assembly_template,
    contextTileId,
    task,
    constraintTileIds,
    formatTileId,
  ]);

  // ── Navigation helpers.
  const navTo = useCallback((next: AnatomyScreen) => {
    setError(null);
    setScreen(next);
  }, []);

  function startFlow() {
    navTo("ctx");
  }

  // ── API submit at review.
  const [evaluating, setEvaluating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(async () => {
    if (submitInFlightRef.current) return;
    if (evaluating || exhausted || won) return;
    if (!contextTileId || !formatTileId) return;
    if (constraintTileIds.length !== config.ingredients.constraints.select_count) {
      return;
    }
    if (task.trim().length < config.ingredients.task.min_chars) return;

    submitInFlightRef.current = true;
    setEvaluating(true);
    setError(null);
    try {
      const res = await fetch("/api/lesson-anatomy-evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonId: step.id.startsWith("prompt-")
            ? "prompt-01"
            : "prompt-01",
          stepId: step.id,
          task: task.trim().slice(0, config.ingredients.task.max_chars),
          assembledPrompt: assembledPrompt.slice(0, 2400),
          scenarioBrief: config.scenario.brief.slice(0, 480),
          tileScores: {
            context: contextScore,
            constraints: constraintsScore,
            format: formatScore,
          },
          attempt: attemptsUsed + 1,
        }),
      });
      if (!res.ok) {
        const payload = await safeJson(res);
        if (res.status === 400 && payload?.error === "invalid_input") {
          setError(strings.invalidInputError);
        } else if (
          res.status === 403 &&
          payload?.error === "lesson_attempts_exceeded"
        ) {
          setAttemptsUsed(step.max_attempts);
          setError(strings.attemptsExceededError);
        } else if (res.status === 502 || res.status === 503) {
          setError(strings.networkError);
        } else {
          setError(strings.apiError);
        }
        return;
      }
      const body = (await res.json()) as { evaluation?: AnatomyEvaluation };
      const ev = body.evaluation;
      if (!ev) {
        setError(strings.apiError);
        return;
      }
      setEvaluation(ev);
      setLastReaction(ev.spark_reply);
      setAttemptsUsed((n) => n + 1);
      navTo("verdict");
    } catch {
      setError(strings.networkError);
    } finally {
      setEvaluating(false);
      submitInFlightRef.current = false;
    }
  }, [
    evaluating,
    exhausted,
    won,
    contextTileId,
    formatTileId,
    constraintTileIds.length,
    task,
    config.ingredients.constraints.select_count,
    config.ingredients.task.min_chars,
    config.ingredients.task.max_chars,
    config.scenario.brief,
    assembledPrompt,
    contextScore,
    constraintsScore,
    formatScore,
    attemptsUsed,
    step.id,
    step.max_attempts,
    strings.invalidInputError,
    strings.attemptsExceededError,
    strings.networkError,
    strings.apiError,
    navTo,
  ]);

  // ── Finalise → notify parent + advance to the next lesson step.
  function handleFinalize() {
    if (evaluation) {
      const xpEarned = xpForResult(
        evaluation.feedback_case,
        attemptsUsed,
        config.xp_by_case,
      );
      const band = bandForCase(evaluation.feedback_case);
      onComplete(
        {
          attempts: attemptsUsed,
          bestScore: evaluation.total,
          victory: evaluation.feedback_case === "excellent",
          band,
          xpEarned,
        },
        {
          contextTileId,
          task,
          constraintTileIds,
          formatTileId,
          lastEvaluation: evaluation,
          lastReaction,
        },
      );
    } else {
      // Persist whatever state we have so a re-open lands here.
      onComplete(
        {
          attempts: attemptsUsed,
          bestScore: 0,
          victory: false,
          band: "poor",
          xpEarned: 0,
        },
        {
          contextTileId,
          task,
          constraintTileIds,
          formatTileId,
          lastEvaluation: null,
          lastReaction: null,
        },
      );
    }
    finishedRef.current = true;
    onAdvance();
  }

  const activeIndex =
    screen === "ctx"
      ? 0
      : screen === "task"
      ? 1
      : screen === "constraints"
      ? 2
      : screen === "format"
      ? 3
      : 0;

  // ── Render — intro is layout-only; ingredient/review/verdict share
  // the same shell (back chevron + progress bar + body).
  return (
    <StepCard wide>
      <div className="flex flex-col gap-4">
        {step.intro && screen === "intro" && (
          <p className="text-base leading-relaxed text-text-secondary sm:text-lg">
            {step.intro}
          </p>
        )}

        {screen === "intro" && (
          <ScenarioCard
            mode="intro"
            scenario={config.scenario}
            strings={strings.scenario}
            onStart={startFlow}
          />
        )}

        {screen !== "intro" && screen !== "verdict" && (
          <>
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={backFrom(screen, navTo)}
                aria-label="Indietro"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-text-muted transition-colors hover:bg-surface-muted"
                style={{ touchAction: "manipulation" }}
              >
                <ChevronLeft size={16} />
              </button>
              <AttemptDots used={attemptsUsed} max={step.max_attempts} />
            </div>

            <AnatomyProgressBar
              segments={segments}
              activeIndex={activeIndex}
              srTemplate={strings.progressSrTemplate}
              dimensionLabels={strings.dimensionLabels}
            />

            {screen === "ctx" && (
              <ScenarioCard
                mode="summary"
                scenario={config.scenario}
                strings={strings.scenario}
              />
            )}
          </>
        )}

        {screen === "ctx" && (
          <IngredientShell
            eyebrow={strings.questionEyebrows.context}
            question={config.ingredients.context.question}
            accent={ACCENT_VAR.context}
            ctaLabel={strings.continueCta}
            ctaDisabled={contextTileId === null}
            ctaDisabledHint={strings.cta_disabled_hint.context}
            onCta={() => navTo("task")}
            coaching={
              findTile(config.ingredients.context.tiles, contextTileId)?.coaching
            }
          >
            <TilesGrid
              role="radio"
              tiles={config.ingredients.context.tiles}
              selectedIds={contextTileId ? [contextTileId] : []}
              accent={ACCENT_VAR.context}
              disabled={evaluating || won}
              onToggle={(id) =>
                setContextTileId((prev) => (prev === id ? null : id))
              }
            />
          </IngredientShell>
        )}

        {screen === "task" && (
          <IngredientShell
            eyebrow={strings.questionEyebrows.task}
            question={config.ingredients.task.question}
            accent={ACCENT_VAR.task}
            ctaLabel={strings.continueCta}
            ctaDisabled={
              task.trim().length < config.ingredients.task.min_chars
            }
            ctaDisabledHint={strings.cta_disabled_hint.task}
            onCta={() => navTo("constraints")}
          >
            <TaskComposer
              spec={config.ingredients.task}
              value={task}
              onChange={setTask}
              checklist={strings.taskChecklist}
              charCounterTemplate={strings.charCounterTemplate}
              disabled={evaluating || won}
            />
          </IngredientShell>
        )}

        {screen === "constraints" && (
          <IngredientShell
            eyebrow={strings.questionEyebrows.constraints}
            question={config.ingredients.constraints.question}
            accent={ACCENT_VAR.constraints}
            ctaLabel={strings.continueCta}
            ctaDisabled={
              constraintTileIds.length !==
              config.ingredients.constraints.select_count
            }
            ctaDisabledHint={strings.cta_disabled_hint.constraints}
            onCta={() => navTo("format")}
            coaching={
              constraintTileIds.length ===
              config.ingredients.constraints.select_count
                ? collectiveConstraintsCoaching(
                    constraintTileIds,
                    config.ingredients.constraints.tiles,
                  )
                : undefined
            }
          >
            <TilesGrid
              role="checkbox"
              tiles={config.ingredients.constraints.tiles}
              selectedIds={constraintTileIds}
              accent={ACCENT_VAR.constraints}
              disabled={evaluating || won}
              onToggle={(id) => {
                setConstraintTileIds((prev) => {
                  if (prev.includes(id)) return prev.filter((x) => x !== id);
                  if (prev.length >= config.ingredients.constraints.select_count)
                    return prev; // hard cap — silently no-op (UI shows capHint)
                  return [...prev, id];
                });
              }}
              capHint={
                constraintTileIds.length >=
                config.ingredients.constraints.select_count
                  ? strings.constraintsCapHint
                  : null
              }
            />
          </IngredientShell>
        )}

        {screen === "format" && (
          <IngredientShell
            eyebrow={strings.questionEyebrows.format}
            question={config.ingredients.format.question}
            accent={ACCENT_VAR.format}
            ctaLabel={strings.continueCta}
            ctaDisabled={formatTileId === null}
            ctaDisabledHint={strings.cta_disabled_hint.format}
            onCta={() => navTo("review")}
            coaching={
              findTile(config.ingredients.format.tiles, formatTileId)?.coaching
            }
          >
            <TilesGrid
              role="radio"
              tiles={config.ingredients.format.tiles}
              selectedIds={formatTileId ? [formatTileId] : []}
              accent={ACCENT_VAR.format}
              disabled={evaluating || won}
              onToggle={(id) =>
                setFormatTileId((prev) => (prev === id ? null : id))
              }
            />
          </IngredientShell>
        )}

        {screen === "review" && (
          <div className="flex flex-col gap-4">
            <p className="eyebrow text-text-muted">{strings.reviewEyebrow}</p>
            <AssembledPromptCard
              chips={[
                {
                  dim: "context",
                  preview:
                    findTile(config.ingredients.context.tiles, contextTileId)
                      ?.label ?? "",
                },
                {
                  dim: "task",
                  preview: task.trim().slice(0, 60),
                },
                {
                  dim: "constraints",
                  preview: constraintTileIds
                    .map(
                      (id) =>
                        findTile(config.ingredients.constraints.tiles, id)
                          ?.label ?? "",
                    )
                    .join(" + "),
                },
                {
                  dim: "format",
                  preview:
                    findTile(config.ingredients.format.tiles, formatTileId)
                      ?.label ?? "",
                },
              ]}
              assembledPrompt={assembledPrompt}
              downloadBaseName={filenameSlug}
              strings={strings.assembled}
              onEdit={(dim) =>
                navTo(
                  dim === "context"
                    ? "ctx"
                    : dim === "task"
                    ? "task"
                    : dim === "constraints"
                    ? "constraints"
                    : "format",
                )
              }
              disabled={evaluating}
              hideActions={false}
            />

            {exhausted && evaluation?.feedback_case !== "excellent" && (
              <div className="rounded-2xl border-2 border-amber-500/30 bg-amber-50/40 p-4">
                <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-amber-700">
                  {strings.revealAnswerLabel}
                </p>
                <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-xs leading-relaxed text-text-primary sm:text-sm">
                  {config.model_answer}
                </pre>
              </div>
            )}

            <div className="flex items-start gap-3 rounded-2xl border border-border bg-surface p-3">
              <SparkSphere
                state={evaluation ? "thinking" : "listening"}
                size={40}
              />
              <p className="flex-1 text-sm italic leading-relaxed text-text-primary">
                {evaluation?.spark_reply ??
                  lastReaction ??
                  strings.reviewSparkPrompt}
              </p>
            </div>

            {!exhausted && !won && (
              <button
                type="button"
                onClick={submit}
                disabled={evaluating}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-primary-hover active:scale-[0.97] disabled:opacity-60"
                style={{ touchAction: "manipulation" }}
              >
                {evaluating ? strings.submitting : strings.submitCta}
                {!evaluating && <Send size={14} />}
              </button>
            )}

            {(won || exhausted) && (
              <button
                type="button"
                onClick={handleFinalize}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-primary-hover active:scale-[0.97]"
                style={{ touchAction: "manipulation" }}
              >
                {strings.finalCta}
                <ArrowRight size={14} />
              </button>
            )}

            {error && (
              <div className="rounded-xl border border-error/30 bg-error/5 px-3 py-2 text-xs leading-relaxed text-text-primary">
                {error}
              </div>
            )}
          </div>
        )}

        {screen === "verdict" && evaluation && (
          <SparkVerdict
            evaluation={evaluation}
            xpEarned={
              evaluation
                ? xpForResult(
                    evaluation.feedback_case,
                    attemptsUsed,
                    config.xp_by_case,
                  )
                : 0
            }
            attemptsLeft={attemptsLeft}
            isFinal={isFinalVerdict(
              evaluation.feedback_case,
              attemptsUsed,
              step.max_attempts,
            )}
            strings={strings.verdict}
            onContinue={handleFinalize}
            onRetry={() => navTo("review")}
          />
        )}
      </div>
    </StepCard>
  );
}

// ─── Helpers ───────────────────────────────────────────────────────────

function backFrom(
  current: AnatomyScreen,
  navTo: (next: AnatomyScreen) => void,
): () => void {
  return () => {
    switch (current) {
      case "ctx":
        return navTo("intro");
      case "task":
        return navTo("ctx");
      case "constraints":
        return navTo("task");
      case "format":
        return navTo("constraints");
      case "review":
        return navTo("format");
      default:
        return;
    }
  };
}

function derivePersistedScreen(h: HydratedState): AnatomyScreen {
  if (h.lastEvaluation) return "review";
  if (h.formatTileId) return "review";
  if (h.constraintTileIds.length > 0) return "format";
  if (h.task.trim().length > 0) return "constraints";
  if (h.contextTileId) return "task";
  return "intro";
}

interface HydratedState {
  contextTileId: string | null;
  task: string;
  constraintTileIds: string[];
  formatTileId: string | null;
  attemptsUsed: number;
  lastEvaluation: AnatomyEvaluation | null;
  lastReaction: string | null;
}

function hydrateState(
  state: AnatomyStepStateShape | undefined,
  sessionStorageKey: string,
): HydratedState {
  const empty: HydratedState = {
    contextTileId: null,
    task: "",
    constraintTileIds: [],
    formatTileId: null,
    attemptsUsed: 0,
    lastEvaluation: null,
    lastReaction: null,
  };

  if (typeof window !== "undefined") {
    try {
      const cached = window.sessionStorage.getItem(sessionStorageKey);
      if (cached) {
        const parsed = JSON.parse(cached) as Partial<HydratedState>;
        if (parsed && typeof parsed === "object") {
          return {
            contextTileId:
              typeof parsed.contextTileId === "string"
                ? parsed.contextTileId
                : null,
            task: typeof parsed.task === "string" ? parsed.task : "",
            constraintTileIds: Array.isArray(parsed.constraintTileIds)
              ? parsed.constraintTileIds.filter(
                  (x): x is string => typeof x === "string",
                )
              : [],
            formatTileId:
              typeof parsed.formatTileId === "string"
                ? parsed.formatTileId
                : null,
            attemptsUsed:
              typeof parsed.attemptsUsed === "number" &&
              Number.isFinite(parsed.attemptsUsed)
                ? Math.max(0, Math.min(99, Math.round(parsed.attemptsUsed)))
                : 0,
            lastEvaluation: (parsed.lastEvaluation as AnatomyEvaluation) ?? null,
            lastReaction:
              typeof parsed.lastReaction === "string"
                ? parsed.lastReaction
                : null,
          };
        }
      }
    } catch {
      /* corrupt cache → fall through to state-based hydration */
    }
  }

  if (!state) return empty;

  return {
    contextTileId: state.contextTileId ?? null,
    task: state.task ?? "",
    constraintTileIds: state.constraintTileIds ?? [],
    formatTileId: state.formatTileId ?? null,
    attemptsUsed: state.result?.attempts ?? 0,
    lastEvaluation: state.lastEvaluation ?? null,
    lastReaction: state.lastReaction ?? null,
  };
}

function findTile(
  tiles: AnatomyOptionTile[],
  id: string | null,
): AnatomyOptionTile | undefined {
  if (!id) return undefined;
  return tiles.find((t) => t.id === id);
}

function scoreSingleTile(
  id: string | null,
  tiles: AnatomyOptionTile[],
  bands: { specific: number; vague: number; trap: number },
): number {
  const tile = findTile(tiles, id);
  if (!tile?.band) return 0;
  return Math.max(0, Math.min(25, bands[tile.band] ?? 0));
}

function scoreConstraintTiles(
  ids: string[],
  tiles: AnatomyOptionTile[],
  weights: { strong: number; weak: number; trap: number },
): number {
  if (ids.length === 0) return 0;
  const picks = ids
    .map((id) => tiles.find((t) => t.id === id))
    .filter((t): t is AnatomyOptionTile => Boolean(t));
  if (picks.length === 0) return 0;
  const sum = picks.reduce(
    (acc, t) => acc + (weights[t.weight ?? "trap"] ?? 0),
    0,
  );
  const avg = sum / picks.length;
  return Math.max(0, Math.min(25, Math.round(25 * avg)));
}

function stateForSingle(
  id: string | null,
  tiles: AnatomyOptionTile[],
): SegmentState {
  const tile = findTile(tiles, id);
  if (!tile?.band) return "empty";
  return bandToSegment(tile.band);
}

function bandToSegment(b: AnatomyTileBand): SegmentState {
  if (b === "specific") return "good";
  if (b === "vague") return "weak";
  return "trap";
}

function weightToSegment(w: AnatomyConstraintWeight): SegmentState {
  if (w === "strong") return "good";
  if (w === "weak") return "weak";
  return "trap";
}

function stateForConstraints(
  ids: string[],
  tiles: AnatomyOptionTile[],
  needed: number,
): SegmentState {
  if (ids.length === 0) return "empty";
  const picks = ids
    .map((id) => tiles.find((t) => t.id === id))
    .filter((t): t is AnatomyOptionTile => Boolean(t));
  if (picks.length === 0) return "empty";
  if (picks.length < needed) return "weak";
  // All-strong → good; mixed → weak; all-trap or any trap → weak unless
  // there's at least one strong (then weak).
  const segments = picks.map((p) => weightToSegment(p.weight ?? "trap"));
  if (segments.every((s) => s === "good")) return "good";
  if (segments.includes("trap") && !segments.includes("good")) return "trap";
  return "weak";
}

function stateForTaskBucket(value: string): SegmentState {
  // Visual hint only — the real grade is Spark's. Cheap proxy: blank →
  // empty; ≥ 40 chars → good; otherwise weak.
  const trimmed = value.trim().length;
  if (trimmed === 0) return "empty";
  if (trimmed >= 40) return "good";
  return "weak";
}

function collectiveConstraintsCoaching(
  ids: string[],
  tiles: AnatomyOptionTile[],
): string | undefined {
  const picks = ids
    .map((id) => tiles.find((t) => t.id === id))
    .filter((t): t is AnatomyOptionTile => Boolean(t));
  if (picks.length === 0) return undefined;
  // Show the coaching of the WEAKEST picked tile (the one with the
  // lowest weight). Keeps the message focused on the area to fix.
  const order: AnatomyConstraintWeight[] = ["trap", "weak", "strong"];
  const weakest = picks.reduce((acc, t) => {
    const ai = order.indexOf(acc.weight ?? "trap");
    const bi = order.indexOf(t.weight ?? "trap");
    return bi < ai ? t : acc;
  });
  return weakest.coaching;
}

function xpForResult(
  c: AnatomyFeedbackCase,
  attempts: number,
  xpByCase: Record<AnatomyFeedbackCase, number>,
): number {
  const base = xpByCase[c] ?? 0;
  // First-try bonus on excellent only (mirrors the other widgets).
  if (c === "excellent" && attempts <= 1) return base + FIRST_TRY_BONUS;
  return base;
}

function bandForCase(
  c: AnatomyFeedbackCase,
): InteractiveStepResult["band"] {
  switch (c) {
    case "vague":
      return "poor";
    case "missing_ingredients":
      return "one_bug";
    case "weak_task":
      return "two_bugs";
    case "complete_calibrate":
      return "two_bugs";
    case "excellent":
      return "perfect";
  }
}

async function safeJson(res: Response): Promise<Record<string, unknown> | null> {
  try {
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

// ─── Small inline subcomponents ────────────────────────────────────────

function AttemptDots({ used, max }: { used: number; max: number }) {
  return (
    <div
      className="flex items-center gap-1"
      aria-label={`Attempt ${Math.min(used + 1, max)} of ${max}`}
    >
      {Array.from({ length: max }).map((_, i) => {
        const filled = i < used;
        const current = i === used;
        return (
          <span
            key={i}
            className="h-1.5 w-4 rounded-full"
            style={{
              backgroundColor: filled
                ? "var(--anatomy-band-trap)"
                : current
                ? "var(--primary)"
                : "var(--surface-muted)",
            }}
          />
        );
      })}
    </div>
  );
}

interface IngredientShellProps {
  eyebrow: string;
  question: string;
  accent: string;
  children: React.ReactNode;
  ctaLabel: string;
  ctaDisabled: boolean;
  ctaDisabledHint: string;
  onCta: () => void;
  coaching?: string;
}

function IngredientShell({
  eyebrow,
  question,
  accent,
  children,
  ctaLabel,
  ctaDisabled,
  ctaDisabledHint,
  onCta,
  coaching,
}: IngredientShellProps) {
  return (
    <div className="anatomy-screen flex flex-col gap-4">
      <div>
        <p
          className="font-mono text-[10px] font-semibold uppercase tracking-wider"
          style={{ color: accent }}
        >
          {eyebrow}
        </p>
        <h2 className="mt-1 text-lg font-semibold leading-snug text-text-primary sm:text-xl">
          {question}
        </h2>
      </div>

      {children}

      {coaching && (
        <p
          className="anatomy-coaching rounded-xl border border-border bg-surface-muted/40 px-3 py-2 text-xs italic leading-relaxed text-text-secondary"
          aria-live="polite"
        >
          {coaching}
        </p>
      )}

      <button
        type="button"
        onClick={onCta}
        disabled={ctaDisabled}
        className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-primary-hover active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
        style={{ touchAction: "manipulation" }}
      >
        {ctaLabel}
        <ArrowRight size={14} />
      </button>

      {ctaDisabled && (
        <p className="text-center text-[11px] italic text-text-muted">
          {ctaDisabledHint}
        </p>
      )}
    </div>
  );
}

interface TilesGridProps {
  role: "radio" | "checkbox";
  tiles: AnatomyOptionTile[];
  selectedIds: string[];
  accent: string;
  disabled: boolean;
  onToggle: (id: string) => void;
  capHint?: string | null;
}

function TilesGrid({
  role,
  tiles,
  selectedIds,
  accent,
  disabled,
  onToggle,
  capHint = null,
}: TilesGridProps) {
  return (
    <div
      role={role === "radio" ? "radiogroup" : "group"}
      className="flex flex-col gap-3"
    >
      {tiles.map((tile) => {
        const isSelected = selectedIds.includes(tile.id);
        const lockedByCap =
          role === "checkbox" && !isSelected && capHint !== null;
        return (
          <OptionTile
            key={tile.id}
            role={role}
            selected={isSelected}
            disabled={disabled || lockedByCap}
            label={tile.label}
            accentVar={accent}
            onPick={() => onToggle(tile.id)}
          >
            {tile.label}
          </OptionTile>
        );
      })}
      {capHint && (
        <p className="text-center text-[11px] italic text-text-muted">
          {capHint}
        </p>
      )}
    </div>
  );
}
