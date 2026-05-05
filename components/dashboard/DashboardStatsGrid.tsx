// Three-card stats grid pinned below the dashboard greeting. Streak and
// XP are static cards; the third slot is owned by the parent so it can
// inject any contextual companion card (today: <SparkCompanionCard>).
//
// All borders use `border-border` from the design system — earlier
// iterations leaked an arbitrary `#d1d5db` value that didn't match
// `--border` (#E4E2DC). Aligned in May 2026 design pass.

import type { ReactNode } from "react";
import type { AuthCopy } from "@/lib/i18n/auth";
import { StreakHeatmap } from "./StreakHeatmap";
import { StreakFlame } from "./StreakFlame";
import { XpBook } from "./XpBook";
import type { RecentLessonItem } from "./RecentLessonsList";

interface Props {
  copy: AuthCopy["dashboard"];
  totalXp: number;
  currentStreak: number;
  lessonsCompleted: number;
  /** ISO dates (YYYY-MM-DD) where the user completed at least one lesson. */
  activeDates: string[];
  /** Up to 3 most recently completed lessons, newest first. */
  recentLessons: RecentLessonItem[];
  /** Third slot — typically Spark companion card. */
  companionSlot: ReactNode;
}

export function DashboardStatsGrid({
  copy,
  totalXp,
  currentStreak,
  activeDates,
  companionSlot,
}: Props) {
  return (
    <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <div className="relative overflow-hidden rounded-2xl border border-border bg-surface p-5 shadow-sm">
        <StreakFlame />
        <div className="relative z-10">
          <dt className="text-xs font-medium uppercase tracking-wide text-text-muted">
            {copy.stats.streak}
          </dt>
          <div className="mt-2 flex items-center justify-between gap-3">
            <dd className="font-heading text-3xl font-bold text-text-primary">
              {currentStreak.toLocaleString()}
            </dd>
            <StreakHeatmap activeDates={activeDates} />
          </div>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-border bg-surface p-5 shadow-sm">
        <XpBook />
        <div className="relative z-10">
          <dt className="text-xs font-medium uppercase tracking-wide text-text-muted">
            {copy.stats.xp}
          </dt>
          <dd className="mt-2 font-heading text-3xl font-bold text-text-primary">
            {totalXp.toLocaleString()}
          </dd>
        </div>
      </div>

      {/* Third slot — provided by the parent. Today: <SparkCompanionCard>. */}
      {companionSlot}
    </dl>
  );
}
