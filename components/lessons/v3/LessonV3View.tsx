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
import { cn } from "@/lib/utils";
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
import {
  ContextPromptEditor,
  type ContextPromptEditorStrings,
} from "./steps/ContextPromptEditor";
import {
  ConstraintsEditor,
  type ConstraintsEditorStrings,
} from "./steps/ConstraintsEditor";
import {
  BrokenSessionDebugger,
  type BrokenSessionDebuggerStrings,
} from "./steps/BrokenSessionDebugger";
import { ErrorTaxonomyBlocks } from "./steps/ErrorTaxonomyBlocks";
import { PhaseMappingBlocks } from "./steps/PhaseMappingBlocks";
import {
  PromptArchitecture,
  type PromptArchitectureStrings,
  type GeneratedPromptBlocks,
} from "./steps/PromptArchitecture";
import type { PromptArchitecturePillarKey } from "@/types";
import {
  GlossaryProvider,
  type GlossaryStrings,
} from "@/components/glossary/GlossaryProvider";
import type { Lang } from "@/types";

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
  contextEditor: ContextPromptEditorStrings;
  constraintsEditor: ConstraintsEditorStrings;
  brokenSessionDebugger: BrokenSessionDebuggerStrings;
  promptArchitecture: PromptArchitectureStrings;
  chat: import("./SparkChat").SparkChatStrings;
  // Glossario Vivo — popover chrome strings + the prefill template
  // used when the user clicks "approfondisci" inside a term popover.
  glossary: GlossaryStrings;
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
  // Authenticated user id, used to scope per-user client-side state
  // (e.g. ClaudemdEditor's sessionStorage draft so two users on the same
  // device don't see each other's work).
  userId: string;
  // Glossario Vivo — user's previously seen term ids (drives the
  // attenuated style on subsequent occurrences) and the lesson lang.
  glossarySeen: string[];
  lang: Lang;
  // Lesson 6 prompt-architecture widget needs:
  //   - a slug for the .md filename (full_name slugified, falls back
  //     to email prefix at the page level)
  //   - the display name of the user's preferred tool (Cursor / Claude
  //     Code / …) for Spark's celebration line
  filenameSlug: string;
  preferredToolDisplay: string;
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
  userId,
  glossarySeen,
  lang,
  filenameSlug,
  preferredToolDisplay,
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
  // Bumped on every chat opening; SparkChat reads it via key= so a fresh
  // component mount picks up the latest `chatDraft`. Without this, the
  // second click on a glossary "approfondisci" CTA would not re-seed
  // the draft (the textarea is only initialised on mount).
  const [chatOpenSeq, setChatOpenSeq] = useState(0);
  const [chatDraft, setChatDraft] = useState<string | undefined>(undefined);
  const openChatWithDraft = useCallback((draft: string) => {
    setChatDraft(draft);
    setChatOpenSeq((n) => n + 1);
    setChatOpen(true);
  }, []);

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

  // ─── Reset scroll on step change ───────────────────────────────────
  // Without this, advancing from a long step (e.g. a "text" with many
  // paragraphs the user scrolled through) lands the next step mid-page,
  // so on mobile its title falls under the sticky <SparkHeader>. We
  // jump back to the top on every navigation; the directional slide
  // animation in <main> covers the cut.
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.scrollTo(0, 0);
  }, [stepIndex]);

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
    <GlossaryProvider
      lang={lang}
      initialSeen={glossarySeen}
      strings={strings.glossary}
      onOpenChatWithDraft={openChatWithDraft}
    >
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

      <main
        className={cn(
          // Bottom padding on mobile leaves clearance for the fixed CTA
          // overlay (~96px footer including gradient + safe-area). On
          // ≥768px the footer is in normal flow so no extra padding.
          // Top padding on mobile is pt-6 (was pt-4) so the first
          // element of each step has breathing room below the sticky
          // <SparkHeader> — paired with the scroll-reset effect above.
          "flex flex-1 flex-col items-center gap-4 px-4 pt-6 pb-28 sm:px-6 sm:pt-10 sm:pb-10 md:gap-6",
          // "Single-card" steps (PRINCIPLE / REWARD / archetype reveal) are
          // short and benefit from being vertically centred in the leftover
          // viewport so the card sits at thumb-height. Tall steps keep the
          // safe `justify-start` so they don't appear oddly cropped.
          isShortCardStep(step) ? "justify-center md:justify-start" : "justify-start",
        )}
      >
        {/* key={stepIndex} forces React to remount the step subtree on
            every navigation so the directional slide animation always
            plays fresh — even when two adjacent steps share a type.   */}
        <div key={stepIndex} className="w-full">
          {renderStep(
            step,
            {
              lessonId: lesson.id,
              userId,
              stepState,
              updateStepState,
              strings,
              steps: lesson.steps,
              filenameSlug,
              preferredToolDisplay,
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
          // Remount on every open so a fresh `initialDraft` actually
          // seeds the textarea — see chatOpenSeq above.
          key={chatOpenSeq}
          lessonId={lesson.id}
          userId={userId}
          pathSlug={lesson.path_slug}
          lessonTitle={lesson.title}
          stepIndex={stepIndex}
          totalSteps={totalSteps}
          remaining={chatRemaining}
          totalLimit={chatLimit}
          strings={strings.chat}
          initialDraft={chatDraft}
          onClose={() => {
            setChatOpen(false);
            setChatDraft(undefined);
          }}
          onMessageSent={(newRemaining) => setChatRemaining(newRemaining)}
        />
      )}
    </div>
    </GlossaryProvider>
    </LessonDirectionContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Step dispatcher
// ---------------------------------------------------------------------------

interface RenderContext {
  lessonId: string;
  userId: string;
  stepState: Record<string, unknown>;
  updateStepState: (stepId: string, value: unknown) => void;
  steps: LessonV3Step[];
  strings: LessonV3ViewStrings;
  // Lesson 6 — passed through to PromptArchitecture for the .md
  // download filename and Spark's celebration template.
  filenameSlug: string;
  preferredToolDisplay: string;
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
    case "error_taxonomy":
      return <ErrorTaxonomyBlocks step={step} />;
    case "phase_mapping":
      return <PhaseMappingBlocks step={step} />;
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
            userId={ctx.userId}
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
      if (step.widget === "context_prompt_editor") {
        return (
          <ContextPromptEditor
            step={step}
            userId={ctx.userId}
            state={
              ctx.stepState[step.id] as
                | {
                    result?: InteractiveStepResult;
                    editorText?: string;
                    selectedScenario?: string;
                  }
                | undefined
            }
            onComplete={(result, extras) =>
              ctx.updateStepState(step.id, {
                result,
                editorText: extras.editorText,
                selectedScenario: extras.selectedScenario,
              })
            }
            onAdvance={ctx.goNext}
            strings={ctx.strings.contextEditor}
          />
        );
      }
      if (step.widget === "constraints_editor") {
        return (
          <ConstraintsEditor
            step={step}
            userId={ctx.userId}
            state={
              ctx.stepState[step.id] as
                | {
                    result?: InteractiveStepResult;
                    editorTexts?: Record<string, string>;
                  }
                | undefined
            }
            onComplete={(result, extras) =>
              ctx.updateStepState(step.id, {
                result,
                editorTexts: extras.editorTexts,
              })
            }
            onAdvance={ctx.goNext}
            strings={ctx.strings.constraintsEditor}
          />
        );
      }
      if (step.widget === "broken_session_debugger") {
        return (
          <BrokenSessionDebugger
            step={step}
            userId={ctx.userId}
            state={
              ctx.stepState[step.id] as
                | {
                    result?: InteractiveStepResult;
                    pivotChoice?: import(
                      "@/types"
                    ).BrokenSessionPivotKey;
                    pivotConfirmed?: boolean;
                    recoveryDraft?: string;
                    lastEvaluation?: import(
                      "./steps/BrokenSessionDebugger"
                    ).DebugEvaluation;
                  }
                | undefined
            }
            onComplete={(result, extras) =>
              ctx.updateStepState(step.id, {
                result,
                pivotChoice: extras.pivotChoice,
                pivotConfirmed: extras.pivotConfirmed,
                recoveryDraft: extras.recoveryDraft,
                lastEvaluation: extras.lastEvaluation,
              })
            }
            onAdvance={ctx.goNext}
            strings={ctx.strings.brokenSessionDebugger}
          />
        );
      }
      if (step.widget === "prompt_architecture") {
        return (
          <PromptArchitecture
            step={step}
            userId={ctx.userId}
            filenameSlug={ctx.filenameSlug}
            preferredToolDisplay={ctx.preferredToolDisplay}
            state={
              ctx.stepState[step.id] as
                | {
                    result?: InteractiveStepResult;
                    finalOrder?: PromptArchitecturePillarKey[];
                    generatedBlocks?: GeneratedPromptBlocks;
                  }
                | undefined
            }
            onComplete={(result, extras) =>
              ctx.updateStepState(step.id, {
                result,
                finalOrder: extras.finalOrder,
                generatedBlocks: extras.generatedBlocks,
              })
            }
            onAdvance={ctx.goNext}
            strings={ctx.strings.promptArchitecture}
          />
        );
      }
      return (
        <InteractiveStep
          step={step}
          state={
            ctx.stepState[step.id] as
              | {
                  result?: InteractiveStepResult;
                  finalFixed?: FixedBugs;
                  lastReaction?: string;
                  lastEvaluation?: import(
                    "@/lib/landing-demo/types"
                  ).LuciaEvaluation;
                }
              | undefined
          }
          onComplete={(result, extras) =>
            ctx.updateStepState(step.id, {
              result,
              finalFixed: extras.finalFixed,
              lastReaction: extras.lastReaction,
              lastEvaluation: extras.lastEvaluation,
            })
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

  // Wrapper styles:
  //   Mobile: fixed-position overlay anchored to viewport bottom with a
  //           gradient fade so the card content can extend visually behind
  //           it — pulls back ~80px of vertical real-estate per step.
  //   Desktop (≥768px): solid sticky bar in the normal flow, matching the
  //           previous design exactly. Card content reserves no extra
  //           space at the bottom because the sticky bar takes its own.
  const wrapperClass = cn(
    "lesson-cta-bar z-20 mt-auto px-4 sm:px-6",
    // mobile (< md): the wrapper is purely decorative (gradient fade) —
    // pointer events pass through so the user can still interact with the
    // accordion sections that scroll under it. The inner button row
    // re-enables pointer events for itself below.
    "pointer-events-none md:pointer-events-auto",
    "fixed bottom-0 left-0 right-0 pt-8 pb-3",
    "bg-gradient-to-t from-background via-background/95 to-transparent",
    // desktop (≥ md) — restore the solid sticky bar
    "md:sticky md:left-auto md:right-auto md:border-t md:border-border/60",
    "md:bg-background/95 md:backdrop-blur md:from-transparent md:via-transparent md:to-transparent",
    "md:py-3 md:pt-3",
  );
  const wrapperStyle = { paddingBottom: "calc(env(safe-area-inset-bottom) + 0.75rem)" } as const;

  // After completion the lesson navigation is over — the only action that
  // makes sense is "back to path". Keep the footer mounted (so the CTA
  // stays in thumb zone) but collapse it down to a single primary button.
  if (completed && isLast) {
    return (
      <div className={wrapperClass} style={wrapperStyle}>
        <div className="pointer-events-auto mx-auto flex w-full max-w-3xl items-center justify-end gap-4">
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
    <div className={wrapperClass} style={wrapperStyle}>
      <div className="pointer-events-auto mx-auto flex w-full max-w-3xl items-center justify-between gap-4">
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

// "Single-card" steps that show one centred concept and tend to fit in a
// mobile viewport without scroll. Vertically centring these on mobile keeps
// the card at thumb-height instead of pinned to the top under the header.
function isShortCardStep(step: LessonV3Step): boolean {
  return step.type === "principle" || step.type === "reward";
}

function canAdvanceFromStep(
  step: LessonV3Step,
  stepState: Record<string, unknown>,
): boolean {
  switch (step.type) {
    case "text":
    case "principle":
    case "reward":
    case "error_taxonomy":
    case "phase_mapping":
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
