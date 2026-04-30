// Sticky bar that pins the user's level + XP progress to the top of the
// viewport while the map scrolls beneath it (choice 9C — DASHBOARD_V2 §1).
//
// Visual: a thin card with the robot, robot name, level title, and the
// XP-to-next-level bar. Background is opaque so map content doesn't bleed
// through, with a subtle bottom border that appears once scrolled.

import type { Lang } from "@/types";
import { LevelBadge } from "@/components/promptly/LevelBadge";
import { XPLevelBar } from "@/components/promptly/XPLevelBar";

interface Props {
  level: number;
  totalXp: number;
  language: Lang;
}

export function MapTopBar({ level, totalXp, language }: Props) {
  return (
    <div
      // sticky positions relative to the scroll ancestor. `top-0` keeps it
      // pinned; z-30 sits above bonus islands but below modals (z-50).
      className="sticky top-0 z-30 -mx-4 border-b border-transparent bg-background/95 px-4 py-2 backdrop-blur-md transition-colors sm:-mx-6 sm:px-6 [&:not(:where([data-stuck=true]))]:border-transparent"
    >
      <div className="mx-auto flex w-full max-w-3xl items-center gap-4 rounded-2xl border border-border bg-surface px-4 py-2.5 shadow-sm">
        <div className="flex-shrink-0">
          <LevelBadge level={level} language={language} />
        </div>
        <div className="min-w-0 flex-1">
          <XPLevelBar currentXP={totalXp} language={language} />
        </div>
      </div>
    </div>
  );
}
