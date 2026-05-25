// Hero card pinned below the greeting on the dashboard. Surfaces the
// user's active lesson with a one-click "Resume" CTA.
//
// May 2026 visual refresh:
//   - Warm gradient always visible (stronger on hover)
//   - Progress bar h-3 with shimmer sweep animation
//   - Decorative Zap watermark in top-right corner
//   - ArrowRight translates slightly on hover
//
// Fresh-lesson variant (May 2026 — Path 2 lesson preview):
//   When `freshLesson` is true, the card uses the "NUOVO" eyebrow,
//   shows a short "Sono uscite nuove lezioni." subtitle, and swaps
//   the CTA from "Riprendi" to "Continua". Triggered by
//   mapData.current.isFreshNewLesson — set when the active lesson is
//   an exempt one on an otherwise-coming-soon path.

import Link from "next/link";
import { ArrowRight, Sparkles, Zap } from "lucide-react";

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
  /**
   * True when this is a freshly-released lesson on a path the user is
   * encountering for the first time (e.g. prompt-01 on Path 2 while
   * the rest of Path 2 is still hidden). Drives the "NUOVO" eyebrow,
   * the subtitle, and the "Continua" CTA.
   */
  freshLesson?: boolean;
}

export function ContinueCard({
  copy,
  pathTitle,
  lessonNumber,
  lessonTitle,
  href,
  pathProgress,
  estimatedMinutes,
  freshLesson = false,
}: Props) {
  const pct = Math.max(0, Math.min(1, pathProgress));
  const eyebrow = freshLesson ? copy.freshEyebrow : copy.eyebrow;
  const ctaLabel = freshLesson ? copy.freshCta : copy.resumeCta;
  return (
    <Link
      href={href}
      className="group relative block overflow-hidden rounded-2xl border border-border bg-surface p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md active:scale-[0.99] active:transition-transform sm:p-6"
    >
      {/* Warm gradient — always visible, deeper on hover */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary-light via-transparent to-transparent opacity-70 transition-opacity duration-300 group-hover:opacity-100"
      />

      {/* Decorative watermark icon — Sparkles for fresh, Zap otherwise */}
      {freshLesson ? (
        <Sparkles
          aria-hidden
          className="pointer-events-none absolute -right-4 -top-4 h-28 w-28 rotate-12 text-primary opacity-[0.10] transition-opacity duration-300 group-hover:opacity-[0.14]"
        />
      ) : (
        <Zap
          aria-hidden
          className="pointer-events-none absolute -right-4 -top-4 h-28 w-28 rotate-12 text-primary opacity-[0.07] transition-opacity duration-300 group-hover:opacity-[0.11]"
        />
      )}

      <div className="relative z-10">
        <p className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-primary-deep">
          {freshLesson && (
            <Sparkles aria-hidden className="h-3 w-3 text-primary" />
          )}
          {eyebrow}
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

        {freshLesson && (
          <p className="mt-2 text-sm italic leading-snug text-text-secondary">
            {copy.freshSubtitle}
          </p>
        )}

        {/* Progress bar — thicker, with shimmer sweep. Skipped on
            fresh-lesson variant: 0% progress with a shimmer reads
            confusing ("are you working? are you done? what?"). */}
        {!freshLesson && (
          <div className="relative mt-4 h-3 overflow-hidden rounded-full bg-surface-muted">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-700 ease-out"
              style={{ width: `${pct * 100}%` }}
            />
            {pct > 0.04 && (
              <span
                aria-hidden
                className="animate-shimmer-slide pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/40 to-transparent"
              />
            )}
          </div>
        )}

        <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all group-hover:bg-primary-hover group-hover:shadow-md group-active:scale-[0.97]">
          {ctaLabel}
          <ArrowRight
            className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
            aria-hidden
          />
        </div>
      </div>
    </Link>
  );
}
