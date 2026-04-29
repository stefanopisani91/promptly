import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import type { LessonContent } from "@/types";
import type { LessonsCopy } from "@/lib/i18n/lessons";

interface Props {
  lesson: LessonContent;
  pathTitle: string;
  pathHref: string;
  copy: LessonsCopy;
  positionLabel: string;
  children: ReactNode;
}

export function LessonShell({
  lesson,
  pathTitle,
  pathHref,
  copy,
  positionLabel,
  children,
}: Props) {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 sm:py-12">
      <header className="flex flex-col gap-4">
        <Link
          href={pathHref}
          className="inline-flex w-fit items-center gap-1.5 text-xs font-medium text-text-secondary underline-offset-4 hover:text-primary-deep hover:underline"
        >
          {copy.lessonPage.breadcrumb(pathTitle)}
        </Link>
        <div className="flex items-start gap-4">
          <div className="shrink-0 rounded-2xl border border-border bg-surface p-3">
            <Image
              src={lesson.icon}
              alt=""
              width={64}
              height={64}
              className="h-12 w-12 sm:h-16 sm:w-16"
              aria-hidden
            />
          </div>
          <div className="flex flex-1 flex-col gap-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-primary-deep">
              {positionLabel}
            </p>
            <h1 className="font-heading text-2xl font-bold leading-tight text-text-primary sm:text-3xl">
              {lesson.title}
            </h1>
            <p className="text-sm text-text-muted">
              {copy.pathOverview.estimatedMinutes(lesson.estimated_minutes)}
            </p>
          </div>
        </div>
      </header>
      {children}
    </main>
  );
}
