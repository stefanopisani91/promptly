// Two-card stats grid (Streak + XP) pinned below the Spark companion on
// the dashboard.
//
// May 2026 visual refresh:
//   - "use client" to enable count-up animations on mount
//   - Streak: count-up number, flame intensity tied to streak, glow on ≥3
//   - XP: count-up number, level name + robot, animated XP-to-next-level bar
//   - Props simplified: copy → explicit streakLabel / xpLabel strings
//     (avoids passing AuthCopy with functions across the server→client boundary)

"use client";

import { useEffect, useState } from "react";
import { getLevelFromXP, getLevelInfo, isMaxLevel } from "@/lib/levels";
import { StreakHeatmap } from "./StreakHeatmap";
import { StreakFlame } from "./StreakFlame";
import { XpBook } from "./XpBook";
import type { RecentLessonItem } from "./RecentLessonsList";

interface Props {
  streakLabel: string;
  xpLabel: string;
  totalXp: number;
  currentStreak: number;
  lessonsCompleted: number;
  /** ISO dates (YYYY-MM-DD) where the user completed at least one lesson. */
  activeDates: string[];
  /** Up to 3 most recently completed lessons, newest first. */
  recentLessons: RecentLessonItem[];
}

function useCountUp(target: number, duration = 900, delay = 80) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (target === 0) {
      setValue(0);
      return;
    }
    const startTimer = setTimeout(() => {
      const t0 = performance.now();
      const tick = (now: number) => {
        const elapsed = now - t0;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
        setValue(Math.round(target * eased));
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, delay);
    return () => clearTimeout(startTimer);
  }, [target, duration, delay]);
  return value;
}

export function DashboardStatsGrid({
  streakLabel,
  xpLabel,
  totalXp,
  currentStreak,
  activeDates,
}: Props) {
  const displayStreak = useCountUp(currentStreak, 700, 80);
  const displayXP = useCountUp(totalXp, 1100, 160);

  // Level derived from XP
  const level = getLevelFromXP(totalXp);
  const levelInfo = getLevelInfo(level);
  const maxLevel = isMaxLevel(level);
  const nextLevelInfo = maxLevel ? null : getLevelInfo(Math.min(7, level + 1));
  const xpInLevel = totalXp - levelInfo.xp_min;
  const xpSpan = maxLevel
    ? 1
    : Math.max(1, (levelInfo.xp_max ?? totalXp + 1) - levelInfo.xp_min);
  const xpPercent = maxLevel
    ? 100
    : Math.min(100, Math.max(0, (xpInLevel / xpSpan) * 100));

  // Animate XP bar fill after mount
  const [barWidth, setBarWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setBarWidth(xpPercent), 350);
    return () => clearTimeout(t);
  }, [xpPercent]);

  const highStreak = currentStreak >= 3;

  return (
    <dl className="grid grid-cols-2 gap-3">
      {/* ── Streak card ── */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-surface p-5 shadow-sm">
        <StreakFlame intensity={currentStreak} />
        <div className="relative z-10">
          <dt className="text-xs font-medium uppercase tracking-wide text-text-muted">
            {streakLabel}
          </dt>
          <div className="mt-2 flex items-center justify-between gap-3">
            <dd
              className={`font-heading text-3xl font-bold transition-all duration-500 ${
                highStreak
                  ? "text-streak-fire drop-shadow-[0_0_10px_rgba(220,38,38,0.35)]"
                  : "text-text-primary"
              }`}
            >
              {displayStreak}
            </dd>
            <StreakHeatmap activeDates={activeDates} />
          </div>
          {highStreak && (
            <p className="mt-1.5 text-[10px] font-bold uppercase tracking-wider text-streak-fire opacity-75">
              {currentStreak} giorni 🔥
            </p>
          )}
        </div>
      </div>

      {/* ── XP card ── */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-surface p-5 shadow-sm">
        <XpBook />
        <div className="relative z-10 flex h-full flex-col">
          <dt className="text-xs font-medium uppercase tracking-wide text-text-muted">
            {xpLabel}
          </dt>
          <dd className="mt-1 font-heading text-3xl font-bold text-text-primary">
            {displayXP.toLocaleString()}
          </dd>

          {/* Level name */}
          <p className="mt-0.5 animate-xp-glow text-[11px] font-bold text-xp-gold">
            Lv.{level} · {levelInfo.robot_name}
          </p>

          {/* XP progress to next level */}
          {!maxLevel && nextLevelInfo && (
            <div className="mt-2.5">
              <div className="mb-1 flex items-center justify-between gap-1">
                <span className="text-[9px] font-semibold uppercase tracking-wide text-text-muted">
                  → {nextLevelInfo.robot_name}
                </span>
                <span className="text-[9px] font-medium text-text-muted">
                  {totalXp}&thinsp;/&thinsp;{levelInfo.xp_max}
                </span>
              </div>
              <div
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(xpPercent)}
                className="h-1.5 w-full overflow-hidden rounded-full bg-surface-muted"
              >
                <div
                  className="h-full rounded-full bg-xp-gold transition-[width] duration-1000 ease-out"
                  style={{ width: `${barWidth}%` }}
                />
              </div>
            </div>
          )}

          {maxLevel && (
            <p className="mt-2 text-[10px] font-bold uppercase tracking-wide text-xp-gold">
              ★ Max Level
            </p>
          )}
        </div>
      </div>
    </dl>
  );
}
