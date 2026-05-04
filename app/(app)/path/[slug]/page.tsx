import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Check, Lock } from "lucide-react";
import {
  isActivePathSlug,
  isLang,
  isLessonV3Content,
  type Lang,
  type AnyLessonContent,
  type PathSlug,
} from "@/types";
import { resolveLangFromRequest } from "@/lib/i18n/server-lang";
import { getLessonsCopy } from "@/lib/i18n/lessons";
import { createClient } from "@/lib/supabase/server";
import {
  getProgressForPath,
  getUserProfile,
} from "@/lib/supabase/queries";
import { loadAvailableLessonsInPath } from "@/lib/lessons/load";
import { getShortTitle } from "@/lib/lessons/display";
import { getPathProgress } from "@/lib/lessons/progress";
import { PATH_META } from "@/lib/lessons/paths";
import { PathProgressBar } from "@/components/lessons/PathProgressBar";

export const dynamic = "force-dynamic";

interface PageProps {
  params: { slug: string };
}

export function generateMetadata({ params }: PageProps): Metadata {
  return {
    title: `Path · ${params.slug} — Promptly`,
    robots: { index: false, follow: false },
  };
}

function buildPlannedSlots(
  pathSlug: PathSlug,
  available: AnyLessonContent[],
): Array<{ id: string; lesson: AnyLessonContent | null; order: number }> {
  const total = PATH_META[pathSlug].totalLessons;
  // V3 rollout: surface only V3 lessons on the path overview. Anything in
  // an older format renders as "Coming soon" (lesson=null) — the legacy
  // page renderers still exist for safety but nothing links there.
  const byOrder = new Map(
    available
      .filter((l) => isLessonV3Content(l))
      .map((l) => [l.order, l]),
  );
  return Array.from({ length: total }, (_, idx) => {
    const order = idx + 1;
    const id = `${pathSlug}-${String(order).padStart(2, "0")}`;
    return { id, lesson: byOrder.get(order) ?? null, order };
  });
}

export default async function PathPage({ params }: PageProps) {
  if (!isActivePathSlug(params.slug)) notFound();
  const pathSlug: PathSlug = params.slug;

  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) redirect("/auth");

  const profile = await getUserProfile(supabase, user.id);
  if (!profile || !profile.onboarding_completed_at) redirect("/onboarding");

  const lang: Lang = isLang(profile.language)
    ? profile.language
    : resolveLangFromRequest();
  const copy = getLessonsCopy(lang);

  const [available, progressRows, pathProgress] = await Promise.all([
    loadAvailableLessonsInPath(pathSlug, lang),
    getProgressForPath(supabase, user.id, pathSlug),
    getPathProgress(supabase, user.id, pathSlug, lang),
  ]);
  const completedIds = new Set(
    progressRows.filter((p) => p.completed).map((p) => p.lesson_id),
  );

  const display = copy.pathDisplay[pathSlug];
  const slots = buildPlannedSlots(pathSlug, available);
  const meta = PATH_META[pathSlug];

  const prereqDisplay = meta.prerequisitePath
    ? copy.pathDisplay[meta.prerequisitePath].title
    : null;

  const showLockedBanner = !pathProgress.is_unlocked && prereqDisplay;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 sm:py-12">
      <header className="flex flex-col gap-3">
        <Link
          href="/dashboard"
          className="inline-flex w-fit items-center text-xs font-medium text-text-secondary underline-offset-4 hover:text-primary-deep hover:underline"
        >
          {copy.pathOverview.backToDashboardCta}
        </Link>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-primary-deep">
            Path · {display.title}
          </p>
          <h1 className="mt-1.5 font-heading text-3xl font-bold leading-tight text-text-primary sm:text-4xl">
            {display.title}
          </h1>
          <p className="mt-2 text-base text-text-secondary sm:text-lg">
            {display.tagline}
          </p>
        </div>
        <PathProgressBar
          completed={pathProgress.completed_lessons}
          total={pathProgress.total_lessons}
          label={copy.pathOverview.progressLabel(
            pathProgress.completed_lessons,
            pathProgress.total_lessons,
          )}
        />
      </header>

      {showLockedBanner && (
        <div
          className="flex items-start gap-3 rounded-2xl border border-warning/40 bg-warning/10 p-4 sm:p-5"
          role="status"
        >
          <Lock className="mt-0.5 h-5 w-5 shrink-0 text-warning" aria-hidden />
          <p className="text-sm text-text-secondary">
            {copy.pathOverview.lockedBanner(prereqDisplay)}
          </p>
        </div>
      )}

      <ol className="flex flex-col gap-3">
        {slots.map(({ id, lesson, order }) => {
          const completed = completedIds.has(id);
          const isPlaceholder = lesson === null;
          const disabled = isPlaceholder || !pathProgress.is_unlocked;

          const inner = (
            <div
              className={`flex items-center gap-4 rounded-2xl border bg-surface p-4 sm:p-5 ${
                disabled ? "border-border opacity-60" : "border-border hover:border-primary/40"
              } transition-colors`}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-muted font-mono text-sm font-bold text-text-secondary sm:h-12 sm:w-12">
                {String(order).padStart(2, "0")}
              </div>
              {lesson && (
                <Image
                  src={lesson.icon}
                  alt=""
                  width={48}
                  height={48}
                  className="hidden h-10 w-10 sm:block sm:h-12 sm:w-12"
                  aria-hidden
                />
              )}
              <div className="flex flex-1 flex-col">
                <p className="font-heading text-base font-semibold text-text-primary">
                  {lesson
                    ? getShortTitle(lesson)
                    : copy.pathOverview.comingSoonLessonLabel}
                </p>
                {lesson && (
                  <p className="text-xs text-text-muted">
                    {copy.pathOverview.estimatedMinutes(lesson.estimated_minutes)}
                  </p>
                )}
              </div>
              {completed && (
                <span className="inline-flex items-center gap-1 rounded-full bg-success-light/60 px-3 py-1 text-xs font-semibold text-success">
                  <Check className="h-3 w-3" strokeWidth={3} aria-hidden />
                  {copy.pathOverview.completedBadge}
                </span>
              )}
            </div>
          );

          if (disabled) {
            return (
              <li key={id} className="cursor-not-allowed">
                {inner}
              </li>
            );
          }

          return (
            <li key={id}>
              <Link href={`/lesson/${id}`} className="block">
                {inner}
              </Link>
            </li>
          );
        })}
      </ol>
    </main>
  );
}
