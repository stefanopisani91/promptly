// Two-card stats grid (Streak + XP) pinned below the Spark companion on
// the dashboard. Originally a 3-slot grid that included the Spark
// companion as the third tile — that was demoted in the May 2026 design
// pass: Spark is a "live" card with its own CTA and voice, not a passive
// stat, so she now sits above this grid as a standalone block. The
// remaining two tiles squeeze together on mobile (2 cols) instead of
// stacking, keeping the dashboard's first fold compact.
//
// All borders use `border-border` from the design system — earlier
// iterations leaked an arbitrary `#d1d5db` value that didn't match
// `--border` (#E4E2DC). Aligned in May 2026 design pass.

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
}

export function DashboardStatsGrid({
  copy,
  totalXp,
  currentStreak,
  activeDates,
}: Props) {
  return (
    <dl className="grid grid-cols-2 gap-3">
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
    </dl>
  );
}
