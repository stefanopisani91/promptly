// Bar that surfaces the user's level + XP-to-next-level progress at the
// top of the LearningMap section (choice 9C — DASHBOARD_V2 §1).
//
// Visual: a thin card with the robot (compact size — Spark is the voice,
// the robot is the rank stat), robot name, level title, and the
// XP-to-next-level bar. Background is opaque so map content doesn't
// bleed through.
//
// The component is intentionally NOT sticky on its own anymore (May 2026
// design pass). Earlier it was `sticky top-0` and stayed pinned across
// the entire dashboard scroll — that didn't make sense, since the bar
// belongs to the map section, not to the greeting/Spark/stats stack
// above it. Sticky behaviour is now opt-in via the `sticky` prop and
// the dashboard chooses NOT to enable it. The lesson page never used
// MapTopBar, so nothing else regresses.

import type { ReactNode } from "react";
import type { Lang } from "@/types";
import { LevelBadge } from "@/components/promptly/LevelBadge";
import { XPLevelBar } from "@/components/promptly/XPLevelBar";

interface Props {
  level: number;
  totalXp: number;
  language: Lang;
  // Optional slot rendered to the right of the XP bar — used by the
  // dashboard to surface the referral invite trigger without coupling
  // MapTopBar to the referral feature.
  rightSlot?: ReactNode;
  /**
   * When true, the bar pins to the top of its scroll ancestor. Default
   * is false. Only enable on surfaces where the bar should follow the
   * user as they scroll the map (a hypothetical fullscreen map view).
   * The dashboard keeps it false so the bar scrolls away with the rest
   * of the content — the greeting and Spark companion deserve the top
   * of the viewport, not a level meter.
   */
  sticky?: boolean;
}

export function MapTopBar({
  level,
  totalXp,
  language,
  rightSlot,
  sticky = false,
}: Props) {
  return (
    <div
      className={
        sticky
          ? "sticky top-0 z-30 -mx-4 bg-background/95 px-4 py-2 backdrop-blur-md sm:-mx-6 sm:px-6"
          : "py-1"
      }
      style={
        sticky
          ? { paddingTop: "calc(env(safe-area-inset-top) + 0.5rem)" }
          : undefined
      }
    >
      <div className="mx-auto flex w-full max-w-3xl items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-2.5 shadow-sm sm:gap-4">
        <div className="flex-shrink-0">
          <LevelBadge level={level} language={language} compact />
        </div>
        <div className="min-w-0 flex-1">
          <XPLevelBar currentXP={totalXp} language={language} />
        </div>
        {rightSlot}
      </div>
    </div>
  );
}
