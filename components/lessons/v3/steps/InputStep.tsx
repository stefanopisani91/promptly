"use client";

// INPUT step — free-text answer commented by Spark via gpt-4o-mini. Reuses
// the same /api/comment-answer route already powering V2 open_question
// blocks (the contract is: lessonId + blockId + answer → { commentary }).
//
// The user can submit once; their answer + Spark's reply are persisted into
// the per-lesson stepState bag, so a returning user lands back on this step
// with both already filled in.
//
// Submitted UI: a mini chat thread — user answer on the right (grey bubble),
// Spark's reply on the left (orange-tinted bubble with Spark avatar).
// The Spark reply enters with spark-reply-in (globals.css) so it feels like
// it arrives from Spark after the API responds.

import { useEffect, useState } from "react";
import type { InputStep as InputStepType } from "@/types";
import { StepCard } from "../StepCard";
import { SparkSphere } from "@/components/promptly/SparkSphere";

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
          /* ── Input state ───────────────────────────────────────────── */
          <div className="flex flex-col gap-3">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value.slice(0, max))}
              placeholder={step.placeholder}
              rows={5}
              className="w-full resize-none rounded-xl border border-border bg-surface p-4 text-base leading-relaxed text-text-primary placeholder:text-text-muted transition-colors focus-visible:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary/40"
              disabled={submitting}
            />
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-text-muted">{counter}</span>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || draft.trim().length < 2}
                className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white transition-all hover:bg-primary-hover active:scale-[0.97] disabled:opacity-50 disabled:active:scale-100"
              >
                {submitting ? strings.submitting : strings.submitCta}
              </button>
            </div>
            {error && (
              <div
                className="flex items-start gap-2 rounded-xl border border-error/30 bg-error/5 px-3 py-2"
                role="status"
              >
                <SparkSphere state="sad" size={28} />
                <p className="text-xs leading-relaxed text-text-primary">
                  {error === "network" ? strings.networkError : strings.apiError}
                </p>
              </div>
            )}
          </div>
        ) : (
          /* ── Submitted state — mini chat thread ─────────────────────
               User answer: right-aligned grey bubble
               Spark reply: left-aligned orange bubble + Spark avatar       */
          <div className="flex flex-col gap-4">
            {/* User bubble — right */}
            <div className="flex justify-end">
              <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-surface-muted px-4 py-3">
                <p className="text-sm font-medium uppercase tracking-wider text-text-muted mb-1">
                  {strings.youLabel}
                </p>
                <p className="text-base text-text-secondary leading-relaxed">
                  {state?.answer}
                </p>
              </div>
            </div>

            {/* Spark bubble — left */}
            <div className="spark-reply-in flex items-start gap-3">
              <div className="shrink-0 mt-1">
                <SparkSphere state="happy" size={36} />
              </div>
              <div className="max-w-[85%] rounded-2xl rounded-tl-sm border border-primary/20 bg-primary-light/60 px-4 py-3">
                <p className="text-sm font-medium uppercase tracking-wider text-primary-deep mb-1">
                  {strings.sparkLabel}
                </p>
                <p className="text-base italic leading-relaxed text-text-primary">
                  {state?.sparkReply}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </StepCard>
  );
}
