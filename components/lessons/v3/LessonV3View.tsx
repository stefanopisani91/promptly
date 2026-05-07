"use client";

// Top-level V3 lesson view. Owns the navigation state across all step types,
// debounces autosave to Supabase, computes total XP earned, and triggers
// the completion server action when the user reaches the very last step.
//
// Step state shape: a free-form Record keyed by step.id. Each renderer is
// responsible for the value type stored under its own key — see the
// individual step files.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft } from "lucide-react";
import { LessonDirectionContext, type NavDirection } from "./LessonDirectionContext";
import { Spark } from "./Spark";
import {
  completeLessonAction,
  saveLessonProgressAction,
} from "@/app/(app)/lesson/[id]/actions";
import type {
  ChoiceStep as ChoiceStepType,
  LessonV3Content,
  LessonV3Step,
  SparkState,
} from "@/types";
import { fireConfetti } from "@/lib/confetti";
import type { FixedBugs } from "@/lib/landing-demo/types";
import { SparkHeader } from "./SparkHeader";
import { SparkChat } from "./SparkChat";
import { TextStep } from "./steps/TextStep";
import { PrincipleStep } from "./steps/PrincipleStep";
import { ChoiceStep } from "./steps/ChoiceStep";
import {
  InputStep,
  type InputStepStrings,
} from "./steps/InputStep";
import {
  RewardStep,
  type RewardStepStrings,
} from "./steps/RewardStep";
import {
  InteractiveStep,
  type InteractiveStepResult,
  type InteractiveStepStrings,
} from "./steps/InteractiveStep";
import {
  ClaudemdEditor,
  type ClaudemdEditorStrings,
} from "./steps/ClaudemdEditor";

export interface LessonV3ViewStrings {
  header: {
    stepCounterTemplate: string;
    exitLabel: string;
    vignetteCloseLabel: string;
  };
  navigation: {
    backCta: string;
    nextCta: string;
    finishCta: string;
    cliffhangerLabel: string;
    pathHrefLabel: string;
    replayBadge: string;
  };
  inputStep: InputStepStrings;
  rewardStep: RewardStepStrings;
  interactiveStep: InteractiveStepStrings;
  claudemdEditor: ClaudemdEditorStrings;
  chat: import("./SparkChat").SparkChatStrings;
}

interface Props {
  lesson: LessonV3Content;
  pathHref: string;
  strings: LessonV3ViewStrings;
  // Persisted state from the DB — the user resumes from `initialStep`.
  initialStep: number;
  initialStepState: Record<string, unknown>;
  // Whether the lesson was already completed in a previous session. When
  // true, we still let the user re-walk the steps but the completion call
  // is a no-op (no extra XP).
  alreadyCompleted: boolean;
  // True when the user has at least one Spark chat message left.
  initialChatRemaining: number;
  chatLimit: number;
}

export function LessonV3View({
  lesson,
  pathHref,
  strings,
  initialStep,
  initialStepState,
  alreadyCompleted,
  initialChatRemaining,
  chatLimit,
}: Props) {
  const totalSteps = lesson.steps.length;
  const safeInitialStep = Math.min(
    Math.max(0, initialStep),
    totalSteps - 1,
  );
  const [stepIndex, setStepIndex] = useState(safeInitialStep);
  const [navDirection, setNavDirection] = useState<NavDirection>("forward");
  const [stepState, setStepState] = useState<Record<string, unknown>>(
    initialStepState ?? {},
  );
  const [completed, setCompleted] = useState(alreadyCompleted);
  // The XP actually credited when the user clicks "Finish". On a first run
  // this is the full lesson XP; on a replay it's the delta the server
  // reports (0 when nothing improved, > 0 when the user did better than
  // before). Initialised to null so the completion card shows a placeholder
  // until the action returns.
  const [creditedXp, setCreditedXp] = useState<number | null>(null);
  // Reset to false on every mount — we still want to call the completion
  // action on a replay (so XP-improving runs are credited correctly via
  // xpDelta on the server). The action is idempotent: a no-op replay
  // returns xpDelta = 0 and never double-credits.
  const completionFiredRef = useRef(false);
  const archetypeRef = useRef<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatRemaining, setChatRemaining] = useState(initialChatRemaining);

  const step = lesson.steps[stepIndex];
  const sparkState: SparkState = step.spark_state ?? "idle";

  // ─── Autosave on step change (fire-and-forget) ─────────────────────
  useEffect(() => {
    saveLessonProgressAction({
      lessonId: lesson.id,
      pathSlug: lesson.path_slug,
      currentStep: stepIndex,
      stepState,
    }).catch(() => {
      /* silent — autosave is best-effort */
    });
    // We deliberately watch only stepIndex + a serialised stepState so an
    // input keystroke doesn't trigger a save on every character.
  }, [stepIndex, lesson.id, lesson.path_slug, stepState]);

  // ─── Per-step state mutators ────────────────────────────────────────
  const updateStepState = useCallback(
    (stepId: string, value: unknown) => {
      setStepState((prev) => ({ ...prev, [stepId]: value }));
    },
    [],
  );

  // ─── Compute the XP earned at lesson end ────────────────────────────
  const totalXp = useMemo(() => {
    return computeTotalXp(lesson, stepState);
  }, [lesson, stepState]);

  // ─── Navigation guards ──────────────────────────────────────────────
  const canAdvance = canAdvanceFromStep(step, stepState);
  const isLastStep = stepIndex >= totalSteps - 1;

  function goBack() {
    if (stepIndex > 0) {
      setNavDirection("back");
      setStepIndex((i) => i - 1);
    }
  }

  function goNext() {
    if (!canAdvance) return;
    if (isLastStep) {
      finalize();
      return;
    }
    setNavDirection("forward");
    setStepIndex((i) => i + 1);
  }

  // Force-advance bypassing canAdvance — used by callbacks fired right after
  // a stepState write, when the canAdvance read is still on the stale state.
  function goNextForce() {
    if (isLastStep) {
      finalize();
      return;
    }
    setNavDirection("forward");
    setStepIndex((i) => Math.min(i + 1, totalSteps - 1));
  }

  async function finalize() {
    if (completionFiredRef.current) {
      setCompleted(true);
      return;
    }
    completionFiredRef.current = true;
    setCompleted(true);
    fireConfetti();
    try {
      const result = await completeLessonAction({
        lessonId: lesson.id,
        pathSlug: lesson.path_slug,
        attempts: 1,
        xpEarned: totalXp,
        archetypeKey: archetypeRef.current ?? null,
      });
      if (result.ok) {
        setCreditedXp(result.xpDelta);
      } else {
        // Couldn't reach the server — fall back to the locally computed
        // XP for display. The user will be re-credited on the next run.
        setCreditedXp(alreadyCompleted ? 0 : totalXp);
      }
    } catch {
      setCreditedXp(alreadyCompleted ? 0 : totalXp);
    }
  }

  // Auto-advance after a CHOICE pick — small delay so the user sees the
  // confirmation state before the card transitions.
  function handleChoicePick(choiceStep: ChoiceStepType, optionKey: string) {
    updateStepState(choiceStep.id, { selectedKey: optionKey });
    window.setTimeout(() => {
      setNavDirection("forward");
      setStepIndex((i) => Math.min(i + 1, totalSteps - 1));
    }, 350);
  }

  // ─── Render ─────────────────────────────────────────────────────────
  return (
    <LessonDirectionContext.Provider value={navDirection}>
    <div className="flex min-h-screen flex-col bg-background">
      <SparkHeader
        lessonTitle={lesson.title}
        stepIndex={stepIndex}
        totalSteps={totalSteps}
        pathHref={pathHref}
        sparkState={sparkState}
        vignettes={step.vignettes ?? []}
        copy={strings.header}
        askSpark={{
          onOpen: () => setChatOpen(true),
          remaining: chatRemaining,
          limit: chatLimit,
          label: strings.chat.launcherLabel,
          exhaustedLabel: strings.chat.quotaExhausted,
        }}
      />

      <main className="flex flex-1 flex-col items-center justify-start gap-6 px-4 py-8 sm:px-6 sm:py-10">
        {/* key={stepIndex} forces React to remount the step subtree on
            every navigation so the directional slide animation always
            plays fresh — even when two adjacent steps share a type.   */}
        <div key={stepIndex} className="w-full">
          {renderStep(
            step,
            {
              lessonId: lesson.id,
              stepState,
              updateStepState,
              strings,
              steps: lesson.steps,
              onArchetype: (key) => {
                archetypeRef.current = key;
              },
              onChoicePick: handleChoicePick,
              goNext: goNextForce,
            },
          )}
        </div>

        {completed && isLastStep && (
          <CompletionCard
            xpTotal={totalXp}
            xpDelta={creditedXp}
            alreadyCompleted={alreadyCompleted}
            cliffhanger={lesson.cliffhanger}
            replayLabel={strings.navigation.replayBadge}
          />
        )}
      </main>

      <Footer
        canBack={stepIndex > 0}
        canAdvance={canAdvance}
        isLast={isLastStep}
        completed={completed}
        labels={strings.navigation}
        onBack={goBack}
        onNext={goNext}
        completionHref={pathHref}
      />

      {/* SparkChatLauncher (the bottom-right floating button) is gone:
          the chat affordance is now anchored to Spark via the
          AskSparkBubble inside SparkHeader. See
          Promptly_Spark_Master_Configuration.md §2 ("Sessione 2"). */}

      {chatOpen && (
        <SparkChat
          lessonId={lesson.id}
          pathSlug={lesson.path_slug}
          lessonTitle={lesson.title}
          stepIndex={stepIndex}
          totalSteps={totalSteps}
          remaining={chatRemaining}
          totalLimit={chatLimit}
          strings={strings.chat}
          onClose={() => setChatOpen(false)}
          onMessageSent={(newRemaining) => setChatRemaining(newRemaining)}
        />
      )}
    </div>
    </LessonDirectionContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Step dispatcher
// ---------------------------------------------------------------------------

interface RenderContext {
  lessonId: string;
  stepState: Record<string, unknown>;
  updateStepState: (stepId: string, value: unknown) => void;
  steps: LessonV3Step[];
  strings: LessonV3ViewStrings;
  onArchetype: (key: string) => void;
  onChoicePick: (step: ChoiceStepType, optionKey: string) => void;
  goNext: () => void;
}

function renderStep(step: LessonV3Step, ctx: RenderContext) {
  switch (step.type) {
    case "text":
      return <TextStep step={step} stepState={ctx.stepState} />;
    case "principle":
      return <PrincipleStep step={step} />;
    case "input":
      return (
        <InputStep
          step={step}
          lessonId={ctx.lessonId}
          state={
            ctx.stepState[step.id] as
              | { answer?: string; sparkReply?: string }
              | undefined
          }
          onChange={(next) =>
            ctx.updateStepState(step.id, {
              answer: next.answer,
              sparkReply: next.sparkReply,
            })
          }
          strings={ctx.strings.inputStep}
        />
      );
    case "choice":
      return (
        <ChoiceStep
          step={step}
          state={ctx.stepState[step.id] as { selectedKey?: string } | undefined}
          onPick={(key) => ctx.onChoicePick(step, key)}
        />
      );
    case "interactive":
      if (step.widget === "claudemd_editor") {
        return (
          <ClaudemdEditor
            step={step}
            state={
              ctx.stepState[step.id] as
                | {
                    result?: InteractiveStepResult;
                    editorText?: string;
                    selectedProject?: string;
                  }
                | undefined
            }
            onComplete={(result, extras) =>
              ctx.updateStepState(step.id, {
                result,
                editorText: extras.editorText,
                selectedProject: extras.selectedProject,
              })
            }
            onAdvance={ctx.goNext}
            strings={ctx.strings.claudemdEditor}
          />
        );
      }
      return (
        <InteractiveStep
          step={step}
          state={
            ctx.stepState[step.id] as
              | { result?: InteractiveStepResult; finalFixed?: FixedBugs }
              | undefined
          }
          onComplete={(result, finalFixed) =>
            ctx.updateStepState(step.id, { result, finalFixed })
          }
          onAdvance={ctx.goNext}
          strings={ctx.strings.interactiveStep}
        />
      );
    case "reward":
      return (
        <RewardStep
          step={step}
          steps={ctx.steps}
          stepState={ctx.stepState}
          strings={ctx.strings.rewardStep}
          onArchetypeResolved={ctx.onArchetype}
        />
      );
  }
  return null;
}

// ---------------------------------------------------------------------------
// Footer (back / next)
// ---------------------------------------------------------------------------

function Footer({
  canBack,
  canAdvance,
  isLast,
  completed,
  labels,
  onBack,
  onNext,
  completionHref,
}: {
  canBack: boolean;
  canAdvance: boolean;
  isLast: boolean;
  completed: boolean;
  labels: LessonV3ViewStrings["navigation"];
  onBack: () => void;
  onNext: () => void;
  completionHref: string;
}) {
  // Track when canAdvance transitions false → true to fire a pulse animation.
  // We fire the pulse once per unlock (not on every render).
  const prevCanAdvanceRef = useRef(canAdvance);
  const [pulsing, setPulsing] = useState(false);

  useEffect(() => {
    if (!prevCanAdvanceRef.current && canAdvance) {
      setPulsing(true);
    }
    prevCanAdvanceRef.current = canAdvance;
  }, [canAdvance]);

  // After completion the lesson navigation is over — the only action that
  // makes sense is "back to path". Keep the sticky footer mounted (so the
  // CTA stays in thumb zone instead of floating above the fold) but
  // collapse it down to a single primary button.
  if (completed && isLast) {
    return (
      <div
        className="sticky bottom-0 z-20 mt-auto border-t border-border/60 bg-background/95 px-4 py-3 backdrop-blur sm:px-6"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 0.75rem)" }}
      >
        <div className="mx-auto flex w-full max-w-3xl items-center justify-end gap-4">
          <Link
            href={completionHref}
            className="inline-flex h-12 items-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-white transition-all hover:bg-primary-hover active:scale-[0.97]"
          >
            {labels.pathHrefLabel}
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="sticky bottom-0 z-20 mt-auto border-t border-border/60 bg-background/95 px-4 py-3 backdrop-blur sm:px-6"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 0.75rem)" }}
    >
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBack}
          disabled={!canBack}
          className="inline-flex h-11 items-center gap-1 rounded-full px-4 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-muted disabled:pointer-events-none disabled:opacity-30"
        >
          <ChevronLeft size={16} />
          {labels.backCta}
        </button>
        <button
          type="button"
          onClick={() => { setPulsing(false); onNext(); }}
          disabled={!canAdvance}
          onAnimationEnd={() => setPulsing(false)}
          className={`inline-flex h-11 items-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-white transition-all hover:bg-primary-hover active:scale-[0.97] disabled:opacity-40 disabled:active:scale-100 ${pulsing ? "animate-next-pulse" : ""}`}
        >
          {isLast ? labels.finishCta : labels.nextCta}
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Completion card (shown after the user finishes the last step)
// ---------------------------------------------------------------------------

function CompletionCard({
  xpTotal,
  xpDelta,
  alreadyCompleted,
  cliffhanger,
  replayLabel,
}: {
  xpTotal: number;
  xpDelta: number | null;
  alreadyCompleted: boolean;
  cliffhanger: string;
  replayLabel: string;
}) {
  // Three display states:
  //   - first completion (or upgrade): show "+{xpDelta} XP" — the actual
  //     amount the server credited
  //   - replay with no improvement: show a neutral "Hai ripassato" badge
  //   - server didn't return yet: show the full XP placeholder
  // The "back to path" CTA lives in the sticky footer (always in thumb
  // zone) — see <Footer> above. Keeping it out of the card avoids the
  // primary action sitting above the fold on shorter mobile screens.
  //
  // Choreography (PROMPTLY.md "narrative animations"):
  //   t=0      Spark mounts in `happy` state with a scale-from-zero pop
  //   t=200ms  XP eyebrow fades in
  //   t=400ms  cliffhanger line fades in
  // Confetti fires from the parent (fireConfetti() in finalize()) — the
  // card just lands the on-screen choreography. The sequence respects
  // prefers-reduced-motion via the global `motion-reduce:` utilities.
  const shownXp = xpDelta ?? xpTotal;
  const isReplayNoGain = alreadyCompleted && xpDelta === 0;

  return (
    <div className="mx-auto w-full max-w-2xl rounded-3xl border border-success/30 bg-success-light p-6 text-center sm:p-10">
      <div className="flex flex-col items-center">
        <div className="completion-spark-pop">
          <Spark state="happy" size={64} />
        </div>
        <div className="completion-xp-fade mt-4">
          {isReplayNoGain ? (
            <p className="eyebrow text-success">{replayLabel}</p>
          ) : (
            <p className="eyebrow text-success">+{shownXp} XP</p>
          )}
        </div>
        <p className="completion-cliffhanger-fade mt-3 text-base italic leading-relaxed text-text-primary sm:text-lg">
          {cliffhanger}
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function canAdvanceFromStep(
  step: LessonV3Step,
  stepState: Record<string, unknown>,
): boolean {
  switch (step.type) {
    case "text":
    case "principle":
    case "reward":
      return true;
    case "input": {
      const s = stepState[step.id] as
        | { sparkReply?: string }
        | undefined;
      return Boolean(s?.sparkReply);
    }
    case "choice": {
      const s = stepState[step.id] as { selectedKey?: string } | undefined;
      return Boolean(s?.selectedKey);
    }
    case "interactive": {
      const s = stepState[step.id] as
        | { result?: InteractiveStepResult }
        | undefined;
      return Boolean(s?.result);
    }
  }
}

function computeTotalXp(
  lesson: LessonV3Content,
  stepState: Record<string, unknown>,
): number {
  let total = lesson.base_xp + lesson.difficulty_bonus_xp;
  for (const step of lesson.steps) {
    if (step.type === "reward" && step.variant === "archetype_reveal") {
      total += step.archetype?.bonus_xp ?? 0;
    }
    if (step.type === "interactive") {
      const s = stepState[step.id] as
        | { result?: InteractiveStepResult }
        | undefined;
      if (s?.result) total += s.result.xpEarned;
    }
  }
  return total;
}
