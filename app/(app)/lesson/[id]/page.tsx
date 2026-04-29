import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { isLang, type Lang } from "@/types";
import { resolveLangFromRequest } from "@/lib/i18n/server-lang";
import { getAuthCopy } from "@/lib/i18n/auth";
import { getLessonsCopy } from "@/lib/i18n/lessons";
import { createClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/lib/supabase/queries";
import { loadAvailableLessonsInPath, loadLessonById } from "@/lib/lessons/load";
import {
  getLessonNeighbors,
  isPathUnlocked,
} from "@/lib/lessons/progress";
import { LessonShell } from "@/components/lessons/LessonShell";
import { TheoryRenderer } from "@/components/lessons/TheoryRenderer";
import { ExerciseFillBlank } from "@/components/lessons/ExerciseFillBlank";
import { LessonNavigator } from "@/components/lessons/LessonNavigator";

export const dynamic = "force-dynamic";

interface PageProps {
  params: { id: string };
}

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
  const authCopy = getAuthCopy(lang);
  void authCopy; // header copy is rendered by the (app) layout

  const available = await loadAvailableLessonsInPath(lesson.path_slug, lang);
  const { prev, next, positionLabel } = getLessonNeighbors(available, lesson);

  const pathDisplay = lessonsCopy.pathDisplay[lesson.path_slug];
  const pathHref = `/path/${lesson.path_slug}`;
  const positionText = lessonsCopy.lessonPage.lessonOf(
    positionLabel.current || lesson.order,
    Math.max(positionLabel.total, lesson.order),
  );

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
          copy={lessonsCopy}
          pathTitle={pathDisplay.title}
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
