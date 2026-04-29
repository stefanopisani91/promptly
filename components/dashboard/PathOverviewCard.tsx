import Image from "next/image";
import Link from "next/link";
import { Lock } from "lucide-react";
import type { PathProgress, PathSlug } from "@/types";
import type { LessonsCopy } from "@/lib/i18n/lessons";

interface Props {
  progress: PathProgress;
  copy: LessonsCopy;
  iconSrc: string;
  prereqTitle: string | null;
}

const PATH_NUMBER: Record<PathSlug, string> = {
  mindset: "1",
  prompt: "2",
  build: "3",
  debug: "4",
  ship: "5",
};

export function PathOverviewCard({ progress, copy, iconSrc, prereqTitle }: Props) {
  const display = copy.pathDisplay[progress.slug];
  const isStarted = progress.completed_lessons > 0;
  const ctaLabel = isStarted ? copy.pathOverview.continueCta : copy.pathOverview.startCta;
  const ctaHref =
    progress.next_lesson_id != null
      ? `/lesson/${progress.next_lesson_id}`
      : `/path/${progress.slug}`;
  const locked = !progress.is_unlocked;

  return (
    <article
      className={`group relative flex flex-col gap-4 rounded-2xl border bg-surface p-5 sm:p-6 ${
        locked ? "border-border opacity-70" : "border-border hover:border-primary/40"
      } transition-colors`}
    >
      <div className="flex items-start gap-4">
        <div className="shrink-0 rounded-2xl border border-border bg-surface-muted p-2.5">
          <Image
            src={iconSrc}
            alt=""
            width={48}
            height={48}
            className="h-10 w-10 sm:h-12 sm:w-12"
            aria-hidden
          />
        </div>
        <div className="flex flex-1 flex-col gap-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-primary-deep">
            Path {PATH_NUMBER[progress.slug]}
          </p>
          <h3 className="font-heading text-lg font-semibold text-text-primary">
            {display.title}
          </h3>
          <p className="text-sm leading-relaxed text-text-secondary">
            {display.tagline}
          </p>
        </div>
      </div>

      {locked && prereqTitle ? (
        <div className="flex items-center gap-2 rounded-xl border border-border bg-surface-muted px-4 py-3 text-sm text-text-secondary">
          <Lock className="h-4 w-4 shrink-0 text-text-muted" aria-hidden />
          <span>{copy.pathOverview.lockedBanner(prereqTitle)}</span>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-text-muted">
            {copy.pathOverview.progressLabel(
              progress.completed_lessons,
              progress.total_lessons,
            )}
          </p>
          <Link
            href={ctaHref}
            aria-disabled={locked}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-deep"
          >
            {ctaLabel}
          </Link>
        </div>
      )}
    </article>
  );
}
