"use client";

import { useState, type ChangeEvent, type KeyboardEvent } from "react";
import { Send, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OpenQuestionBlock } from "@/types";

// Pre-resolved i18n strings, computed server-side and passed as props.
// **Functions cannot cross the server/client boundary** — see PROMPTLY.md
// (commit 09d78a2 + Round 3a digest 293253662). Anything that varies at
// render time uses a template string with {token} placeholders that the
// component substitutes via .replace().
export interface OpenQuestionStrings {
  submitCta: string;
  submitting: string;
  submittedLabel: string;
  placeholderFallback: string;
  // Template: "{current} / {max}". Both tokens are required.
  charCounterTemplate: string;
  networkError: string;
  apiError: string;
  missingKeyError: string;
  retryCta: string;
  skipCta: string;
  skippedNotice: string;
}

function formatCharCounter(template: string, current: number, max: number): string {
  return template
    .replace("{current}", String(current))
    .replace("{max}", String(max));
}

const DEFAULT_MAX_CHARS = 500;

interface Props {
  lessonId: string;
  block: OpenQuestionBlock;
  strings: OpenQuestionStrings;
  // Reports state changes upward so LessonBodyRenderer can compute whether
  // the user has engaged with this question — useful for soft completion
  // signals (without ever blocking advancement).
  onAnswered?: (questionId: string) => void;
  onSkipped?: (questionId: string) => void;
}

type Status =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "answered"; comment: string }
  | { kind: "skipped" }
  | { kind: "error"; message: string; userAnswer: string };

export function OpenQuestion({
  lessonId,
  block,
  strings,
  onAnswered,
  onSkipped,
}: Props) {
  const maxChars = block.max_chars ?? DEFAULT_MAX_CHARS;
  const [value, setValue] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const placeholder = block.placeholder ?? strings.placeholderFallback;

  function handleChange(e: ChangeEvent<HTMLTextAreaElement>) {
    const next = e.target.value.slice(0, maxChars);
    setValue(next);
  }

  function handleKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      void handleSubmit();
    }
  }

  async function handleSubmit() {
    const trimmed = value.trim();
    if (trimmed.length === 0 || status.kind === "submitting") return;
    setStatus({ kind: "submitting" });
    try {
      const res = await fetch("/api/comment-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonId,
          openQuestionId: block.id,
          userAnswer: trimmed,
        }),
      });
      if (!res.ok) {
        const code = res.status;
        let message = strings.apiError;
        if (code === 503) message = strings.missingKeyError;
        if (code === 0) message = strings.networkError;
        setStatus({ kind: "error", message, userAnswer: trimmed });
        return;
      }
      const data = (await res.json()) as { comment?: string };
      if (typeof data.comment !== "string" || data.comment.length === 0) {
        setStatus({
          kind: "error",
          message: strings.apiError,
          userAnswer: trimmed,
        });
        return;
      }
      setStatus({ kind: "answered", comment: data.comment });
      onAnswered?.(block.id);
    } catch {
      setStatus({
        kind: "error",
        message: strings.networkError,
        userAnswer: trimmed,
      });
    }
  }

  function handleSkip() {
    setStatus({ kind: "skipped" });
    onSkipped?.(block.id);
  }

  function handleRetry() {
    if (status.kind === "error") {
      setValue(status.userAnswer);
      setStatus({ kind: "idle" });
    }
  }

  // ─── Rendered states ──────────────────────────────────────────────

  if (status.kind === "answered") {
    return (
      <section
        className="flex flex-col gap-3 rounded-2xl border border-primary/30 bg-primary-light/40 p-5 sm:p-6"
        aria-live="polite"
      >
        <header className="flex flex-col gap-1.5">
          <p className="eyebrow text-primary-deep">
            {strings.submittedLabel}
          </p>
          <p className="font-medium leading-snug text-text-primary">
            {block.prompt}
          </p>
        </header>
        <p className="whitespace-pre-wrap rounded-xl border border-border/60 bg-surface px-4 py-3 text-sm text-text-secondary">
          {value}
        </p>
        <div className="flex items-start gap-2 rounded-xl bg-surface px-4 py-3 text-sm text-text-primary">
          <Sparkles
            className="mt-0.5 h-4 w-4 shrink-0 text-primary"
            aria-hidden
          />
          <p className="leading-relaxed">{status.comment}</p>
        </div>
      </section>
    );
  }

  if (status.kind === "skipped") {
    return (
      <section
        className="flex flex-col gap-2 rounded-2xl border border-border bg-surface-muted p-5 sm:p-6"
        aria-live="polite"
      >
        <p className="font-medium leading-snug text-text-primary">
          {block.prompt}
        </p>
        <p className="text-sm text-text-muted">{strings.skippedNotice}</p>
      </section>
    );
  }

  const promptId = `oq-${block.id}-prompt`;
  const counterId = `oq-${block.id}-counter`;
  const helperId = `oq-${block.id}-helper`;
  const describedBy = block.helper_text
    ? `${counterId} ${helperId}`
    : counterId;

  return (
    <section
      className="flex flex-col gap-3 rounded-2xl border border-primary/30 bg-primary-light/40 p-5 sm:p-6"
    >
      <header className="flex flex-col gap-1.5">
        <p id={promptId} className="font-medium leading-snug text-text-primary">
          {block.prompt}
        </p>
        {block.helper_text ? (
          <p id={helperId} className="text-sm text-text-muted">
            {block.helper_text}
          </p>
        ) : null}
      </header>
      <textarea
        value={value}
        onChange={handleChange}
        onKeyDown={handleKey}
        placeholder={placeholder}
        maxLength={maxChars}
        rows={4}
        spellCheck={true}
        autoCapitalize="sentences"
        className={cn(
          "w-full resize-y rounded-xl border border-border bg-surface px-4 py-3 text-sm leading-relaxed text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-deep",
        )}
        aria-labelledby={promptId}
        aria-describedby={describedBy}
        disabled={status.kind === "submitting"}
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p
          id={counterId}
          aria-live="polite"
          className="text-xs text-text-muted"
        >
          {formatCharCounter(strings.charCounterTemplate, value.length, maxChars)}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSkip}
            disabled={status.kind === "submitting"}
            className="inline-flex items-center justify-center rounded-md border border-transparent px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:text-primary-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-deep disabled:cursor-not-allowed disabled:opacity-50"
          >
            {strings.skipCta}
          </button>
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={value.trim().length === 0 || status.kind === "submitting"}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-deep disabled:cursor-not-allowed disabled:opacity-50"
          >
            {status.kind === "submitting" ? (
              <>
                <Sparkles className="h-4 w-4 animate-pulse" aria-hidden />
                {strings.submitting}
              </>
            ) : (
              <>
                <Send className="h-4 w-4" aria-hidden />
                {strings.submitCta}
              </>
            )}
          </button>
        </div>
      </div>
      {status.kind === "error" ? (
        <div
          role="status"
          className="flex items-start gap-2 rounded-xl border border-error/30 bg-error/5 px-4 py-3 text-sm text-error"
        >
          <X className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={3} aria-hidden />
          <div className="flex flex-col gap-2">
            <p className="text-text-secondary">{status.message}</p>
            <button
              type="button"
              onClick={handleRetry}
              className="self-start rounded-sm text-xs font-semibold uppercase tracking-wider text-primary-deep underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-deep"
            >
              {strings.retryCta}
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
