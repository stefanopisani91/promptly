// Robot avatar — static SVG files in /public/brand/robots, one per level.
// Each level has a hand-designed SVG (currently a generated placeholder, to
// be replaced with bespoke art per level). Files live at
// /public/brand/robots/robot-{level}.svg and are served as static assets.

import { getLevelInfo, MAX_LEVEL, MIN_LEVEL } from "@/lib/levels";

function clampLevel(level: number): number {
  return Math.min(MAX_LEVEL, Math.max(MIN_LEVEL, Math.floor(level)));
}

export function getRobotPath(level: number): string {
  return `/brand/robots/robot-${clampLevel(level)}.svg`;
}

export function getRobotForLevel(level: number) {
  const info = getLevelInfo(level);
  return {
    info,
    path: getRobotPath(info.level),
  };
}
