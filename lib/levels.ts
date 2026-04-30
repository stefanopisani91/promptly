// XP → level lookup. The single source of truth for level thresholds and
// robot/title metadata. Mirror any changes here in:
//   - supabase/migrations/20260430120000_dashboard_v2_phase1.sql (backfill CASE)
//   - lib/avatar.ts (LEVEL_SEEDS — must cover the same level range)
//
// Levels are computed from total_xp on every read (no DB cache) — see
// UserProfile in types/index.ts for the rationale.

import type { LevelInfo } from "@/types";

// Order matters: descending by xp_min so getLevelFromXP can return on first
// match. Matches the table in DASHBOARD_V2.md §2.
const LEVELS: readonly LevelInfo[] = [
  {
    level: 7,
    xp_min: 10000,
    xp_max: null,
    robot_name: "OMEGA",
    title_en: "Vibe Architect",
    title_it: "Architetto Vibe",
  },
  {
    level: 6,
    xp_min: 6000,
    xp_max: 10000,
    robot_name: "APEX",
    title_en: "Master Builder",
    title_it: "Maestro Builder",
  },
  {
    level: 5,
    xp_min: 4000,
    xp_max: 6000,
    robot_name: "VERTEX",
    title_en: "AI Builder",
    title_it: "Costruttore AI",
  },
  {
    level: 4,
    xp_min: 2500,
    xp_max: 4000,
    robot_name: "NEXUS",
    title_en: "Prompt Engineer",
    title_it: "Ingegnere Prompt",
  },
  {
    level: 3,
    xp_min: 1200,
    xp_max: 2500,
    robot_name: "CIRCUIT",
    title_en: "Vibe Coder",
    title_it: "Vibe Coder",
  },
  {
    level: 2,
    xp_min: 500,
    xp_max: 1200,
    robot_name: "BYTE",
    title_en: "Prompt Explorer",
    title_it: "Esploratore AI",
  },
  {
    level: 1,
    xp_min: 0,
    xp_max: 500,
    robot_name: "INIT",
    title_en: "Prompt Rookie",
    title_it: "Apprendista Prompt",
  },
] as const;

export const MAX_LEVEL = 7;
export const MIN_LEVEL = 1;

export function getLevelFromXP(xp: number): number {
  const safe = Math.max(0, Math.floor(xp));
  for (const entry of LEVELS) {
    if (safe >= entry.xp_min) return entry.level;
  }
  return MIN_LEVEL;
}

export function getLevelInfo(level: number): LevelInfo {
  const clamped = Math.min(MAX_LEVEL, Math.max(MIN_LEVEL, Math.floor(level)));
  const entry = LEVELS.find((l) => l.level === clamped);
  // Unreachable: clamping guarantees a hit. The fallback keeps the return
  // type non-nullable for callers without an extra null-check.
  return entry ?? LEVELS[LEVELS.length - 1];
}

export function isMaxLevel(level: number): boolean {
  return level >= MAX_LEVEL;
}
