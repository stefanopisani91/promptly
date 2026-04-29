import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { isLang, type Lang } from "@/types";
import { resolveLangFromRequest } from "@/lib/i18n/server-lang";
import { getLessonsCopy } from "@/lib/i18n/lessons";
import { createClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/lib/supabase/queries";
import { loadAvailableLessonsInPath, loadLessonById } from "@/lib/lessons/load";
import {
  getLessonNeighbors,
  isPathUnlocked,
} from "@/lib/lessons/progress";
import { calculateLessonXp } from "@/lib/xp";
import { LessonShell } from "@/components/lessons/LessonShell";
import { TheoryRenderer } from "@/components/lessons/TheoryRenderer";
import {
  ExerciseFillBlank,
  type ExerciseFillBlankStrings,
} from "@/components/lessons/ExerciseFillBlank";
import { LessonNavigator } from "@/components/lessons/LessonNavigator";

export const dynamic = "force-dynamic";

interface PageProps {
  params: { id: string };
}

const MAX_ATTEMPTS = 3;

export function generateMetadata({ params }: PageProps): Metadata {
  return {
    title: `Lesson · ${params.id} — Promptly`,
    robots: { index: false, follow: false },
  };
}

export default async function LessonPage({ params }: PageProps) {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) redirect("/auth");

  const profile = await getUserProfile(supabase, user.id);
  if (!profile || !profile.onboarding_completed_at) redirect("/onboarding");

  const lang: Lang = isLang(profile.language)
    ? profile.language
    : resolveLangFromRequest();

  const lesson = await loadLessonById(params.id, lang);
  if (!lesson) notFound();

  const unlocked = await isPathUnlocked(supabase, user.id, lesson.path_slug);
  if (!unlocked) redirect(`/path/${lesson.path_slug}`);

  const lessonsCopy = getLessonsCopy(lang);
  const available = await loadAvailableLessonsInPath(lesson.path_slug, lang);
  const { prev, next, positionLabel } = getLessonNeighbors(available, lesson);

  const pathDisplay = lessonsCopy.pathDisplay[lesson.path_slug];
  const pathHref = `/path/${lesson.path_slug}`;
  const positionText = lessonsCopy.lessonPage.lessonOf(
    positionLabel.current || lesson.order,
    Math.max(positionLabel.total, lesson.order),
  );

  // Pre-resolve every string crossing into client components. The i18n copy
  // object contains arrow functions that React cannot serialize across the
  // server/client boundary — see Round 2 fix (commit 09d78a2) and the
  // Round 3a regression with digest 293253662.
  const xpFull = calculateLessonXp(
    lesson.base_xp,
    lesson.difficulty_bonus_xp,
    1,
  );
  const xpHalved = calculateLessonXp(
    lesson.base_xp,
    lesson.difficulty_bonus_xp,
    MAX_ATTEMPTS,
  );

  const exerciseStrings: ExerciseFillBlankStrings = {
    promptLabel: lessonsCopy.lessonPage.promptLabel,
    checkAnswer: lessonsCopy.lessonPage.checkAnswer,
    showHint: lessonsCopy.lessonPage.showHint,
    hintLabel: lessonsCopy.lessonPage.hintLabel,
    revealLabel: lessonsCopy.lessonPage.revealLabel,
    revealedNotice: lessonsCopy.lessonPage.revealedNotice,
    blankPlaceholder: lessonsCopy.lessonPage.blankPlaceholder,
    wrongInline: lessonsCopy.lessonPage.wrongInline,
    attemptLabels: Array.from({ length: MAX_ATTEMPTS }, (_, i) =>
      lessonsCopy.lessonPage.attemptOf(i + 1, MAX_ATTEMPTS),
    ),
    blankAriaLabels: lesson.exercise.blanks.map((_, i) =>
      lessonsCopy.lessonPage.blankAriaLabel(i + 1),
    ),
    xpLabelFull: lessonsCopy.outro.xpEarned(xpFull),
    xpLabelHalved: lessonsCopy.outro.xpEarned(xpHalved),
    toastLabelFull: lessonsCopy.toast.xpLabel(xpFull),
    toastLabelHalved: lessonsCopy.toast.xpLabel(xpHalved),
  };

  const outroStrings = {
    title: lessonsCopy.outro.title,
    nextLessonCta: lessonsCopy.outro.nextLessonCta,
    backToPathCta: lessonsCopy.outro.backToPathCta,
  };

  return (
    <LessonShell
      lesson={lesson}
      pathTitle={pathDisplay.title}
      pathHref={pathHref}
      copy={lessonsCopy}
      positionLabel={positionText}
    >
      <section className="flex flex-col gap-4">
        <h2 className="font-heading text-xs font-semibold uppercase tracking-wider text-text-muted">
          {lessonsCopy.lessonPage.theoryHeading}
        </h2>
        <TheoryRenderer blocks={lesson.theory} />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-heading text-xs font-semibold uppercase tracking-wider text-text-muted">
          {lessonsCopy.lessonPage.exerciseHeading}
        </h2>
        <ExerciseFillBlank
          lesson={lesson}
          exercise={lesson.exercise}
          strings={exerciseStrings}
          outroStrings={outroStrings}
          nextLesson={next}
          pathHref={pathHref}
        />
      </section>

      <LessonNavigator
        prev={prev}
        next={next}
        pathHref={pathHref}
        pathLabel={lessonsCopy.lessonPage.backToPathCta}
        positionLabel={positionText}
      />
    </LessonShell>
  );
}
