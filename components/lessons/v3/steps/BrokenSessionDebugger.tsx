"use client";

// BROKEN_SESSION_DEBUGGER — interactive widget for Lesson 5.
//
// Flow (Lezione5_Blueprint.md §13):
//   1. The user reads a Chrome-style mockup of a vibe-coding session
//      that visibly degrades message after message.
//   2. PHASE A — pivot picker: a single multi-choice question. The
//      correct answer is `correct_pivot`. Wrong answers get an inline
//      retry hint (1 retry max), then we reveal the right answer and
//      move on. This phase doesn't burn lesson attempts.
//   3. PHASE B — recovery editor: the user writes the stop-and-recalibrate
//      message. We send it to /api/lesson-debug-evaluate, Haiku scores
//      it on 3 dimensions × 33 + 1 rollback bonus.
//   4. Spark reacts inline. The mockup shakes on incomplete, flashes
//      amber on missing_one, glows yellow on good, and the AI's failed
//      bubbles fade out on excellent (the session "heals").
//   5. 3 attempts max on PHASE B. Final CTA persists the result and
//      advances.
//
// Mirrors the constraints / context editors — same submit lock pattern,
// same persistence rules, same XP shape.

import { useCallback, useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import confetti from "canvas-confetti";
import type {
  BrokenSessionDebuggerConfig,
  BrokenSessionPivotKey,
  InteractiveStep as InteractiveStepType,
} from "@/types";
import { SparkSphere } from "@/components/promptly/SparkSphere";
import { StepCard } from "../StepCard";
import { fireConfetti } from "@/lib/confetti";
import type { InteractiveStepResult } from "./InteractiveStep";

export type DebugFeedbackCase =
  | "incomplete"
  | "missing_one"
  | "good"
  | "excellent";

export type DebugDimensionKey =
  | "recognition"
  | "recalibration"
  | "future_control";

export interface DebugEvaluation {
  scores: {
    recognition: number;
    recalibration: number;
    future_control: number;
    rollback_bonus: number;
  };
  total: number;
  weakest_dimension: DebugDimensionKey;
  strongest_dimension: DebugDimensionKey;
  feedback_case: DebugFeedbackCase;
  would_have_saved: boolean;
  spark_reply: string;
}

export interface BrokenSessionDebuggerStrings {
  simulationBadge: string;
  pivotHeader: string;
  pivotConfirmCta: string;
  pivotAwaiting: string;
  pivotCorrectInline: string;
  pivotWrongInline: string;
  pivotRevealed: string;
  recoveryHeader: string;
  charCounterTemplate: string;
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
  dailyQuotaExhausted: string;
  dimensionLabels: Record<DebugDimensionKey, string>;
}

interface PersistedState {
  result?: InteractiveStepResult;
  pivotChoice?: BrokenSessionPivotKey;
  pivotConfirmed?: boolean;
  recoveryDraft?: string;
  lastEvaluation?: DebugEvaluation;
}

interface Props {
  step: InteractiveStepType;
  userId: string;
  strings: BrokenSessionDebuggerStrings;
  state: PersistedState | undefined;
  onComplete: (
    result: InteractiveStepResult,
    extras: {
      pivotChoice: BrokenSessionPivotKey | null;
      pivotConfirmed: boolean;
      recoveryDraft: string;
      lastEvaluation: DebugEvaluation | null;
    },
  ) => void;
  onAdvance: () => void;
}

export function BrokenSessionDebugger({
  step,
  userId,
  strings,
  state,
  onComplete,
  onAdvance,
}: Props) {
  const config = step.broken_session_config!;
  const persisted = state?.result;
  const finishedRef = useRef(Boolean(persisted));

  // Phase A — pivot picker state. The wrong-answer count caps at 2
  // (1 retry, then reveal). Once `pivotConfirmed` flips true the user
  // is in phase B and can never go back to picking.
  const [pivotChoice, setPivotChoice] = useState<BrokenSessionPivotKey | null>(
    state?.pivotChoice ?? null,
  );
  const [pivotConfirmed, setPivotConfirmed] = useState<boolean>(
    state?.pivotConfirmed ?? false,
  );
  const [pivotInline, setPivotInline] = useState<string | null>(null);
  const [pivotWrongCount, setPivotWrongCount] = useState(0);

  // Phase B — recovery editor state.
  const sessionStorageKey = `brokenSession:${userId}:${step.id}`;
  const [draft, setDraft] = useState<string>(() =>
    hydrateDraft(state?.recoveryDraft, sessionStorageKey),
  );
  const [attemptCount, setAttemptCount] = useState(persisted?.attempts ?? 0);
  const [bestScore, setBestScore] = useState(persisted?.bestScore ?? 0);
  const [evaluation, setEvaluation] = useState<DebugEvaluation | null>(
    state?.lastEvaluation ?? null,
  );
  const [evaluating, setEvaluating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editorEffect, setEditorEffect] = useState<
    "shake" | "flashAmber" | "flashYellow" | "glowGreen" | null
  >(null);
  const [dailyExhausted, setDailyExhausted] = useState(false);
  const submitInFlightRef = useRef(false);

  const draftLength = draft.trim().length;
  const exhausted = attemptCount >= step.max_attempts;
  // Require both the feedback_case AND a total >= 80 before locking the
  // editor. The server now derives total from clamped scores and downgrades
  // an inconsistent "excellent" — this client-side check is a belt-and-
  // suspenders defence against stale clients caching an older API response.
  const won =
    evaluation?.feedback_case === "excellent" &&
    (evaluation?.total ?? 0) >= 80;

  const submitDisabled =
    evaluating ||
    draftLength < config.min_chars ||
    draftLength > config.max_chars ||
    exhausted ||
    won ||
    dailyExhausted;

  const attemptCounter = strings.attemptCounterTemplate
    .replace("{current}", String(Math.min(attemptCount + 1, step.max_attempts)))
    .replace("{max}", String(step.max_attempts));

  // Reset editor effect after its animation completes so a second submit
  // of the same case can re-trigger.
  useEffect(() => {
    if (!editorEffect) return;
    const t = window.setTimeout(() => setEditorEffect(null), 1100);
    return () => window.clearTimeout(t);
  }, [editorEffect]);

  // Autosave draft to sessionStorage so refresh / step nav don't lose work.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (finishedRef.current) return;
    try {
      window.sessionStorage.setItem(sessionStorageKey, draft);
    } catch {
      /* sessionStorage may be disabled — silent skip */
    }
  }, [draft, sessionStorageKey]);

  const handlePivotConfirm = useCallback(() => {
    if (!pivotChoice) return;
    if (pivotChoice === config.correct_pivot) {
      setPivotInline(strings.pivotCorrectInline);
      setPivotConfirmed(true);
      return;
    }
    // Wrong answer — give one retry, then reveal the truth and advance.
    if (pivotWrongCount === 0) {
      setPivotWrongCount(1);
      setPivotInline(strings.pivotWrongInline);
      return;
    }
    setPivotInline(strings.pivotRevealed);
    setPivotChoice(config.correct_pivot);
    setPivotConfirmed(true);
  }, [
    pivotChoice,
    pivotWrongCount,
    config.correct_pivot,
    strings.pivotCorrectInline,
    strings.pivotWrongInline,
    strings.pivotRevealed,
  ]);

  const submit = useCallback(async () => {
    if (submitInFlightRef.current) return;
    if (submitDisabled) return;
    submitInFlightRef.current = true;
    setEvaluating(true);
    setError(null);
    try {
      const res = await fetch("/api/lesson-debug-evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonId: "mindset-05",
          stepId: step.id,
          recoveryMessage: draft.trim().slice(0, config.max_chars),
          pivotChoice,
          attempt: attemptCount + 1,
        }),
      });
      if (!res.ok) {
        let payload: { error?: string } = {};
        try {
          payload = (await res.json()) as typeof payload;
        } catch {
          /* keep payload empty */
        }
        if (res.status === 400 && payload.error === "invalid_input") {
          setError(strings.invalidInputError);
        } else if (
          res.status === 403 &&
          payload.error === "daily_quota_exceeded"
        ) {
          setDailyExhausted(true);
          setError(strings.dailyQuotaExhausted);
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
      const body = (await res.json()) as { evaluation?: DebugEvaluation };
      const ev = body.evaluation;
      if (!ev) {
        setError(strings.apiError);
        return;
      }
      setEvaluation(ev);
      const newAttempt = attemptCount + 1;
      setAttemptCount(newAttempt);
      const newBest = Math.max(bestScore, ev.total);
      setBestScore(newBest);
      setEditorEffect(effectForCase(ev.feedback_case));
      if (ev.feedback_case === "excellent") {
        fireConfetti();
        if (ev.total >= 100) {
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
    draft,
    config.max_chars,
    attemptCount,
    bestScore,
    pivotChoice,
    step.id,
    step.max_attempts,
    strings,
  ]);

  function handleFinalize() {
    // Persist the latest snapshot (Spark reply, dimension scores, best
    // score, band, XP) so a retry-on-return actually updates the stored
    // result instead of keeping the first finalisation's stale data.
    // Same approach as InteractiveStep; onComplete → updateStepState is
    // idempotent, so re-firing it is harmless.
    //
    // Gated on `evaluation` so a no-resubmit re-finalisation of legacy
    // persisted state (written before lastEvaluation was tracked, so
    // `evaluation` is null on mount) doesn't clobber a good stored
    // result with a "poor"/0-XP one.
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
          pivotChoice,
          pivotConfirmed,
          recoveryDraft: draft,
          lastEvaluation: evaluation,
        },
      );
    }
    finishedRef.current = true;
    onAdvance();
  }

  const showFinalCta =
    won || exhausted || attemptCount >= 1 || Boolean(persisted);
  const isPartialStop = !won && !exhausted && attemptCount >= 1;

  const sparkLine = !pivotConfirmed
    ? pivotInline ?? strings.pivotAwaiting
    : evaluation?.spark_reply ??
      pivotInline ?? // carries over the "correct pivot" line until first submit
      strings.awaitingPrompt;

  // Healed mockup — bubbles after AI's 1st reply fade once the user
  // posts an excellent recovery. The simulation badge stays so the
  // user remembers it's not a real session.
  const mockupHealed = won && evaluation?.would_have_saved === true;

  const editorEffectClass =
    editorEffect === "shake"
      ? "claudemd-editor-shake"
      : editorEffect === "flashAmber"
      ? "claudemd-editor-flash-amber"
      : editorEffect === "flashYellow"
      ? "claudemd-editor-flash-yellow"
      : editorEffect === "glowGreen"
      ? "claudemd-editor-glow-green"
      : "";

  return (
    <StepCard wide>
      <div className="flex flex-col gap-5">
        {step.intro && (
          <p className="text-base leading-relaxed text-text-secondary sm:text-lg">
            {step.intro}
          </p>
        )}

        <SessionMockup
          config={config}
          strings={strings}
          healed={mockupHealed}
          recoveryDraft={draft}
          effectClass={editorEffectClass}
        />

        {/* Phase A — pivot picker. Hidden once confirmed. */}
        {!pivotConfirmed && (
          <PivotPicker
            config={config}
            strings={strings}
            choice={pivotChoice}
            onChange={setPivotChoice}
            onConfirm={handlePivotConfirm}
            inlineMessage={pivotInline}
          />
        )}

        {/* Phase B — recovery editor. Only after pivot is locked in. */}
        {pivotConfirmed && (
          <RecoveryEditor
            config={config}
            strings={strings}
            draft={draft}
            onDraftChange={setDraft}
            attemptCounter={attemptCounter}
            disabled={evaluating || won || exhausted}
          />
        )}

        {/* Spark dialogue panel — always visible. */}
        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <SparkSphere
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
                <DimensionBars
                  scores={evaluation.scores}
                  total={evaluation.total}
                  labels={strings.dimensionLabels}
                />
              )}
            </div>
          </div>

          {pivotConfirmed && !won && !exhausted && (
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={submit}
                disabled={submitDisabled}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-primary-hover active:scale-[0.97] disabled:opacity-50 disabled:active:scale-100"
              >
                {evaluating ? strings.submitting : strings.submitCta}
                {!evaluating && <Send size={14} />}
              </button>
              {error && (
                <div
                  className="flex items-start gap-2 rounded-xl border border-error/30 bg-error/5 px-3 py-2"
                  role="status"
                >
                  <SparkSphere state="sad" size={28} />
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

          {showFinalCta && pivotConfirmed && (
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

// ─── Mockup ──────────────────────────────────────────────────────────

// "Pivot index": the message after which the failure cascade begins.
// Currently always 1 (msg 0 = original user request, msg 1 = AI overreach,
// msg 2+ = the disaster). We hard-code it because the lesson's narrative
// shape is fixed; if a future lesson reuses the widget with a different
// failure pattern, we'll move this to the config.
const PIVOT_KEEP_THROUGH = 1;

function SessionMockup({
  config,
  strings,
  healed,
  recoveryDraft,
  effectClass,
}: {
  config: BrokenSessionDebuggerConfig;
  strings: BrokenSessionDebuggerStrings;
  healed: boolean;
  // The user's recovery message — rendered as the corrected user
  // bubble in the rebuild branch. Falls back to the placeholder when
  // the user hasn't typed anything (defensive — `healed` should imply
  // a non-empty draft, but on hydration the order matters).
  recoveryDraft: string;
  effectClass: string;
}) {
  // Highlights pulse for ~1.6s after the mockup mounts (2 cycles ×
  // 800ms; see globals.css `broken-session-pulse`). After that they
  // settle into the static dotted underline. Reduced-motion users
  // skip the pulse entirely (CSS handles the override).
  const [pulseHighlights, setPulseHighlights] = useState(true);
  useEffect(() => {
    const t = window.setTimeout(() => setPulseHighlights(false), 2000);
    return () => window.clearTimeout(t);
  }, []);

  // Rebuild reveal phases — driven by the `healed` flag transitioning
  // false → true. Rendered as opacity gates so reduced-motion users
  // see everything at once via the CSS override.
  //   0: nothing rebuilt yet
  //   1: branch label + corrected user bubble visible
  //   2: corrected AI reply also visible
  // We start at the appropriate phase on mount to avoid a flicker on
  // hydration (returning user with already-saved excellent verdict).
  const [rebuildPhase, setRebuildPhase] = useState<0 | 1 | 2>(healed ? 2 : 0);
  useEffect(() => {
    if (!healed) {
      setRebuildPhase(0);
      return;
    }
    // Don't replay the staggered reveal if we're already at full
    // phase (mounted-already-healed). Only animate on the live
    // transition false → true.
    setRebuildPhase((prev) => (prev === 2 ? 2 : 1));
    const t = window.setTimeout(() => setRebuildPhase(2), 600);
    return () => window.clearTimeout(t);
  }, [healed]);

  // The kept (always visible) prefix and the failed (collapses on
  // heal) suffix. We render them in two passes so the suffix can
  // transition opacity + max-height together.
  const keptMessages = config.messages.slice(0, PIVOT_KEEP_THROUGH + 1);
  const failedMessages = config.messages.slice(PIVOT_KEEP_THROUGH + 1);

  return (
    <div
      className={`overflow-hidden rounded-2xl border-2 border-orange-300/60 bg-stone-50 ${effectClass}`}
    >
      {/* Disclaimer banner — orange tint to match the dashed-border
          convention used on Lesson 4's DB mockup. */}
      <div className="flex items-center justify-between gap-2 border-b border-orange-300/60 bg-orange-50 px-3 py-1.5 text-[11px] font-mono uppercase tracking-wider text-orange-800">
        <span>⚠️ {strings.simulationBadge}</span>
        {healed && (
          <span className="rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-semibold text-success-deep">
            ✓ recovered
          </span>
        )}
      </div>

      {/* Browser chrome — Mac-style traffic lights + faux address bar.
          NOT real Chrome assets (legal). */}
      <div className="flex items-center gap-2.5 border-b border-stone-200 bg-stone-100 px-3 py-2">
        <div className="flex gap-1.5" aria-hidden="true">
          <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
        </div>
        <div className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap rounded-full border border-stone-200 bg-white px-3 py-1 text-center font-mono text-[11px] text-stone-500">
          {config.address_bar}
        </div>
      </div>

      {/* Chat transcript */}
      <div className="flex flex-col gap-2.5 bg-white px-3 py-4 sm:px-5 sm:py-5">
        {keptMessages.map((m, i) => (
          <BubbleRow
            key={`keep-${i}`}
            message={m}
            pulseHighlights={pulseHighlights}
          />
        ))}

        {/* Failed branch — fades + collapses to nothing when healed.
            Wrapped in an outer div with a max-height transition so
            the surrounding bubbles smoothly close the gap. */}
        <div
          aria-hidden={healed}
          style={{
            opacity: healed ? 0 : 1,
            maxHeight: healed ? 0 : 1200,
            overflow: "hidden",
            transition:
              "opacity 0.55s ease-out, max-height 0.85s ease-in-out 0.2s",
          }}
        >
          <div className="flex flex-col gap-2.5">
            {failedMessages.map((m, i) => (
              <BubbleRow
                key={`fail-${i}`}
                message={m}
                pulseHighlights={pulseHighlights}
              />
            ))}
          </div>
        </div>

        {/* Rebuild branch — only mounted when healed. The user's
            recovery message takes the role of "what the user should
            have written", and the corrected AI reply lands right
            after. Fade-in is staggered: branch + user bubble first,
            corrected AI reply 600ms later. */}
        {healed && (
          <div className="flex flex-col gap-2.5">
            {config.healed_branch_label && (
              <div
                className="rounded-full bg-emerald-50 px-3 py-1 text-center text-[11px] font-mono uppercase tracking-wider text-emerald-700 transition-opacity duration-500"
                style={{ opacity: rebuildPhase >= 1 ? 1 : 0 }}
              >
                ↻ {config.healed_branch_label}
              </div>
            )}

            <div
              className="transition-opacity duration-500"
              style={{ opacity: rebuildPhase >= 1 ? 1 : 0 }}
            >
              <BubbleRow
                message={{
                  role: "user",
                  text: recoveryDraft.trim() || config.recovery_placeholder,
                }}
                pulseHighlights={false}
              />
            </div>

            <div
              className="transition-opacity duration-500"
              style={{ opacity: rebuildPhase >= 2 ? 1 : 0 }}
            >
              <BubbleRow
                message={{
                  role: "ai",
                  text: config.healed_ai_reply,
                  // Override severity so the corrected reply visually
                  // signals "fixed" rather than reusing the warning
                  // palette of the original overreach.
                  severity: "normal",
                }}
                pulseHighlights={false}
                healedReply
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Bubble row (avatar + body) ──────────────────────────────────────
//
// Pulled out so the kept / failed / rebuild branches share the same
// avatar + alignment + time-gap divider, with a single source of truth.

function BubbleRow({
  message,
  pulseHighlights,
  healedReply = false,
}: {
  message: BrokenSessionMessageWithDecorations;
  pulseHighlights: boolean;
  healedReply?: boolean;
}) {
  return (
    <div>
      {message.time_gap_label && (
        <div className="py-2 text-center text-xs italic text-stone-400">
          {message.time_gap_label}
        </div>
      )}
      <div
        className={`flex items-start gap-2 ${
          message.role === "user" ? "justify-end" : "justify-start"
        }`}
      >
        {message.role === "ai" && (
          <span className="mt-1 text-base" aria-label="AI">
            🤖
          </span>
        )}
        <BubbleBody
          message={message}
          pulseHighlights={pulseHighlights}
          healedReply={healedReply}
        />
        {message.role === "user" && (
          <span className="mt-1 text-base" aria-label="User">
            👤
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Bubble body ─────────────────────────────────────────────────────
//
// One bubble. Picks bg/border classes from the per-message severity
// (AI) or mood_background (user), prepends the user's mood_emoji,
// stamps a ⚠️ icon on critical AI replies, and wraps highlight
// snippets in dotted-underline spans.

function BubbleBody({
  message,
  pulseHighlights,
  healedReply = false,
}: {
  message: BrokenSessionMessageWithDecorations;
  pulseHighlights: boolean;
  healedReply?: boolean;
}) {
  const isCritical = message.role === "ai" && message.severity === "critical";
  const bubbleClasses = bubbleClassesFor(message, healedReply);
  const highlights = message.highlights ?? [];

  return (
    <div
      className={`relative max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed sm:max-w-[75%] sm:text-[15px] ${bubbleClasses}`}
    >
      {isCritical && (
        <span
          className="absolute -left-1 -top-2 text-base leading-none"
          aria-hidden="true"
        >
          ⚠️
        </span>
      )}
      <p className="whitespace-pre-wrap">
        {message.role === "user" && message.mood_emoji && (
          <span className="mr-1.5" aria-hidden="true">
            {message.mood_emoji}
          </span>
        )}
        {renderTextWithHighlights(message.text, highlights, pulseHighlights)}
      </p>
    </div>
  );
}

type BrokenSessionMessageWithDecorations =
  BrokenSessionDebuggerConfig["messages"][number];

function bubbleClassesFor(
  m: BrokenSessionMessageWithDecorations,
  healedReply: boolean,
): string {
  // The corrected AI reply that lands during the rebuild branch gets
  // an emerald palette so it visually closes the loop ("session
  // healed") instead of reusing the warning yellow.
  if (healedReply && m.role === "ai") {
    return "bg-emerald-50 border border-emerald-300 text-text-primary";
  }
  if (m.role === "user") {
    return m.mood_background === "rose"
      ? "bg-rose-50 text-text-primary"
      : "bg-stone-100 text-text-primary";
  }
  switch (m.severity) {
    case "critical":
      return "bg-red-100 border border-red-400 text-text-primary";
    case "warning":
      return "bg-orange-100 border border-orange-300 text-text-primary";
    case "normal":
    default:
      return "bg-amber-50 border border-amber-200 text-text-primary";
  }
}

// ─── Highlight rendering ─────────────────────────────────────────────
//
// Walks the message text once, finding the FIRST occurrence of each
// snippet in the order the snippets appear in the source. Wraps each
// match in a span with the chosen severity class. Snippets that don't
// appear in the text are silently skipped — the validator already
// rejects those at load time (lib/lessons/load.ts).
//
// The pulse class is added on first paint and removed after 2s by the
// parent so the user's eye lands on the overreach without us having
// to spell it out in copy.

function renderTextWithHighlights(
  text: string,
  highlights: ReadonlyArray<{ snippet: string; severity: "orange" | "red" }>,
  pulse: boolean,
): React.ReactNode {
  if (highlights.length === 0) return text;

  // Find each snippet's first occurrence and sort matches by position.
  // Overlapping matches keep the earlier one and drop the later one.
  type Match = { start: number; end: number; severity: "orange" | "red" };
  const matches: Match[] = [];
  for (const h of highlights) {
    const start = text.indexOf(h.snippet);
    if (start < 0) continue;
    matches.push({
      start,
      end: start + h.snippet.length,
      severity: h.severity,
    });
  }
  matches.sort((a, b) => a.start - b.start);

  const parts: React.ReactNode[] = [];
  let cursor = 0;
  let key = 0;
  for (const m of matches) {
    if (m.start < cursor) continue; // overlap with a previous match → skip
    if (m.start > cursor) {
      parts.push(text.slice(cursor, m.start));
    }
    parts.push(
      <span
        key={`hl-${key++}`}
        className={`${
          m.severity === "red" ? "suspicious-red" : "suspicious-orange"
        } ${pulse ? "broken-session-pulse" : ""}`}
      >
        {text.slice(m.start, m.end)}
      </span>,
    );
    cursor = m.end;
  }
  if (cursor < text.length) parts.push(text.slice(cursor));
  return parts;
}

// ─── Phase A — pivot picker ──────────────────────────────────────────

function PivotPicker({
  config,
  strings,
  choice,
  onChange,
  onConfirm,
  inlineMessage,
}: {
  config: BrokenSessionDebuggerConfig;
  strings: BrokenSessionDebuggerStrings;
  choice: BrokenSessionPivotKey | null;
  onChange: (key: BrokenSessionPivotKey) => void;
  onConfirm: () => void;
  inlineMessage: string | null;
}) {
  return (
    <div className="flex flex-col gap-3">
      <p className="eyebrow text-text-muted">{strings.pivotHeader}</p>
      <p className="text-base leading-relaxed text-text-primary">
        {config.pivot_question}
      </p>
      <div className="flex flex-col gap-2">
        {config.pivot_options.map((opt) => {
          const selected = choice === opt.key;
          return (
            <label
              key={opt.key}
              className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 px-4 py-3 transition-colors ${
                selected
                  ? "border-primary bg-primary/5"
                  : "border-border bg-surface hover:border-primary/40"
              }`}
            >
              <input
                type="radio"
                name="pivot-choice"
                value={opt.key}
                checked={selected}
                onChange={() => onChange(opt.key)}
                className="h-4 w-4 accent-primary"
              />
              <span className="text-sm text-text-primary sm:text-base">
                {opt.label}
              </span>
            </label>
          );
        })}
      </div>
      <div className="flex items-center justify-between gap-3">
        <p
          className="text-xs italic text-text-secondary sm:text-sm"
          role="status"
          aria-live="polite"
        >
          {inlineMessage ?? " "}
        </p>
        <button
          type="button"
          onClick={onConfirm}
          disabled={!choice}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-primary-hover active:scale-[0.97] disabled:opacity-50 disabled:active:scale-100"
        >
          {strings.pivotConfirmCta}
        </button>
      </div>
    </div>
  );
}

// ─── Phase B — recovery editor ───────────────────────────────────────

function RecoveryEditor({
  config,
  strings,
  draft,
  onDraftChange,
  attemptCounter,
  disabled,
}: {
  config: BrokenSessionDebuggerConfig;
  strings: BrokenSessionDebuggerStrings;
  draft: string;
  onDraftChange: (next: string) => void;
  attemptCounter: string;
  disabled: boolean;
}) {
  const len = draft.trim().length;
  const counter = strings.charCounterTemplate
    .replace("{current}", String(len))
    .replace("{max}", String(config.max_chars));

  return (
    <div className="flex flex-col gap-3">
      <p className="eyebrow text-text-muted">{strings.recoveryHeader}</p>
      <p className="text-base leading-relaxed text-text-primary">
        {config.recovery_question}
      </p>
      {config.recovery_helper && (
        <p className="text-xs italic text-text-secondary sm:text-sm">
          {config.recovery_helper}
        </p>
      )}
      <textarea
        value={draft}
        onChange={(e) =>
          onDraftChange(e.target.value.slice(0, config.max_chars + 50))
        }
        placeholder={config.recovery_placeholder}
        disabled={disabled}
        rows={6}
        maxLength={config.max_chars + 50}
        className="block w-full resize-y rounded-md border-2 border-border bg-white px-3 py-2 font-mono text-sm leading-relaxed text-text-primary placeholder:whitespace-pre-line placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-0 disabled:opacity-70"
        aria-label={strings.recoveryHeader}
      />
      <div className="flex items-center justify-between gap-3 text-xs">
        <span
          role="status"
          aria-live="polite"
          className={`font-mono text-[11px] tabular-nums transition-colors ${
            len > config.max_chars
              ? "text-red-600"
              : len > config.max_chars - 50
              ? "text-amber-600"
              : "text-text-muted"
          }`}
        >
          {counter}
        </span>
        <span className="font-mono text-[11px] tabular-nums text-text-muted">
          {attemptCounter}
        </span>
      </div>
    </div>
  );
}

// ─── Spark's dimension bars (Phase B feedback) ────────────────────────

function DimensionBars({
  scores,
  total,
  labels,
}: {
  scores: DebugEvaluation["scores"];
  total: number;
  labels: Record<DebugDimensionKey, string>;
}) {
  const dims: Array<{ key: DebugDimensionKey; value: number; max: number }> = [
    { key: "recognition", value: scores.recognition, max: 33 },
    { key: "recalibration", value: scores.recalibration, max: 33 },
    { key: "future_control", value: scores.future_control, max: 33 },
  ];
  return (
    <div className="mt-3 flex flex-col gap-1">
      {dims.map((d) => (
        <div key={d.key} className="flex items-center gap-2">
          <span className="w-28 shrink-0 font-mono text-[10px] uppercase tracking-wider text-text-muted">
            {labels[d.key]}
          </span>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-muted">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${Math.min(100, (d.value / d.max) * 100)}%` }}
            />
          </div>
          <span className="w-7 text-right font-mono text-[10px] text-text-muted">
            {d.value}
          </span>
        </div>
      ))}
      <p className="mt-1 text-right font-mono text-[10px] text-text-muted">
        Σ {total}/100 (+{scores.rollback_bonus} bonus)
      </p>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────

function effectForCase(
  c: DebugFeedbackCase,
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
  c: DebugFeedbackCase | null,
): InteractiveStepResult["band"] {
  switch (c) {
    case "incomplete":
      return "poor";
    case "missing_one":
      return "one_bug";
    case "good":
      return "two_bugs";
    case "excellent":
      return "perfect";
    default:
      return "poor";
  }
}

function xpForResult(
  c: DebugFeedbackCase | null,
  bestScore: number,
  config: BrokenSessionDebuggerConfig,
  attempts: number,
): number {
  const xp = config.xp_by_case;
  if (!c) return xp.incomplete;
  if (c === "excellent") {
    // Score = 100 includes the +1 rollback bonus → "perfect" tier.
    const base = bestScore >= 100 ? xp.perfect : xp.excellent;
    // First-attempt streak rewards: +70 if perfect on the first try,
    // +50 on excellent. Mirrors the constraints editor's bonus logic.
    if (attempts === 1) {
      return base + (bestScore >= 100 ? 130 - (xp.perfect - xp.excellent) : 70);
    }
    return base;
  }
  switch (c) {
    case "incomplete":
      return xp.incomplete;
    case "missing_one":
      return xp.missing_one;
    case "good":
      return xp.good;
  }
}

function hydrateDraft(
  persisted: string | undefined,
  sessionStorageKey: string,
): string {
  if (typeof window !== "undefined") {
    try {
      const cached = window.sessionStorage.getItem(sessionStorageKey);
      if (typeof cached === "string" && cached.length > 0) return cached;
    } catch {
      /* corrupt cache — fall through */
    }
  }
  if (typeof persisted === "string") return persisted;
  return "";
}

function fireFireworks(): void {
  if (typeof window === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const palette = ["#E8703F", "#EAB308", "#3ECF8E", "#FFF1EB"];
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
  window.setTimeout(burst, 350);
  window.setTimeout(burst, 700);
}
