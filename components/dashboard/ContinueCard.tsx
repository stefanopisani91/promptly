// Hero card pinned below the greeting on the dashboard. Surfaces the
// user's active lesson with a one-click "Resume" CTA.

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import type { AuthCopy } from "@/lib/i18n/auth";

interface Props {
  copy: AuthCopy["dashboard"]["continueCard"];
  pathTitle: string;
  /** 1-based lesson number within the path. */
  lessonNumber: number;
  lessonTitle: string;
  href: string;
  /** 0..1 — fraction of the path completed. */
  pathProgress: number;
  estimatedMinutes?: number;
}

export function ContinueCard({
  copy,
  pathTitle,
  lessonNumber,
  lessonTitle,
  href,
  pathProgress,
  estimatedMinutes,
}: Props) {
  const pct = Math.max(0, Math.min(1, pathProgress));
  return (
    <Link
      href={href}
      className="group block rounded-2xl border border-[#d1d5db] bg-surface p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md sm:p-6"
    >
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary-deep">
        {copy.eyebrow}
      </p>
      <h2 className="mt-1 font-heading text-lg font-bold leading-tight text-text-primary sm:text-xl">
        {copy.lessonNumberLabel(lessonNumber)} · {lessonTitle}
      </h2>
      <p className="mt-1 text-sm text-text-secondary">
        {pathTitle}
        {estimatedMinutes !== undefined && (
          <>
            {" · "}~{estimatedMinutes} {copy.minutesLabel}
          </>
        )}
      </p>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-surface-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${pct * 100}%` }}
        />
      </div>

      <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors group-hover:bg-primary-hover">
        {copy.resumeCta}
        <ArrowRight className="h-4 w-4" aria-hidden />
      </div>
    </Link>
  );
}
