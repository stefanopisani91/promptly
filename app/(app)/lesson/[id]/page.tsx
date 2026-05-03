import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { isLang, isLessonV2Content, type Lang } from "@/types";
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
import {
  LessonV2View,
  type LessonV2ViewStrings,
} from "@/components/lessons/LessonV2View";
import { LessonNavigator } from "@/components/lessons/LessonNavigator";

export const dynamic = "force-dynamic";

interface PageProps {
  params: { id: string };
}

const MAX_ATTEMPTS = 3;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const lang: Lang = resolveLangFromRequest();
  const lesson = await loadLessonById(params.id, lang);
  const description =
    lesson && "subtitle" in lesson && typeof lesson.subtitle === "string"
      ? lesson.subtitle
      : undefined;
  return {
    title: lesson
      ? `${lesson.title} — Promptly`
      : `Lesson · ${params.id} — Promptly`,
    description,
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

  // ─── V2 branch ──────────────────────────────────────────────────────
  // Open question + AI commentary + archetype quiz. Pre-resolves all i18n
  // strings server-side before passing them into the client component
  // tree (function values cannot cross the server/client boundary — see
  // Round 2 fix commit 09d78a2 + Round 3a regression digest 293253662).
  if (isLessonV2Content(lesson)) {
    const baseLessonXp = lesson.base_xp + lesson.difficulty_bonus_xp;
    // All fields below MUST be plain strings (no functions). Templates with
    // {token} placeholders are substituted in the client. Anything that
    // depends on a value not yet known server-side stays a template.
    const v2Strings: LessonV2ViewStrings = {
      body: {
        openQuestion: {
          submitCta: lessonsCopy.v2.openQuestion.submitCta,
          submitting: lessonsCopy.v2.openQuestion.submitting,
          submittedLabel: lessonsCopy.v2.openQuestion.submittedLabel,
          placeholderFallback: lessonsCopy.v2.openQuestion.placeholderFallback,
          charCounterTemplate: lessonsCopy.v2.openQuestion.charCounterTemplate,
          networkError: lessonsCopy.v2.openQuestion.networkError,
          apiError: lessonsCopy.v2.openQuestion.apiError,
          missingKeyError: lessonsCopy.v2.openQuestion.missingKeyError,
          retryCta: lessonsCopy.v2.openQuestion.retryCta,
          skipCta: lessonsCopy.v2.openQuestion.skipCta,
          skippedNotice: lessonsCopy.v2.openQuestion.skippedNotice,
        },
        archetypeQuiz: {
          questionOfTemplate: lessonsCopy.v2.archetypeQuiz.questionOfTemplate,
          pickOneHint: lessonsCopy.v2.archetypeQuiz.pickOneHint,
          revealCta: lessonsCopy.v2.archetypeQuiz.revealCta,
          revealedTitle: lessonsCopy.v2.archetypeQuiz.revealedTitle,
          bonusXpTemplate: lessonsCopy.v2.archetypeQuiz.bonusXpTemplate,
          retakeCta: lessonsCopy.v2.archetypeQuiz.retakeCta,
        },
      },
      finishCta: lessonsCopy.v2.completion.finishCta,
      alreadyCompleted: lessonsCopy.v2.completion.alreadyCompleted,
      outro: {
        title: lessonsCopy.outro.title,
        xpEarnedLabel: lessonsCopy.outro.xpEarned(baseLessonXp),
        nextLessonCta: lessonsCopy.outro.nextLessonCta,
        backToPathCta: lessonsCopy.outro.backToPathCta,
      },
      toast: {
        full: lessonsCopy.toast.xpLabel(baseLessonXp),
        dismissLabel: lessonsCopy.toast.dismissLabel,
      },
    };

    return (
      <LessonShell
        lesson={lesson}
        pathTitle={pathDisplay.title}
        pathHref={pathHref}
        copy={lessonsCopy}
        positionLabel={positionText}
      >
        <LessonV2View
          lesson={lesson}
          strings={v2Strings}
          nextLesson={next}
          pathHref={pathHref}
          baseLessonXp={baseLessonXp}
        />
        <LessonNavigator
          prev={prev}
          next={next}
          pathHref={pathHref}
          pathLabel={lessonsCopy.lessonPage.backToPathCta}
          positionLabel={positionText}
          navigationLabel={lessonsCopy.navigationLabel}
        />
      </LessonShell>
    );
  }

  // ─── V1 branch (legacy fill_blank) ──────────────────────────────────
  // Pre-resolve every string crossing into client components. The i18n
  // copy object contains arrow functions that React cannot serialize
  // across the server/client boundary.
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
    toastDismissLabel: lessonsCopy.toast.dismissLabel,
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
        navigationLabel={lessonsCopy.navigationLabel}
      />
    </LessonShell>
  );
}
