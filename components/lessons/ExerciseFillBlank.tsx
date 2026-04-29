"use client";

import {
  Fragment,
  useRef,
  useState,
  useTransition,
  type KeyboardEvent,
} from "react";
import { Check, Lightbulb, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { checkBlank } from "@/lib/lessons/validate";
import { calculateLessonXp } from "@/lib/xp";
import { completeLessonAction } from "@/app/(app)/lesson/[id]/actions";
import { LessonOutro } from "@/components/lessons/LessonOutro";
import { XpToast } from "@/components/lessons/XpToast";
import type { FillBlankExercise, LessonContent } from "@/types";
import type { LessonsCopy } from "@/lib/i18n/lessons";

interface Props {
  lesson: LessonContent;
  exercise: FillBlankExercise;
  copy: LessonsCopy;
  pathTitle: string;
  nextLesson: { id: string; title: string } | null;
  pathHref: string;
}

const MAX_ATTEMPTS = 3;
type HintLevel = 0 | 1 | 2;

const partsFromTemplate = (template: string): string[] =>
  template.split("[BLANK]");

export function ExerciseFillBlank({
  lesson,
  exercise,
  copy,
  pathTitle,
  nextLesson,
  pathHref,
}: Props) {
  const blankCount = exercise.blanks.length;
  const parts = partsFromTemplate(exercise.prompt_template);

  const [values, setValues] = useState<string[]>(() =>
    Array(blankCount).fill(""),
  );
  const [wrongFlags, setWrongFlags] = useState<boolean[]>(() =>
    Array(blankCount).fill(false),
  );
  const [attempts, setAttempts] = useState(0);
  const [hintLevel, setHintLevel] = useState<HintLevel>(0);
  const [revealed, setRevealed] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [showWrongInline, setShowWrongInline] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [pending, startTransition] = useTransition();
  const submittedRef = useRef(false);

  const cp = copy.lessonPage;

  const setValue = (idx: number, v: string) => {
    setValues((prev) => prev.map((p, i) => (i === idx ? v : p)));
    setShowWrongInline(false);
    if (wrongFlags[idx]) {
      setWrongFlags((prev) => prev.map((p, i) => (i === idx ? false : p)));
    }
  };

  const handleHint = () => {
    if (revealed || completed || hintLevel >= 2) return;
    setHintLevel((prev) => (prev < 2 ? ((prev + 1) as HintLevel) : prev));
  };

  const persistCompletion = (finalAttempts: number) => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    const xp = calculateLessonXp(
      lesson.base_xp,
      lesson.difficulty_bonus_xp,
      finalAttempts,
    );
    setXpEarned(xp);
    setCompleted(true);
    setShowToast(true);
    startTransition(async () => {
      await completeLessonAction({
        lessonId: lesson.id,
        pathSlug: lesson.path_slug,
        attempts: finalAttempts,
        xpEarned: xp,
      });
    });
  };

  const handleVerify = () => {
    if (completed || revealed) return;
    const correctness = exercise.blanks.map((b, i) =>
      checkBlank(values[i], b.correct_answers),
    );
    const allCorrect = correctness.every(Boolean);
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);

    if (allCorrect) {
      setWrongFlags(Array(blankCount).fill(false));
      setShowWrongInline(false);
      persistCompletion(newAttempts);
      return;
    }

    setWrongFlags(correctness.map((c) => !c));
    setShowWrongInline(true);

    if (newAttempts >= MAX_ATTEMPTS) {
      setRevealed(true);
      setValues(exercise.blanks.map((b) => b.correct_answers[0]));
      setWrongFlags(Array(blankCount).fill(false));
      setShowWrongInline(false);
      persistCompletion(newAttempts);
    }
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
          (completed && !revealed ? (
            <span className="mx-1 inline-flex items-center gap-1 rounded bg-prompt-fill-done/25 px-2 py-0.5 font-semibold text-prompt-fill-done">
              <Check className="h-3 w-3" strokeWidth={3} aria-hidden />
              {values[i]}
            </span>
          ) : revealed ? (
            <span className="mx-1 inline-flex items-center gap-1 rounded bg-warning/15 px-2 py-0.5 font-semibold text-warning">
              {values[i]}
            </span>
          ) : (
            <input
              type="text"
              value={values[i]}
              onChange={(e) => setValue(i, e.target.value)}
              onKeyDown={onKeyDown}
              spellCheck={false}
              autoCapitalize="none"
              autoCorrect="off"
              aria-label={cp.blankAriaLabel(i + 1)}
              placeholder={cp.blankPlaceholder}
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

  const showFeedback = !completed && (hintLevel > 0 || showWrongInline);

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl bg-prompt-bg p-5 sm:p-6">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-prompt-text/60">
          {cp.promptLabel}
        </p>
        <p className="mt-3 font-mono text-sm leading-loose text-prompt-text sm:text-base">
          {promptNodes}
        </p>
      </div>

      {!completed && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleVerify}
              disabled={allEmpty || pending}
              className="inline-flex items-center justify-center rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-deep disabled:cursor-not-allowed disabled:opacity-50"
            >
              {cp.checkAnswer}
            </button>
            <button
              type="button"
              onClick={handleHint}
              disabled={hintLevel >= 2}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:border-primary hover:text-primary-deep disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Lightbulb className="h-4 w-4" />
              {cp.showHint}
            </button>
          </div>
          {attempts > 0 && (
            <p className="text-xs text-text-muted">
              {cp.attemptOf(Math.min(attempts, MAX_ATTEMPTS), MAX_ATTEMPTS)}
            </p>
          )}
        </div>
      )}

      {showFeedback && (
        <div
          role="status"
          aria-live="polite"
          className="rounded-xl border border-border bg-surface p-4"
        >
          {showWrongInline && hintLevel === 0 && (
            <p className="flex items-start gap-2 text-sm text-text-secondary">
              <X
                className="mt-0.5 h-4 w-4 shrink-0 text-error"
                strokeWidth={3}
                aria-hidden
              />
              {cp.wrongInline}
            </p>
          )}
          {hintLevel > 0 && (
            <div>
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary-deep">
                <Lightbulb className="h-3 w-3" />
                {cp.hintLabel}
              </p>
              <ul className="mt-2 space-y-1.5 text-sm text-text-secondary">
                {exercise.blanks.map((b, i) => (
                  <li key={i}>
                    <span className="font-semibold text-text-primary">
                      {cp.blankAriaLabel(i + 1)}:
                    </span>{" "}
                    {hintLevel === 1 ? b.hint_1 : b.hint_2}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {revealed && (
        <div className="rounded-xl border border-warning/40 bg-warning/10 p-4">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-warning">
            <Lightbulb className="h-3 w-3" />
            {cp.revealLabel}
          </p>
          <p className="mt-2 text-sm text-text-secondary">{cp.revealedNotice}</p>
          <ul className="mt-3 space-y-2 text-sm text-text-secondary">
            {exercise.blanks.map((b, i) => (
              <li key={i}>
                <span className="font-semibold text-text-primary">
                  {cp.blankAriaLabel(i + 1)}:
                </span>{" "}
                {b.explanation}
              </li>
            ))}
          </ul>
        </div>
      )}

      {completed && (
        <LessonOutro
          copy={copy}
          recap={lesson.outro.recap}
          nextPrompt={lesson.outro.next_prompt}
          xpEarned={xpEarned}
          nextLesson={nextLesson}
          pathHref={pathHref}
          pathTitle={pathTitle}
        />
      )}

      {showToast && (
        <XpToast
          label={copy.toast.xpLabel(xpEarned)}
          onDismiss={() => setShowToast(false)}
        />
      )}
    </div>
  );
}
