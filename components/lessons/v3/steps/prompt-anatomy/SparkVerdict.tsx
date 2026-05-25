"use client";

// Verdict overlay that sits on top of the review screen after the user
// hits "Chiedi a Spark". Shows Spark + reply + 4 dimension bars (animated
// growth) + the appropriate CTA ("Continua" on won/exhausted, "Riprova"
// otherwise). Confetti fires on excellent.

import { useEffect } from "react";
import { ArrowRight, RotateCw } from "lucide-react";
import type {
  AnatomyDimension,
  AnatomyEvaluation,
  AnatomyFeedbackCase,
} from "@/types";
import { SparkSphere } from "@/components/promptly/SparkSphere";
import { fireConfetti } from "@/lib/confetti";

export interface SparkVerdictStrings {
  // "Continua" when the run is over (won or exhausted attempts) — moves
  // the lesson forward. "Riprova" otherwise — drops back into review.
  continueCta: string;
  retryCta: string;
  // "+{xp} XP" template, used as the reward badge.
  xpEarnedTemplate: string;
  // Localised labels for the 4 dimension bars.
  dimensionLabels: Record<AnatomyDimension, string>;
}

interface Props {
  evaluation: AnatomyEvaluation;
  xpEarned: number;
  attemptsLeft: number;
  // True when the verdict is the FINAL stop — either won or 0 attempts
  // left. Drives the CTA label + click handler.
  isFinal: boolean;
  strings: SparkVerdictStrings;
  onContinue: () => void;
  onRetry: () => void;
}

export function SparkVerdict({
  evaluation,
  xpEarned,
  attemptsLeft,
  isFinal,
  strings,
  onContinue,
  onRetry,
}: Props) {
  const isExcellent = evaluation.feedback_case === "excellent";

  // Fire confetti exactly once when the overlay mounts on an excellent
  // verdict — `evaluation` is treated as immutable by the parent so this
  // doesn't double-fire on re-renders.
  useEffect(() => {
    if (isExcellent) fireConfetti();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="anatomy-verdict-sheet flex flex-col gap-4 rounded-2xl border-2 bg-surface p-5"
      style={{
        borderColor: isExcellent
          ? "var(--anatomy-band-good)"
          : "var(--border)",
      }}
    >
      <div className="flex items-start gap-3">
        <SparkSphere
          state={
            isExcellent
              ? "happy"
              : evaluation.feedback_case === "vague"
              ? "sad"
              : "thinking"
          }
          size={48}
        />
        <div className="flex-1">
          <p className="eyebrow mb-1 text-primary-deep">spark</p>
          <p className="text-sm italic leading-relaxed text-text-primary">
            {evaluation.spark_reply}
          </p>
        </div>
      </div>

      <DimensionBars
        scores={evaluation.scores}
        total={evaluation.total}
        labels={strings.dimensionLabels}
      />

      {isExcellent && xpEarned > 0 && (
        <p
          className="anatomy-xp-badge self-center rounded-full px-3 py-1 text-sm font-semibold text-white"
          style={{ backgroundColor: "var(--xp-gold, #eab308)" }}
        >
          {strings.xpEarnedTemplate.replace("{xp}", String(xpEarned))}
        </p>
      )}

      <button
        type="button"
        onClick={isFinal ? onContinue : onRetry}
        className="inline-flex items-center justify-center gap-2 self-stretch rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-primary-hover active:scale-[0.97]"
        style={{ touchAction: "manipulation" }}
      >
        {isFinal ? (
          <>
            {strings.continueCta}
            <ArrowRight size={14} />
          </>
        ) : (
          <>
            <RotateCw size={14} />
            {strings.retryCta}
          </>
        )}
      </button>

      {!isFinal && (
        <p className="text-center text-[11px] italic text-text-muted">
          {attemptsLeft === 1 ? "Ultimo tentativo." : `${attemptsLeft} tentativi rimasti.`}
        </p>
      )}
    </div>
  );
}

const DIM_ORDER: AnatomyDimension[] = [
  "context",
  "task",
  "constraints",
  "format",
];

const ACCENT_VAR: Record<AnatomyDimension, string> = {
  context: "var(--anatomy-context)",
  task: "var(--anatomy-task)",
  constraints: "var(--anatomy-constraints)",
  format: "var(--anatomy-format)",
};

function DimensionBars({
  scores,
  total,
  labels,
}: {
  scores: AnatomyEvaluation["scores"];
  total: number;
  labels: Record<AnatomyDimension, string>;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {DIM_ORDER.map((dim) => {
        const value = scores[dim];
        const pct = Math.max(0, Math.min(100, (value / 25) * 100));
        return (
          <div key={dim} className="flex items-center gap-2">
            <span className="w-24 shrink-0 font-mono text-[10px] uppercase tracking-wider text-text-muted">
              {labels[dim]}
            </span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-muted">
              <div
                className="anatomy-dim-fill h-full transition-all"
                style={{
                  width: `${pct}%`,
                  backgroundColor: ACCENT_VAR[dim],
                }}
              />
            </div>
            <span className="w-10 text-right font-mono text-[10px] text-text-muted">
              {value}/25
            </span>
          </div>
        );
      })}
      <p className="mt-1 text-right font-mono text-[10px] text-text-muted">
        Σ {total}/100
      </p>
    </div>
  );
}

// Pure helper used by the parent — keeps the case → CTA mapping in one
// place. Exported so the unit test (if/when written) can pin it without
// digging into the JSX.
export function isFinalVerdict(
  feedbackCase: AnatomyFeedbackCase,
  attemptsUsed: number,
  maxAttempts: number,
): boolean {
  if (feedbackCase === "excellent") return true;
  return attemptsUsed >= maxAttempts;
}
