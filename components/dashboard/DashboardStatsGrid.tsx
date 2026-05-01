import Link from "next/link";
import type { AuthCopy } from "@/lib/i18n/auth";
import { StreakHeatmap } from "./StreakHeatmap";
import { StreakFlame } from "./StreakFlame";
import { XpBook } from "./XpBook";
import type { RecentLessonItem } from "./RecentLessonsList";
import { ArrowRight, Users } from "lucide-react";

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
    <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <div className="relative overflow-hidden rounded-2xl border border-[#d1d5db] bg-surface p-5 shadow-sm">
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

      <div className="relative overflow-hidden rounded-2xl border border-[#d1d5db] bg-surface p-5 shadow-sm">
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

      {/* Community CTA card — third in the stats grid */}
      <Link
        href="/community"
        aria-label="Entra nella community di Promptly"
        className="group relative overflow-hidden rounded-2xl border border-[#d1d5db] bg-surface p-5 shadow-sm outline-none transition-all duration-200 hover:border-primary/40 hover:shadow-md focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        {/* Subtle warm gradient that bleeds in on hover */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-primary-light via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        />

        <div className="relative z-10 flex h-full flex-col">
          {/* Header row: label + live badge */}
          <div className="flex items-center justify-between">
            <dt className="text-xs font-medium uppercase tracking-wide text-text-muted">
              Community
            </dt>
            <span className="flex items-center gap-1 rounded-full bg-success-light px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-success">
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 animate-pulse rounded-full bg-success"
              />
              Live
            </span>
          </div>

          {/* Headline */}
          <dd className="mt-2 font-heading text-2xl font-bold leading-tight text-text-primary">
            Unisciti ai<br />builder
          </dd>

          {/* Social proof row */}
          <div className="mt-3 flex items-center gap-2">
            {/* Avatar stack — five colour-coded initials circles */}
            <div className="flex -space-x-2">
              {[
                { initials: "MR", bg: "bg-[#e5a883]", text: "text-[#7a3e1c]" },
                { initials: "FS", bg: "bg-[#a6c4a2]", text: "text-[#2d5a2a]" },
                { initials: "GL", bg: "bg-[#b8c4e8]", text: "text-[#2a3d7a]" },
                { initials: "AV", bg: "bg-[#f0c27f]", text: "text-[#7a4f1c]" },
                { initials: "TP", bg: "bg-[#c4a8e8]", text: "text-[#4a2a7a]" },
              ].map(({ initials, bg, text }) => (
                <span
                  key={initials}
                  aria-hidden="true"
                  className={`flex h-6 w-6 items-center justify-center rounded-full border-2 border-surface text-[9px] font-bold ${bg} ${text}`}
                >
                  {initials}
                </span>
              ))}
            </div>
            <p className="text-xs text-text-muted">
              <span className="font-semibold text-text-primary">1.2k</span> builder attivi
            </p>
          </div>

          {/* Spacer to push CTA to bottom */}
          <div className="flex-1" />

          {/* CTA row */}
          <div className="mt-4 flex items-center gap-1 text-sm font-semibold text-primary">
            <Users aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
            <span>Entra nella community</span>
            <ArrowRight
              aria-hidden="true"
              className="ml-0.5 h-3.5 w-3.5 shrink-0 transition-transform duration-200 group-hover:translate-x-1"
            />
          </div>
        </div>
      </Link>
    </dl>
  );
}
