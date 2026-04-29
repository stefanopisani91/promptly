import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface Props {
  prev: { id: string; title: string } | null;
  next: { id: string; title: string } | null;
  pathHref: string;
  pathLabel: string;
  positionLabel: string;
}

export function LessonNavigator({
  prev,
  next,
  pathHref,
  pathLabel,
  positionLabel,
}: Props) {
  return (
    <nav
      aria-label="Lesson navigation"
      className="mt-8 flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between"
    >
      <Link
        href={pathHref}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-text-secondary underline-offset-4 hover:text-primary-deep hover:underline"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        {pathLabel}
      </Link>
      <p className="text-xs text-text-muted">{positionLabel}</p>
      <div className="flex items-center gap-3">
        {prev && (
          <Link
            href={`/lesson/${prev.id}`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-text-secondary underline-offset-4 hover:text-primary-deep hover:underline"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            {prev.title}
          </Link>
        )}
        {next && (
          <Link
            href={`/lesson/${next.id}`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-text-secondary underline-offset-4 hover:text-primary-deep hover:underline"
          >
            {next.title}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        )}
      </div>
    </nav>
  );
}
