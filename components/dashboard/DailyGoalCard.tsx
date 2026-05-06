// Daily goal ring — paired alongside the ContinueCard at the top of the
// dashboard. Shows the user's progress toward the daily-minute goal as a
// circular ring + a label.
//
// May 2026 visual refresh:
//   - Ring animates from 0 → real value on mount (via DailyGoalInteractive)
//   - Center number count-up animation
//   - Confetti burst when goal is reached
//   - Background turns success-light green when goal is reached
//
// Architecture: this server component pre-computes all i18n strings and
// passes them as plain serializable values to DailyGoalInteractive (client),
// avoiding the "function props across server/client boundary" issue.

import type { AuthCopy } from "@/lib/i18n/auth";
import { DailyGoalInteractive } from "./DailyGoalInteractive";

interface Props {
  copy: AuthCopy["dashboard"]["dailyGoal"];
  /** Minutes already completed today. */
  minutesToday: number;
  /** Daily goal target in minutes. */
  goalMinutes: number;
}

export function DailyGoalCard({ copy, minutesToday, goalMinutes }: Props) {
  const safeGoal = Math.max(1, goalMinutes);
  const pct = Math.max(0, Math.min(1, minutesToday / safeGoal));
  const reached = minutesToday >= goalMinutes;
  const minutesLeft = Math.max(0, goalMinutes - minutesToday);

  return (
    <DailyGoalInteractive
      pct={pct}
      minutesToday={minutesToday}
      goalMinutes={goalMinutes}
      reached={reached}
      eyebrow={copy.eyebrow}
      statusLabel={reached ? copy.goalReached : copy.minutesToGo(minutesLeft)}
      minutesDoneLabel={copy.minutesDoneOf(minutesToday, goalMinutes).toUpperCase()}
    />
  );
}
