"use client";

// CONTEXT_PROMPT_EDITOR — interactive widget for Lesson 3.
//
// Flow (Lezione3_Blueprint.md §13):
//   1. The user picks one of three scenarios (login / notifications / stats).
//      The choice seeds the empty prompt shown read-only on the left.
//   2. The user transforms it on the right: a single textarea where they add
//      the 4 levels of context (project, code, constraints, examples). The
//      blueprint's structured placeholder hints at the layout but doesn't
//      enforce it — Spark grades content, not headings.
//   3. On submit we call /api/lesson-context-evaluate with the scenario key,
//      the empty prompt and the rich prompt. The route runs Haiku 4.5 with a
//      4-level rubric and returns a feedback case + per-layer scores.
//   4. Spark reacts inline. Incomplete drafts trigger an editor shake; a
//      single missing layer flashes the border amber; "good" is a yellow
//      flash; "excellent" fires confetti and (at score ≥ 95) a fireworks
//      burst from both sides.
//   5. The user has 3 attempts. After the third or after an "excellent"
//      verdict, the final CTA persists the result and advances.
//
// Visual + animation patterns are intentionally identical to ClaudemdEditor
// — both reuse the editor effects (shake / flash-amber / flash-yellow /
// glow-green) declared in globals.css. The only structural difference is
// the side-by-side empty/rich layout.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Lock, Send, Sparkles } from "lucide-react";
import confetti from "canvas-confetti";
import type {
  ContextPromptEditorConfig,
  InteractiveStep as InteractiveStepType,
} from "@/types";
import { Spark } from "../Spark";
import { StepCard } from "../StepCard";
import { fireConfetti } from "@/lib/confetti";
import type { InteractiveStepResult } from "./InteractiveStep";
import {
  OptionCardSelector,
  type OptionCardItem,
} from "./OptionCardSelector";

export type ContextFeedbackCase =
  | "incomplete"
  | "missing_one"
  | "good"
  | "excellent";

export type ContextLayer = "project" | "code" | "constraints" | "examples";

export interface ContextEvaluation {
  scores: {
    project: number;
    code: number;
    constraints: number;
    examples: number;
  };
  total: number;
  missing_layer: ContextLayer | null;
  richest_layer: ContextLayer;
  feedback_case: ContextFeedbackCase;
  spark_reply: string;
}

export interface ContextPromptEditorStrings {
  intro: string;
  selectScenarioLabel: string;
  emptyPromptLabel: string;
  // Sub-label appended under the empty box header — clarifies it's a
  // read-only example, not a textarea.
  emptyPromptSubtitle: string;
  // Mobile-only "tap to expand" cue when the empty box is collapsed.
  emptyPromptExpandLabel: string;
  richPromptLabel: string;
  // Eyebrow + arrow line above the editable box, signalling "scrivi
  // qui sotto i 4 livelli". Auto-hides after the first focus.
  writeHereLabel: string;
  // Multi-line placeholder shown in the rich-prompt textarea before the
  // user types. Encodes the 4 levels as a soft scaffold; Spark grades
  // semantics, not formatting.
  richPromptPlaceholder: string;
  // "{current} / {max}" total counter under the textarea.
  totalCharCounterTemplate: string;
  attemptCounterTemplate: string; // "Tentativo {current} / {max}"
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
  // Mobile-only tab labels (desktop renders the editor and Spark side by side).
  editorTabLabel: string;
  sparkTabLabel: string;
  // Layer names — used in the Spark dimension bars. Values map 1:1 to the
  // ContextLayer keys. EN/IT translations live in lessons.ts.
  layerLabels: Record<ContextLayer, string>;
}

interface Props {
  step: InteractiveStepType;
  // Authenticated user id, used to scope the sessionStorage draft so two
  // users on the same browser/device don't see each other's work.
  userId: string;
  strings: ContextPromptEditorStrings;
  state:
    | {
        result?: InteractiveStepResult;
        editorText?: string;
        selectedScenario?: string;
        // Persisted from the last submit so Spark's reply + the 4
        // dimension bars survive navigation/reload (rule #3 in
        // LESSON-GUIDELINES.md §V3 — same as InteractiveStep /
        // BrokenSessionDebugger).
        lastEvaluation?: ContextEvaluation;
      }
    | undefined;
  onComplete: (
    result: InteractiveStepResult,
    extras: {
      editorText: string;
      selectedScenario: string;
      lastEvaluation: ContextEvaluation | null;
    },
  ) => void;
  onAdvance: () => void;
}

const MIN_DRAFT_CHARS = 100;

export function ContextPromptEditor({
  step,
  userId,
  strings,
  state,
  onComplete,
  onAdvance,
}: Props) {
  const config = step.context_config!;
  const persisted = state?.result;
  const finishedRef = useRef(Boolean(persisted));
  // Synchronous lock against double-submit. Same pattern as the Lucia
  // widget fix on 2026-05-09 — `evaluating` state propagates async, so
  // 3 fast clicks could all pass the guard and burn 3 attempts at once.
  const submitInFlightRef = useRef(false);

  const [selectedScenario, setSelectedScenario] = useState<string | null>(
    state?.selectedScenario ?? null,
  );

  // Per-user, per-step sessionStorage key. Same shape as ClaudemdEditor
  // (claudemd:<userId>:<stepId>) for consistency.
  const sessionStorageKey = `context:${userId}:${step.id}`;
  const [editorText, setEditorText] = useState<string>(() =>
    hydrateEditorText(state?.editorText, sessionStorageKey),
  );

  const [attemptCount, setAttemptCount] = useState(persisted?.attempts ?? 0);
  const [bestScore, setBestScore] = useState(persisted?.bestScore ?? 0);
  // Hydrated from stepState so a returning user reads the exact reply +
  // dimension bars they saw last time (instead of "awaiting your prompt").
  const [evaluation, setEvaluation] = useState<ContextEvaluation | null>(
    state?.lastEvaluation ?? null,
  );
  const [evaluating, setEvaluating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editorEffect, setEditorEffect] = useState<
    "shake" | "flashAmber" | "flashYellow" | "glowGreen" | null
  >(null);
  const [dailyExhausted, setDailyExhausted] = useState(false);
  // Whether the user has focused the editor at least once. Drives the
  // pulsing border + the "scrivi qui ↓" helper above. Once true, the
  // affordances stay hidden for the rest of the session — they're a one-
  // time onboarding nudge, not a persistent decoration.
  const [hasInteractedWithEditor, setHasInteractedWithEditor] = useState(
    () => Boolean(state?.editorText && state.editorText.trim().length > 0),
  );
  // Mobile-only: the empty box starts collapsed (max-h ≈ 1 line) so the
  // editor sits above it without competing for vertical real estate.
  // Tapping the header toggles the expansion. Ignored on desktop where
  // the box always shows full content side-by-side.
  const [emptyBoxExpanded, setEmptyBoxExpanded] = useState(false);

  const sparkLine =
    evaluation?.spark_reply ?? strings.awaitingPrompt;

  const exhausted = attemptCount >= step.max_attempts;
  // Require both the feedback_case AND a total >= 75 before locking the
  // editor. The server now derives total from clamped scores and downgrades
  // an inconsistent "excellent" — this client-side check is a belt-and-
  // suspenders defence against stale clients caching an older API response.
  const won =
    evaluation?.feedback_case === "excellent" &&
    (evaluation?.total ?? 0) >= 75;

  const scenarioOptions: OptionCardItem[] = useMemo(
    () =>
      config.scenarios.map((s) => ({
        id: s.key,
        icon: s.icon,
        title: s.title,
        shortTitle: s.short_title,
        description: s.description,
      })),
    [config.scenarios],
  );

  const selectedScenarioData = useMemo(
    () => config.scenarios.find((s) => s.key === selectedScenario) ?? null,
    [config.scenarios, selectedScenario],
  );

  const trimmedLength = editorText.trim().length;
  const submitDisabled =
    evaluating ||
    !selectedScenarioData ||
    trimmedLength < MIN_DRAFT_CHARS ||
    trimmedLength > config.max_chars ||
    exhausted ||
    won ||
    dailyExhausted;

  const counter = strings.totalCharCounterTemplate
    .replace("{current}", String(trimmedLength))
    .replace("{max}", String(config.max_chars));

  const attemptCounter = strings.attemptCounterTemplate
    .replace("{current}", String(Math.min(attemptCount + 1, step.max_attempts)))
    .replace("{max}", String(step.max_attempts));

  // Reset editor effect after its CSS animation completes so a second
  // attempt can re-trigger the same effect.
  useEffect(() => {
    if (!editorEffect) return;
    const t = window.setTimeout(() => setEditorEffect(null), 1100);
    return () => window.clearTimeout(t);
  }, [editorEffect]);

  // Autosave draft to sessionStorage so the user doesn't lose work on tab
  // refresh / step navigation. Skipped on SSR + after the run is finalised.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (finishedRef.current) return;
    try {
      window.sessionStorage.setItem(sessionStorageKey, editorText);
    } catch {
      /* sessionStorage may be disabled (private mode) — silent skip */
    }
  }, [editorText, sessionStorageKey]);

  const handleSubmit = useCallback(async () => {
    if (submitInFlightRef.current) return;
    if (submitDisabled || !selectedScenarioData) return;
    submitInFlightRef.current = true;
    setEvaluating(true);
    setError(null);
    try {
      const res = await fetch("/api/lesson-context-evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonId: "mindset-03",
          stepId: step.id,
          scenarioKey: selectedScenarioData.key,
          emptyPrompt: selectedScenarioData.empty_prompt,
          userRichPrompt: editorText.trim().slice(0, config.max_chars),
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
      const body = (await res.json()) as { evaluation?: ContextEvaluation };
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
        if (ev.total >= 95) {
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
    selectedScenarioData,
    editorText,
    config.max_chars,
    attemptCount,
    bestScore,
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
    // result with a "poor"/0-XP one. selectedScenarioData is always set
    // by the time the final CTA shows.
    if (evaluation && selectedScenarioData) {
      const band = bandForCase(evaluation?.feedback_case ?? null);
      const xpEarned = xpForResult(
        evaluation?.feedback_case ?? null,
        bestScore,
        config,
        attemptCount,
      );
      onComplete(
        {
          attempts: attemptCount,
          bestScore,
          victory: evaluation?.feedback_case === "excellent",
          band,
          xpEarned,
        },
        {
          editorText,
          selectedScenario: selectedScenarioData.key,
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

        <div>
          <p className="eyebrow mb-2 text-text-muted">
            {strings.selectScenarioLabel}
          </p>
          <OptionCardSelector
            options={scenarioOptions}
            selected={selectedScenario}
            onSelect={setSelectedScenario}
            disabled={won || exhausted}
            ariaLabel={strings.selectScenarioLabel}
          />
        </div>

        {/* Editor (LEFT, primary) + Empty (RIGHT, secondary) on desktop.
            On mobile the order flips: editor first (full width), empty
            second (collapsed by default). The visual hierarchy carries
            the affordance — orange-bordered editor reads as "act here",
            grey dashed empty box reads as "reference, locked". */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_1fr]">
          {/* Rich prompt — editable, primary affordance */}
          <div className="flex flex-col gap-2">
            {!hasInteractedWithEditor && (
              <div className="context-helper-fade-in flex items-center gap-2 px-1 text-sm font-medium text-primary-deep">
                <Sparkles size={14} aria-hidden="true" />
                <span>{strings.writeHereLabel}</span>
                <ChevronDown
                  size={14}
                  aria-hidden="true"
                  className="context-arrow-bounce"
                />
              </div>
            )}
            <div
              className={`flex flex-col rounded-md border-2 bg-white transition-shadow focus-within:border-primary-hover focus-within:shadow-[0_0_0_4px_rgba(232,112,63,0.18)] ${
                editorEffect
                  ? editorEffectClass
                  : !hasInteractedWithEditor && trimmedLength === 0
                  ? "context-editor-pulse-border"
                  : "border-primary"
              }`}
            >
              <div className="flex items-center justify-between gap-3 border-b border-border/60 bg-primary-light/40 px-3 py-2">
                <p className="font-mono text-xs font-semibold uppercase tracking-wider text-primary-deep">
                  {strings.richPromptLabel}
                </p>
              </div>
              <textarea
                value={editorText}
                onChange={(e) => setEditorText(e.target.value)}
                onFocus={() => setHasInteractedWithEditor(true)}
                placeholder={strings.richPromptPlaceholder}
                disabled={evaluating || won || exhausted}
                rows={12}
                maxLength={config.max_chars + 200}
                className="block w-full flex-1 resize-y border-0 bg-transparent px-4 py-3 font-mono text-sm leading-relaxed text-text-primary placeholder:whitespace-pre-line placeholder:text-text-muted focus:outline-none focus:ring-0 disabled:opacity-70"
                aria-label={strings.richPromptLabel}
              />
              <div className="border-t border-border/60 bg-primary-light/30 px-3 py-2">
                <div className="flex items-center justify-between gap-3">
                  <span
                    role="status"
                    aria-live="polite"
                    className={`font-mono text-[11px] tabular-nums transition-colors ${
                      trimmedLength > config.max_chars
                        ? "text-red-600"
                        : trimmedLength > config.max_chars - 100
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
            </div>
          </div>

          {/* Empty prompt — read-only baseline. Sits below the editor on
              mobile (order-last) and to the right of it on desktop. */}
          <div className="order-last flex flex-col rounded-md border border-dashed border-stone-300 bg-stone-50/60 lg:order-none">
            <button
              type="button"
              onClick={() => setEmptyBoxExpanded((v) => !v)}
              className="flex w-full items-center justify-between gap-3 border-b border-dashed border-stone-300 px-3 py-2 text-left transition-colors hover:bg-stone-100/60 lg:cursor-default lg:hover:bg-transparent"
              aria-expanded={emptyBoxExpanded}
              aria-label={strings.emptyPromptLabel}
            >
              <span className="flex items-center gap-2">
                <Lock size={12} aria-hidden="true" className="text-stone-400" />
                <span className="font-mono text-xs uppercase tracking-wider text-stone-500">
                  {strings.emptyPromptLabel}
                </span>
                <span className="hidden font-mono text-[10px] italic text-stone-400 sm:inline">
                  {strings.emptyPromptSubtitle}
                </span>
              </span>
              <span
                className={`font-mono text-[10px] uppercase text-stone-400 lg:hidden ${
                  emptyBoxExpanded ? "opacity-0" : "opacity-100"
                }`}
              >
                {strings.emptyPromptExpandLabel}
              </span>
            </button>
            <div
              className={`select-text px-4 transition-[max-height,padding] duration-200 ease-out lg:!max-h-none lg:!py-3 ${
                emptyBoxExpanded
                  ? "max-h-72 overflow-y-auto py-3"
                  : "max-h-12 overflow-hidden py-2"
              }`}
              style={{ pointerEvents: "none" }}
            >
              <p className="font-mono text-sm leading-relaxed text-stone-500">
                {selectedScenarioData?.empty_prompt ?? "—"}
              </p>
            </div>
          </div>
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
                <DimensionBars
                  scores={evaluation.scores}
                  total={evaluation.total}
                  layerLabels={strings.layerLabels}
                />
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
                {evaluating ? strings.submitting : strings.submitCta}
                {!evaluating && <Send size={14} />}
              </button>
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

function DimensionBars({
  scores,
  total,
  layerLabels,
}: {
  scores: ContextEvaluation["scores"];
  total: number;
  layerLabels: Record<ContextLayer, string>;
}) {
  const dims: Array<{ key: ContextLayer; value: number }> = [
    { key: "project", value: scores.project },
    { key: "code", value: scores.code },
    { key: "constraints", value: scores.constraints },
    { key: "examples", value: scores.examples },
  ];
  return (
    <div className="mt-3 flex flex-col gap-1">
      {dims.map((d) => (
        <div key={d.key} className="flex items-center gap-2">
          <span className="w-24 shrink-0 font-mono text-[10px] uppercase tracking-wider text-text-muted">
            {layerLabels[d.key]}
          </span>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-muted">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${Math.min(100, (d.value / 25) * 100)}%` }}
            />
          </div>
          <span className="w-7 text-right font-mono text-[10px] text-text-muted">
            {d.value}
          </span>
        </div>
      ))}
      <p className="mt-1 text-right font-mono text-[10px] text-text-muted">
        Σ {total}/100
      </p>
    </div>
  );
}

function effectForCase(
  c: ContextFeedbackCase,
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
  c: ContextFeedbackCase | null,
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
  c: ContextFeedbackCase | null,
  bestScore: number,
  config: ContextPromptEditorConfig,
  attempts: number,
): number {
  const xp = config.xp_by_case;
  if (!c) return xp.incomplete;
  if (c === "excellent") {
    // Score >= 95 is the "perfect" tier — bigger XP, plus a one-shot bonus
    // when nailed on the first attempt (per blueprint XP table).
    const base = bestScore >= 95 ? xp.perfect : xp.excellent;
    return attempts === 1 ? base + 50 : base;
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

function hydrateEditorText(
  persisted: string | undefined,
  sessionStorageKey: string,
): string {
  if (typeof window !== "undefined") {
    try {
      const cached = window.sessionStorage.getItem(sessionStorageKey);
      if (cached && cached.trim().length > 0) return cached;
    } catch {
      /* ignore */
    }
  }
  return persisted ?? "";
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
