import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { LessonsCopy } from "@/lib/i18n/lessons";

interface Props {
  copy: LessonsCopy["continueCard"];
  lessonHref: string;
  lessonTitle: string;
  isStarted: boolean;
}

export function ContinueCard({ copy, lessonHref, lessonTitle, isStarted }: Props) {
  return (
    <Link
      href={lessonHref}
      className="flex items-center justify-between gap-4 rounded-2xl border border-primary/30 bg-primary/5 p-5 transition-colors hover:border-primary/60 hover:bg-primary/10 sm:p-6"
    >
      <div className="flex flex-col gap-1">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-primary-deep">
          {isStarted ? copy.eyebrow : copy.startEyebrow}
        </p>
        <p className="font-heading text-lg font-semibold text-text-primary">
          {lessonTitle}
        </p>
        <p className="text-sm font-medium text-primary-deep">
          {isStarted ? copy.cta : copy.startCta}
        </p>
      </div>
      <ArrowRight
        className="h-5 w-5 shrink-0 text-primary transition-transform group-hover:translate-x-0.5"
        aria-hidden
      />
    </Link>
  );
}
