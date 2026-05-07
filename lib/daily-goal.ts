// Daily-goal → minutes mapping. Single source of truth for the four
// buckets the user picks at onboarding step 8 (and edits later in
// /settings/profile). Used by the dashboard ring and by any future
// reminder/email surface that needs the target as a number.
//
// Backwards compatibility: users profiled before Round 9 only had three
// buckets (trivial / easy / pro). Their stored values map onto the new
// minute targets without a data migration — see the migration
// 20260508130000_daily_goal_add_mini.sql for the rationale.

import type { DailyGoal } from "@/types";
import { isDailyGoal } from "@/types";

export const DAILY_GOAL_MINUTES: Record<DailyGoal, number> = {
  mini: 5,
  trivial: 10,
  easy: 15,
  pro: 30,
};

// Fallback used when daily_goal is null/corrupt. Matches the previous
// hard-coded dashboard default so legacy callers keep their behaviour.
export const DAILY_GOAL_FALLBACK_MINUTES = 10;

export function dailyGoalToMinutes(value: unknown): number {
  if (value == null) {
    if (typeof console !== "undefined") {
      console.warn(
        "[daily-goal] missing daily_goal — falling back to",
        DAILY_GOAL_FALLBACK_MINUTES,
        "min",
      );
    }
    return DAILY_GOAL_FALLBACK_MINUTES;
  }
  if (!isDailyGoal(value)) {
    if (typeof console !== "undefined") {
      console.warn(
        "[daily-goal] unrecognised daily_goal value",
        value,
        "— falling back to",
        DAILY_GOAL_FALLBACK_MINUTES,
        "min",
      );
    }
    return DAILY_GOAL_FALLBACK_MINUTES;
  }
  return DAILY_GOAL_MINUTES[value];
}
