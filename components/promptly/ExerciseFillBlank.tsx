"use client";

import { Fragment, useRef, useState, type KeyboardEvent } from "react";
import Link from "next/link";
import { ArrowRight, Check, Lightbulb, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { track } from "@/lib/analytics/posthog";
import type { LandingCopy } from "@/lib/i18n/landing";

interface Props {
  copy: LandingCopy["exercise"];
  standalone?: boolean;
  ctaHref?: string;
  onComplete?: (result: { attempts: number; hintsUsed: 0 | 1 | 2 | 3 }) => void;
}

const MAX_ATTEMPTS = 3;
const CONFETTI_COLORS = ["#E8703F", "#F59E0B", "#16A34A"];

function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function isBlankCorrect(value: string, accepted: string[]): boolean {
  const norm = normalize(value);
  if (!norm) return false;
  return accepted.some((a) => normalize(a) === norm);
}

async function fireConfetti(): Promise<void> {
  if (typeof window === "undefined") return;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
  const { default: confetti } = await import("canvas-confetti");
  confetti({
    particleCount: 80,
    spread: 70,
    startVelocity: 35,
    origin: { y: 0.7 },
    colors: CONFETTI_COLORS,
    disableForReducedMotion: true,
  });
}

export function ExerciseFillBlank({
  copy,
  standalone = false,
  ctaHref = "/auth?source=hero_secondary&completed_demo=true",
  onComplete,
}: Props) {
  const blankCount = copy.blanks.length;
  const [values, setValues] = useState<string[]>(() =>
    Array(blankCount).fill(""),
  );
  const [wrongFlags, setWrongFlags] = useState<boolean[]>(() =>
    Array(blankCount).fill(false),
  );
  const [attempts, setAttempts] = useState(0);
  const [hintLevel, setHintLevel] = useState<0 | 1 | 2 | 3>(0);
  const [completed, setCompleted] = useState(false);
  const [showWrongInline, setShowWrongInline] = useState(false);
  const startedRef = useRef(false);

  const parts = copy.promptText.split("___");

  const setValue = (idx: number, v: string) => {
    setValues((prev) => prev.map((p, i) => (i === idx ? v : p)));
    setShowWrongInline(false);
    if (wrongFlags[idx]) {
      setWrongFlags((prev) => prev.map((p, i) => (i === idx ? false : p)));
    }
  };

  const handleFocus = () => {
    if (startedRef.current) return;
    startedRef.current = true;
    track({ name: "landing_exercise_started" });
  };

  const handleHint = () => {
    if (hintLevel >= 3 || completed) return;
    const next = (hintLevel + 1) as 1 | 2 | 3;
    setHintLevel(next);
    track({ name: "landing_exercise_hint_used", props: { hint_level: next } });
    if (next === 3) {
      setValues(copy.blanks.map((b) => b.accepted[0]));
      setWrongFlags(Array(blankCount).fill(false));
    }
  };

  const handleVerify = () => {
    if (completed) return;
    const correctness = copy.blanks.map((b, i) =>
      isBlankCorrect(values[i], b.accepted),
    );
    const allCorrect = correctness.every(Boolean);
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);

    track({
      name: "landing_exercise_attempt",
      props: { attempt_n: newAttempts, correct: allCorrect },
    });

    if (allCorrect) {
      setCompleted(true);
      setWrongFlags(Array(blankCount).fill(false));
      setShowWrongInline(false);
      track({
        name: "landing_exercise_completed",
        props: { attempts_used: newAttempts, hints_used: hintLevel },
      });
      onComplete?.({ attempts: newAttempts, hintsUsed: hintLevel });
      void fireConfetti();
      return;
    }

    setWrongFlags(correctness.map((c) => !c));
    setShowWrongInline(true);

    if (newAttempts >= MAX_ATTEMPTS && hintLevel < 3) {
      setHintLevel(3);
      setValues(copy.blanks.map((b) => b.accepted[0]));
      setWrongFlags(Array(blankCount).fill(false));
    }
  };

  const handleCtaClick = () => {
    track({ name: "landing_exercise_cta_clicked" });
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleVerify();
    }
  };

  const allEmpty = values.every((v) => !v.trim());

  const promptNodes = parts.map((part, i) => {
    const isLast = i === parts.length - 1;
    return (
      <Fragment key={i}>
        {part}
        {!isLast &&
          (completed ? (
            <span className="mx-1 inline-flex items-center gap-1 rounded bg-prompt-fill-done/25 px-2 py-0.5 font-semibold text-prompt-fill-done">
              <Check className="h-3 w-3" strokeWidth={3} aria-hidden />
              {values[i]}
            </span>
          ) : (
            <input
              type="text"
              value={values[i]}
              onChange={(e) => setValue(i, e.target.value)}
              onFocus={handleFocus}
              onKeyDown={onKeyDown}
              spellCheck={false}
              autoCapitalize="none"
              autoCorrect="off"
              aria-label={copy.microcopy.ariaInputBlank.replace(
                "{n}",
                String(i + 1),
              )}
              placeholder="…"
              className={cn(
                "mx-1 inline-block w-32 rounded border-b-2 bg-transparent px-1.5 py-0.5 font-medium text-prompt-fill placeholder:text-prompt-text/40 outline-none transition-colors sm:w-40",
                wrongFlags[i]
                  ? "border-error text-error"
                  : "border-prompt-text/30 focus:border-prompt-fill",
              )}
            />
          ))}
      </Fragment>
    );
  });

  const promptCard = (
    <div className="rounded-lg bg-prompt-bg p-5 sm:p-6">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-prompt-text/60">
        {copy.promptLabel}
      </p>
      <p className="mt-3 font-mono text-sm leading-loose text-prompt-text sm:text-base">
        {promptNodes}
      </p>
    </div>
  );

  const actions = !completed && (
    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleVerify}
          disabled={allEmpty}
          className="inline-flex items-center justify-center rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-deep disabled:cursor-not-allowed disabled:opacity-50"
        >
          {copy.microcopy.verify}
        </button>
        <button
          type="button"
          onClick={handleHint}
          disabled={hintLevel >= 3}
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:border-primary hover:text-primary-deep disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Lightbulb className="h-4 w-4" />
          {copy.microcopy.hint}
        </button>
      </div>
      {attempts > 0 && (
        <p className="text-xs text-text-muted">
          {copy.microcopy.attemptOf.replace(
            "{n}",
            String(Math.min(attempts, MAX_ATTEMPTS)),
          )}
        </p>
      )}
    </div>
  );

  const showFeedback = !completed && (hintLevel > 0 || showWrongInline);

  const feedback = showFeedback && (
    <div
      role="status"
      aria-live="polite"
      aria-label={copy.microcopy.ariaFeedback}
      className="mt-4 rounded-lg border border-border bg-surface p-4"
    >
      {showWrongInline && hintLevel === 0 && (
        <p className="flex items-start gap-2 text-sm text-text-secondary">
          <X
            className="mt-0.5 h-4 w-4 shrink-0 text-error"
            strokeWidth={3}
            aria-hidden
          />
          {copy.microcopy.wrongInline}
        </p>
      )}
      {hintLevel > 0 && hintLevel < 3 && (
        <div>
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary-deep">
            <Lightbulb className="h-3 w-3" />
            {copy.microcopy.hintLabel}
          </p>
          <ul className="mt-2 space-y-1.5 text-sm text-text-secondary">
            {copy.blanks.map((b, i) => (
              <li key={i}>
                <span className="font-semibold text-text-primary">
                  {copy.microcopy.blankLabel} {i + 1}:
                </span>{" "}
                {b.hints[hintLevel - 1]}
              </li>
            ))}
          </ul>
        </div>
      )}
      {hintLevel === 3 && (
        <div>
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-success">
            <Check className="h-3 w-3" strokeWidth={3} />
            {copy.microcopy.revealLabel}
          </p>
          <p className="mt-2 text-sm text-text-secondary">
            {copy.microcopy.revealedNotice}
          </p>
        </div>
      )}
    </div>
  );

  const completion = standalone && completed && (
    <div className="mt-5 rounded-lg border border-success-light bg-success-light/40 p-5 text-center sm:p-6">
      <p className="inline-flex items-center gap-2 font-heading text-lg font-semibold text-success sm:text-xl">
        <Check className="h-5 w-5" strokeWidth={3} aria-hidden />
        {copy.microcopy.completedTitle}
      </p>
      <p className="mt-2 text-sm text-text-secondary sm:text-base">
        {copy.microcopy.completedSub}
      </p>
      <Link
        href={ctaHref}
        onClick={handleCtaClick}
        className="mt-4 inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-base font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-deep"
      >
        {copy.microcopy.completedCta}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );

  const body = (
    <>
      {standalone && (
        <div className="mb-4 space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-primary-deep">
            {copy.lessonStep}
          </p>
          <h3 className="font-heading text-lg font-semibold text-text-primary">
            {copy.lessonTitle}
          </h3>
        </div>
      )}
      {promptCard}
      {actions}
      {feedback}
      {completion}
    </>
  );

  if (!standalone) return body;

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-xl shadow-primary/10">
      <div className="flex items-center gap-2 border-b border-border bg-surface-muted px-3 py-2">
        <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" aria-hidden />
        <span className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]" aria-hidden />
        <span className="h-2.5 w-2.5 rounded-full bg-[#28C840]" aria-hidden />
        <div className="ml-3 flex-1 truncate rounded-md bg-surface px-2 py-1 text-center text-[10px] text-text-muted">
          {copy.url}
        </div>
      </div>
      <div className="p-5 sm:p-7">{body}</div>
    </div>
  );
}
