"use client";

// Lesson V3 header: back arrow on the left (always tappable), lesson
// title + step counter in the middle (truncates), Spark mini on the right
// with the vignette cloud anchored to her. Sticky on top of the viewport
// so the user always knows where they are. Spark sits on the right so her
// floating vignettes never cover the back-arrow — see VignetteCloud for
// the left-stacked positions that match this layout.

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { SparkState, Vignette } from "@/types";
import { Spark } from "./Spark";
import { VignetteCloud } from "./VignetteCloud";
import { AskSparkBubble } from "./AskSparkBubble";

interface Props {
  lessonTitle: string;
  stepIndex: number;
  totalSteps: number;
  pathHref: string;
  sparkState: SparkState;
  vignettes: Vignette[];
  copy: {
    stepCounterTemplate: string; // "{current} / {total}"
    exitLabel: string;
    vignetteCloseLabel: string;
  };
  // Free-chat affordance: opens the SparkChat modal in LessonV3View. The
  // bubble lives next to Spark instead of being a separate floating button
  // (Promptly_Spark_Master_Configuration.md §2).
  askSpark: {
    onOpen: () => void;
    remaining: number;
    limit: number;
    label: string;
    exhaustedLabel: string;
  };
}

export function SparkHeader({
  lessonTitle,
  stepIndex,
  totalSteps,
  pathHref,
  sparkState,
  vignettes,
  copy,
  askSpark,
}: Props) {
  const counter = copy.stepCounterTemplate
    .replace("{current}", String(stepIndex + 1))
    .replace("{total}", String(totalSteps));

  return (
    <header
      className="sticky top-0 z-30 border-b border-border/60 bg-background/95 backdrop-blur"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="mx-auto flex w-full max-w-3xl items-center gap-3 px-4 py-2 sm:px-6 md:py-3">
        <Link
          href={pathHref}
          aria-label={copy.exitLabel}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-text-secondary transition-colors hover:bg-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-deep"
        >
          <ArrowLeft size={16} />
        </Link>

        {/* Desktop: title sits between back-arrow and Spark. Hidden on
            mobile because the screen is too narrow to fit title + Spark
            + orbiting chips in one row — title moves to a second row
            below (see further down). */}
        <div className="hidden min-w-0 flex-1 flex-col md:flex">
          <p className="eyebrow text-primary-deep">{counter}</p>
          <h1 className="truncate font-heading text-sm font-semibold leading-tight text-text-primary sm:text-base">
            {lessonTitle}
          </h1>
        </div>

        {/* Mobile spacer-left: with no title in the row, this flex-1
            stub pushes Spark toward the centre of the header so the
            orbit has equal air on both sides. */}
        <div aria-hidden="true" className="flex-1 md:hidden" />

        <div className="relative flex shrink-0 items-center justify-center">
          {/* Spark sits between the orbit's back layer (z-index 1) and
              its front layer (z-index 3), so chips passing top/bottom of
              the orbit slide visibly behind her. */}
          {/* Spark renders at 56px on mobile (slimmer header band), 60px
              on ≥768px to keep the desktop orbit balanced. The Spark
              component's `size` prop is fixed-px, so we render two and
              toggle visibility — cheaper than a runtime media-query. */}
          <span className="relative z-[2] md:hidden">
            <Spark state={sparkState} size={84} />
          </span>
          <span className="relative z-[2] hidden md:inline-flex">
            <Spark state={sparkState} size={84} />
          </span>
          {vignettes.length > 0 && (
            <VignetteCloud
              vignettes={vignettes}
              closeLabel={copy.vignetteCloseLabel}
            />
          )}
          {/* Always-present chat affordance — anchored to Spark, not to
              the page. Higher z-index than orbit chips so the bubble is
              never occluded by a chip passing in front. */}
          <AskSparkBubble
            onOpen={askSpark.onOpen}
            remaining={askSpark.remaining}
            limit={askSpark.limit}
            label={askSpark.label}
            exhaustedLabel={askSpark.exhaustedLabel}
          />
        </div>

        {/* Mobile spacer-right: mirrors spacer-left to keep Spark
            centred horizontally. */}
        <div aria-hidden="true" className="flex-1 md:hidden" />

        {/* Desktop-only spacer: pulls Spark ~128px inward from the right
            edge so the orbiting vignettes have free air on both sides
            without crashing into the page bezel. */}
        <div aria-hidden="true" className="hidden w-32 shrink-0 md:block" />
      </div>

      {/* Mobile-only second row: lesson title + step counter under the
          orbit, centred. The orbit's vertical excursion is small (±8px
          on mobile) so it never collides with this row. */}
      <div className="flex flex-col items-center px-4 pb-1 md:hidden">
        <p className="eyebrow text-primary-deep">{counter}</p>
        <h1 className="truncate text-center font-heading text-xs font-semibold leading-tight text-text-primary">
          {lessonTitle}
        </h1>
      </div>

      <ProgressBar current={stepIndex + 1} total={totalSteps} />
    </header>
  );
}

function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = Math.min(100, Math.round((current / total) * 100));
  return (
    <div
      role="progressbar"
      aria-valuenow={current}
      aria-valuemin={0}
      aria-valuemax={total}
      className="h-1.5 w-full bg-surface-muted md:h-2"
    >
      <div
        className="relative h-full overflow-hidden bg-primary transition-[width] duration-500 ease-out"
        style={{ width: `${pct}%` }}
      >
        {/* Shimmer sweep that travels left→right inside the filled region */}
        <span
          aria-hidden
          className="animate-shimmer-slide pointer-events-none absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-white/40 to-transparent"
        />
      </div>
    </div>
  );
}
