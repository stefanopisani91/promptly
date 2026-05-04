"use client";

// INPUT step — free-text answer commented by Spark via gpt-4o-mini. Reuses
// the same /api/comment-answer route already powering V2 open_question
// blocks (the contract is: lessonId + blockId + answer → { commentary }).
//
// The user can submit once; their answer + Spark's reply are persisted into
// the per-lesson stepState bag, so a returning user lands back on this step
// with both already filled in.

import { useEffect, useState } from "react";
import type { InputStep as InputStepType } from "@/types";
import { StepCard } from "../StepCard";

export interface InputStepStrings {
  submitCta: string;
  submitting: string;
  // Pattern with {current} / {max}
  charCounterTemplate: string;
  networkError: string;
  apiError: string;
  retryCta: string;
  youLabel: string;
  sparkLabel: string;
}

interface Props {
  step: InputStepType;
  lessonId: string;
  state: { answer?: string; sparkReply?: string } | undefined;
  onChange: (next: { answer: string; sparkReply: string | null }) => void;
  strings: InputStepStrings;
}

export function InputStep({ step, lessonId, state, onChange, strings }: Props) {
  const [draft, setDraft] = useState(state?.answer ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<"network" | "api" | null>(null);
  const submitted = Boolean(state?.sparkReply);
  const max = step.max_chars ?? 500;

  useEffect(() => {
    setDraft(state?.answer ?? "");
  }, [state?.answer, step.id]);

  async function handleSubmit() {
    if (submitting || draft.trim().length < 2) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/comment-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonId,
          blockId: step.id,
          answer: draft.slice(0, max),
        }),
      });
      if (!res.ok) {
        const fallback = step.fallback_response;
        onChange({ answer: draft, sparkReply: fallback });
        setError("api");
        return;
      }
      const data = (await res.json()) as { comment?: string };
      const reply = (data.comment ?? "").trim() || step.fallback_response;
      onChange({ answer: draft, sparkReply: reply });
    } catch {
      onChange({ answer: draft, sparkReply: step.fallback_response });
      setError("network");
    } finally {
      setSubmitting(false);
    }
  }

  const counter = strings.charCounterTemplate
    .replace("{current}", String(draft.length))
    .replace("{max}", String(max));

  return (
    <StepCard>
      <div className="flex flex-col gap-5">
        {step.intro && (
          <p className="text-base leading-relaxed text-text-secondary sm:text-lg">
            {step.intro}
          </p>
        )}
        <h2 className="font-heading text-xl font-semibold leading-tight text-text-primary sm:text-2xl">
          {step.prompt}
        </h2>
        {step.helper_text && (
          <p className="text-sm text-text-muted">{step.helper_text}</p>
        )}

        {!submitted ? (
          <div className="flex flex-col gap-3">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value.slice(0, max))}
              placeholder={step.placeholder}
              rows={5}
              className="w-full resize-none rounded-2xl border border-border bg-surface p-4 text-base leading-relaxed text-text-primary placeholder:text-text-muted focus-visible:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary"
              disabled={submitting}
            />
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-text-muted">{counter}</span>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || draft.trim().length < 2}
                className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
              >
                {submitting ? strings.submitting : strings.submitCta}
              </button>
            </div>
            {error && (
              <p className="text-xs text-error" role="status">
                {error === "network" ? strings.networkError : strings.apiError}
              </p>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-surface-muted/40 p-4 sm:p-5">
            <div>
              <p className="eyebrow mb-1 text-text-muted">{strings.youLabel}</p>
              <p className="text-base text-text-secondary">{state?.answer}</p>
            </div>
            <div>
              <p className="eyebrow mb-1 text-primary-deep">{strings.sparkLabel}</p>
              <p className="text-base italic leading-relaxed text-text-primary">
                {state?.sparkReply}
              </p>
            </div>
          </div>
        )}
      </div>
    </StepCard>
  );
}
