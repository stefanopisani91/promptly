import type { AuthCopy } from "@/lib/i18n/auth";
import { StreakHeatmap } from "./StreakHeatmap";
import { RecentLessonsList, type RecentLessonItem } from "./RecentLessonsList";

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
  lessonsCompleted,
  activeDates,
  recentLessons,
}: Props) {
  return (
    <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <div className="rounded-2xl border border-[#d1d5db] bg-surface p-5 shadow-sm">
        <dt className="text-xs font-medium uppercase tracking-wide text-text-muted">
          {copy.stats.xp}
        </dt>
        <dd className="mt-2 font-heading text-3xl font-bold text-text-primary">
          {totalXp.toLocaleString()}
        </dd>
      </div>

      <div className="rounded-2xl border border-[#d1d5db] bg-surface p-5 shadow-sm">
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

      <div className="rounded-2xl border border-[#d1d5db] bg-surface p-5 shadow-sm">
        <dt className="text-xs font-medium uppercase tracking-wide text-text-muted">
          {copy.stats.lessons}
        </dt>
        <dd className="mt-2 font-heading text-3xl font-bold text-text-primary">
          {lessonsCompleted.toLocaleString()}
        </dd>
        <RecentLessonsList items={recentLessons} />
      </div>
    </dl>
  );
}
