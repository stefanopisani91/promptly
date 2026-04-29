import Link from "next/link";
import type { LessonsCopy } from "@/lib/i18n/lessons";

interface Props {
  copy: LessonsCopy;
  recap: string;
  nextPrompt: string;
  xpEarned: number;
  nextLesson: { id: string; title: string } | null;
  pathHref: string;
  pathTitle: string;
}

export function LessonOutro({
  copy,
  recap,
  nextPrompt,
  xpEarned,
  nextLesson,
  pathHref,
  pathTitle,
}: Props) {
  void pathTitle;
  return (
    <section
      className="mt-2 rounded-2xl border border-success-light bg-success-light/40 p-6 text-center sm:p-8"
      aria-live="polite"
    >
      <p className="font-heading text-xl font-bold text-success sm:text-2xl">
        {copy.outro.title}
      </p>
      <p className="mt-2 inline-flex items-center gap-2 rounded-full bg-success/15 px-3 py-1 font-mono text-sm font-semibold text-success">
        {copy.outro.xpEarned(xpEarned)}
      </p>
      <p className="mt-4 text-base leading-relaxed text-text-secondary">{recap}</p>
      {nextPrompt && (
        <p className="mt-2 text-sm italic text-text-muted">{nextPrompt}</p>
      )}

      <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
        {nextLesson ? (
          <Link
            href={`/lesson/${nextLesson.id}`}
            className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-base font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-deep"
          >
            {copy.outro.nextLessonCta}
          </Link>
        ) : (
          <Link
            href={pathHref}
            className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-base font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-deep"
          >
            {copy.outro.backToPathCta}
          </Link>
        )}
        {nextLesson && (
          <Link
            href={pathHref}
            className="text-sm font-medium text-text-secondary underline-offset-4 hover:text-primary-deep hover:underline"
          >
            {copy.outro.backToPathCta}
          </Link>
        )}
      </div>
    </section>
  );
}
