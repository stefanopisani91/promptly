"use client";

// CONSTRAINTS_EDITOR — interactive widget for Lesson 4.
//
// Flow (Lezione4_Blueprint.md §13):
//   1. The user reads the seeded "DB disaster" mockup at the top.
//   2. They write three labelled constraints (protective / process / style)
//      in three independent textareas. Each has its own min/max char
//      budget; the submit button unlocks only when all three meet the
//      minimum.
//   3. On submit we call /api/lesson-constraints-evaluate. Haiku returns a
//      score per kind (0-33) plus a 1-point system bonus, a feedback case
//      (incomplete / missing_one / good / excellent), and a flag whether
//      the constraints would have prevented the disaster.
//   4. Spark reacts inline. The mockup shakes on incomplete, flashes amber
//      on missing_one, glows yellow on good, and "repairs" itself (🔥
//      fades, banner turns green, title row goes green) on excellent.
//   5. 3 attempts max. Final CTA persists the result and advances.
//
// Editor layout: three textareas in a single column on mobile, a 3-up
// grid on lg+. Each textarea has its own counter and a kind-specific
// icon header.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Send } from "lucide-react";
import confetti from "canvas-confetti";
import type {
  ConstraintsEditorConfig,
  ConstraintsKind,
  InteractiveStep as InteractiveStepType,
} from "@/types";
import { Spark } from "../Spark";
import { StepCard } from "../StepCard";
import { fireConfetti } from "@/lib/confetti";
import type { InteractiveStepResult } from "./InteractiveStep";
import {
  DatabaseDisasterMockup,
  type DatabaseDisasterStrings,
} from "./DatabaseDisasterMockup";

export type ConstraintsFeedbackCase =
  | "incomplete"
  | "missing_one"
  | "good"
  | "excellent";

export interface ConstraintsEvaluation {
  scores: {
    protective: number;
    process: number;
    style: number;
    system_bonus: number;
  };
  total: number;
  weakest_constraint: ConstraintsKind;
  strongest_constraint: ConstraintsKind;
  feedback_case: ConstraintsFeedbackCase;
  would_have_prevented: boolean;
  spark_reply: string;
}

export interface ConstraintsEditorStrings {
  intro: string;
  // Header above the editor — "Scrivi i 3 vincoli che..."
  editorHeader: string;
  charCounterTemplate: string; // "{current} / {max}"
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
  // Localised labels used in Spark dimension bars (matches ConstraintsKind).
  kindLabels: Record<ConstraintsKind, string>;
  // Strings for the disaster mockup itself — pre-resolved by the parent.
  mockup: DatabaseDisasterStrings;
}

interface Props {
  step: InteractiveStepType;
  userId: string;
  strings: ConstraintsEditorStrings;
  state:
    | {
        result?: InteractiveStepResult;
        editorTexts?: Record<string, string>;
      }
    | undefined;
  onComplete: (
    result: InteractiveStepResult,
    extras: { editorTexts: Record<string, string> },
  ) => void;
  onAdvance: () => void;
}

export function ConstraintsEditor({
  step,
  userId,
  strings,
  state,
  onComplete,
  onAdvance,
}: Props) {
  const config = step.constraints_config!;
  const persisted = state?.result;
  const finishedRef = useRef(Boolean(persisted));

  // Per-user, per-step sessionStorage key so two users on the same browser
  // don't see each other's drafts.
  const sessionStorageKey = `constraints:${userId}:${step.id}`;
  const [texts, setTexts] = useState<Record<string, string>>(() =>
    hydrateTexts(config, state?.editorTexts, sessionStorageKey),
  );

  const [attemptCount, setAttemptCount] = useState(persisted?.attempts ?? 0);
  const [bestScore, setBestScore] = useState(persisted?.bestScore ?? 0);
  const [evaluation, setEvaluation] = useState<ConstraintsEvaluation | null>(
    null,
  );
  const [evaluating, setEvaluating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editorEffect, setEditorEffect] = useState<
    "shake" | "flashAmber" | "flashYellow" | "glowGreen" | null
  >(null);
  const [dailyExhausted, setDailyExhausted] = useState(false);

  const sparkLine = evaluation?.spark_reply ?? strings.awaitingPrompt;
  const exhausted = attemptCount >= step.max_attempts;
  const won = evaluation?.feedback_case === "excellent";

  // Each textarea's trimmed length, used both for per-textarea counters
  // and for unlocking the submit button (every kind must be ≥ min).
  const lengths = useMemo(() => {
    const out: Record<ConstraintsKind, number> = {
      protective: 0,
      process: 0,
      style: 0,
    };
    for (const t of config.textareas) {
      const v = texts[t.kind] ?? "";
      out[t.kind] = v.trim().length;
    }
    return out;
  }, [config.textareas, texts]);

  const allLongEnough =
    lengths.protective >= config.min_chars_per_textarea &&
    lengths.process >= config.min_chars_per_textarea &&
    lengths.style >= config.min_chars_per_textarea;
  const anyTooLong =
    lengths.protective > config.max_chars_per_textarea ||
    lengths.process > config.max_chars_per_textarea ||
    lengths.style > config.max_chars_per_textarea;

  const submitDisabled =
    evaluating ||
    !allLongEnough ||
    anyTooLong ||
    exhausted ||
    won ||
    dailyExhausted;

  const attemptCounter = strings.attemptCounterTemplate
    .replace("{current}", String(Math.min(attemptCount + 1, step.max_attempts)))
    .replace("{max}", String(step.max_attempts));

  // Reset editor effect after its animation completes so a second attempt
  // of the same case can re-trigger the same effect.
  useEffect(() => {
    if (!editorEffect) return;
    const t = window.setTimeout(() => setEditorEffect(null), 1100);
    return () => window.clearTimeout(t);
  }, [editorEffect]);

  // Autosave to sessionStorage so the user doesn't lose work on tab
  // refresh / step navigation. Skipped on SSR + after finalisation.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (finishedRef.current) return;
    try {
      window.sessionStorage.setItem(sessionStorageKey, JSON.stringify(texts));
    } catch {
      /* sessionStorage may be disabled — silent skip */
    }
  }, [texts, sessionStorageKey]);

  function setKindText(kind: ConstraintsKind, value: string) {
    setTexts((prev) =>
      prev[kind] === value ? prev : { ...prev, [kind]: value },
    );
  }

  const submit = useCallback(async () => {
    if (submitDisabled) return;
    setEvaluating(true);
    setError(null);
    try {
      const res = await fetch("/api/lesson-constraints-evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonId: "mindset-04",
          stepId: step.id,
          protective: (texts.protective ?? "")
            .trim()
            .slice(0, config.max_chars_per_textarea),
          process: (texts.process ?? "")
            .trim()
            .slice(0, config.max_chars_per_textarea),
          style: (texts.style ?? "")
            .trim()
            .slice(0, config.max_chars_per_textarea),
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
      const body = (await res.json()) as { evaluation?: ConstraintsEvaluation };
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
    }
  }, [
    submitDisabled,
    texts,
    config.max_chars_per_textarea,
    attemptCount,
    bestScore,
    step.id,
    step.max_attempts,
    strings,
  ]);

  function handleFinalize() {
    if (!finishedRef.current) {
      finishedRef.current = true;
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
        { editorTexts: texts },
      );
    }
    onAdvance();
  }

  const showFinalCta =
    won || exhausted || attemptCount >= 1 || Boolean(persisted);
  const isPartialStop = !won && !exhausted && attemptCount >= 1;

  // The "repaired" mockup state is shown only after an excellent verdict.
  const mockupState: "broken" | "repaired" =
    evaluation?.would_have_prevented && evaluation?.feedback_case === "excellent"
      ? "repaired"
      : "broken";

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

        {/* The disaster mockup — visually drives the "ouch" reaction. */}
        <DatabaseDisasterMockup state={mockupState} strings={strings.mockup} />

        {/* Editor — three textareas */}
        <div className="flex flex-col gap-3">
          <p className="eyebrow text-text-muted">{strings.editorHeader}</p>
          <div
            className={`grid grid-cols-1 gap-4 lg:grid-cols-3 ${editorEffectClass}`}
          >
            {config.textareas.map((t) => {
              const value = texts[t.kind] ?? "";
              const len = lengths[t.kind];
              const counter = strings.charCounterTemplate
                .replace("{current}", String(len))
                .replace("{max}", String(config.max_chars_per_textarea));
              const aboveMin = len >= config.min_chars_per_textarea;
              return (
                <div
                  key={t.kind}
                  className="flex flex-col rounded-md border-2 border-border bg-white transition-colors focus-within:border-primary"
                >
                  <div className="flex items-center justify-between gap-2 border-b border-border/60 bg-surface-muted/40 px-3 py-2">
                    <p className="flex items-center gap-1.5 font-mono text-xs font-semibold uppercase tracking-wider text-text-primary">
                      <span aria-hidden="true">{t.icon}</span>
                      <span>{t.label}</span>
                    </p>
                    {aboveMin && (
                      <span
                        className="font-mono text-[10px] uppercase tracking-wider text-success"
                        aria-hidden="true"
                      >
                        ✓
                      </span>
                    )}
                  </div>
                  <p className="px-3 pt-2 text-[11px] italic text-text-muted">
                    {t.description}
                  </p>
                  <textarea
                    value={value}
                    onChange={(e) => setKindText(t.kind, e.target.value)}
                    placeholder={t.placeholder}
                    disabled={evaluating || won || exhausted}
                    rows={5}
                    maxLength={config.max_chars_per_textarea + 50}
                    className="block w-full flex-1 resize-y border-0 bg-transparent px-3 py-2 font-mono text-sm leading-relaxed text-text-primary placeholder:whitespace-pre-line placeholder:text-text-muted focus:outline-none focus:ring-0 disabled:opacity-70"
                    aria-label={t.label}
                  />
                  <div className="border-t border-border/60 bg-surface-muted/20 px-3 py-1.5">
                    <span
                      role="status"
                      aria-live="polite"
                      className={`font-mono text-[10px] tabular-nums transition-colors ${
                        len > config.max_chars_per_textarea
                          ? "text-red-600"
                          : len > config.max_chars_per_textarea - 30
                          ? "text-amber-600"
                          : "text-text-muted"
                      }`}
                    >
                      {counter}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-right font-mono text-[11px] tabular-nums text-text-muted">
            {attemptCounter}
          </p>
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
                  kindLabels={strings.kindLabels}
                />
              )}
            </div>
          </div>

          {!won && !exhausted && (
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
  kindLabels,
}: {
  scores: ConstraintsEvaluation["scores"];
  total: number;
  kindLabels: Record<ConstraintsKind, string>;
}) {
  const dims: Array<{ key: ConstraintsKind; value: number; max: number }> = [
    { key: "protective", value: scores.protective, max: 33 },
    { key: "process", value: scores.process, max: 33 },
    { key: "style", value: scores.style, max: 33 },
  ];
  return (
    <div className="mt-3 flex flex-col gap-1">
      {dims.map((d) => (
        <div key={d.key} className="flex items-center gap-2">
          <span className="w-24 shrink-0 font-mono text-[10px] uppercase tracking-wider text-text-muted">
            {kindLabels[d.key]}
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
        Σ {total}/100 (+{scores.system_bonus} bonus)
      </p>
    </div>
  );
}

function effectForCase(
  c: ConstraintsFeedbackCase,
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
  c: ConstraintsFeedbackCase | null,
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
  c: ConstraintsFeedbackCase | null,
  bestScore: number,
  config: ConstraintsEditorConfig,
  attempts: number,
): number {
  const xp = config.xp_by_case;
  if (!c) return xp.incomplete;
  if (c === "excellent") {
    // Score = 100 includes the +1 system_bonus, the "perfect" tier.
    const base = bestScore >= 100 ? xp.perfect : xp.excellent;
    return attempts === 1 ? base + 60 : base;
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

function hydrateTexts(
  config: ConstraintsEditorConfig,
  persisted: Record<string, string> | undefined,
  sessionStorageKey: string,
): Record<string, string> {
  const empty: Record<string, string> = Object.fromEntries(
    config.textareas.map((t) => [t.kind, ""]),
  );

  if (typeof window !== "undefined") {
    try {
      const cached = window.sessionStorage.getItem(sessionStorageKey);
      if (cached) {
        const parsed = JSON.parse(cached) as Record<string, unknown>;
        const out = { ...empty };
        for (const k of Object.keys(empty)) {
          const v = parsed[k];
          if (typeof v === "string") out[k] = v;
        }
        if (Object.values(out).some((v) => v.trim().length > 0)) return out;
      }
    } catch {
      /* corrupt cache — fall through */
    }
  }

  if (persisted) {
    return { ...empty, ...persisted };
  }
  return empty;
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
  window.setTimeout(burst, 400);
  window.setTimeout(burst, 800);
}
