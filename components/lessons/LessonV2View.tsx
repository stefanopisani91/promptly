"use client";

import { useRef, useState, useTransition } from "react";
import { CheckCheck } from "lucide-react";
import { fireConfetti } from "@/lib/confetti";
import { completeLessonAction } from "@/app/(app)/lesson/[id]/actions";
import {
  LessonBodyRenderer,
  type LessonBodyStrings,
} from "@/components/lessons/LessonBodyRenderer";
import {
  LessonOutro,
  type LessonOutroStrings,
} from "@/components/lessons/LessonOutro";
import { XpToast } from "@/components/lessons/XpToast";
import type { LessonV2Content } from "@/types";

export interface LessonV2ViewStrings {
  body: LessonBodyStrings;
  finishCta: string;
  alreadyCompleted: string;
  outro: LessonOutroStrings;
  toast: { full: string; dismissLabel: string };
}

interface Props {
  lesson: LessonV2Content;
  strings: LessonV2ViewStrings;
  nextLesson: { id: string; title: string } | null;
  pathHref: string;
  // Pre-computed XP totals so the client doesn't need lib/xp.
  baseLessonXp: number; // base + difficulty bonus, no quiz bonuses
}

/**
 * V2 lesson view. Composes the body renderer with the completion CTA.
 *
 * Completion model: the lesson is marked complete when the user clicks
 * "Complete the lesson" at the bottom. The button is enabled at any point
 * — the user is never blocked, but they have to make an explicit choice
 * to close the lesson. XP awarded = base lesson XP + sum of bonus XP from
 * each quiz the user actually revealed (engagement-based bonus).
 */
export function LessonV2View({
  lesson,
  strings,
  nextLesson,
  pathHref,
  baseLessonXp,
}: Props) {
  const [completed, setCompleted] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [, startTransition] = useTransition();
  const submittedRef = useRef(false);

  // Engagement signals (kept in refs because we don't need re-renders).
  const answeredQuestions = useRef(new Set<string>());
  const skippedQuestions = useRef(new Set<string>());
  const revealedQuizzes = useRef(new Map<string, string>()); // quizId -> archetypeKey

  function handleAnswered(questionId: string) {
    answeredQuestions.current.add(questionId);
    skippedQuestions.current.delete(questionId);
  }
  function handleSkipped(questionId: string) {
    skippedQuestions.current.add(questionId);
    answeredQuestions.current.delete(questionId);
  }
  function handleRevealed(quizId: string, archetypeKey: string) {
    revealedQuizzes.current.set(quizId, archetypeKey);
  }

  function computeEarnedBonusXp(): number {
    let total = 0;
    for (const block of lesson.body) {
      if (
        block.type === "archetype_quiz" &&
        revealedQuizzes.current.has(block.id) &&
        block.reveal_xp_bonus
      ) {
        total += block.reveal_xp_bonus;
      }
    }
    return total;
  }

  function handleComplete() {
    if (submittedRef.current || completed) return;
    submittedRef.current = true;
    const earnedBonus = computeEarnedBonusXp();
    const xpTotal = baseLessonXp + earnedBonus;
    setCompleted(true);
    setShowToast(true);
    fireConfetti();
    startTransition(async () => {
      await completeLessonAction({
        lessonId: lesson.id,
        pathSlug: lesson.path_slug,
        attempts: 1,
        xpEarned: xpTotal,
      });
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <LessonBodyRenderer
        lessonId={lesson.id}
        body={lesson.body}
        strings={strings.body}
        onAnswered={handleAnswered}
        onSkipped={handleSkipped}
        onRevealed={handleRevealed}
      />

      {!completed && (
        <div className="flex justify-center border-t border-border/60 pt-6">
          <button
            type="button"
            onClick={handleComplete}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 text-base font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-deep"
          >
            <CheckCheck className="h-5 w-5" aria-hidden />
            {strings.finishCta}
          </button>
        </div>
      )}

      {completed && (
        <LessonOutro
          strings={strings.outro}
          recap={lesson.outro.recap}
          nextPrompt={lesson.outro.next_prompt}
          nextLesson={nextLesson}
          pathHref={pathHref}
        />
      )}

      {showToast && (
        <XpToast
          label={strings.toast.full}
          dismissLabel={strings.toast.dismissLabel}
          onDismiss={() => setShowToast(false)}
        />
      )}
    </div>
  );
}
