// Daily goal ring — paired alongside the ContinueCard at the top of the
// dashboard. Shows the user's progress toward the daily-minute goal as a
// circular ring + a label.

import type { AuthCopy } from "@/lib/i18n/auth";

interface Props {
  copy: AuthCopy["dashboard"]["dailyGoal"];
  /** Minutes already completed today. */
  minutesToday: number;
  /** Daily goal target in minutes. */
  goalMinutes: number;
}

const RING_SIZE = 108;
const STROKE_WIDTH = 10;
const RADIUS = (RING_SIZE - STROKE_WIDTH) / 2;
const CIRC = 2 * Math.PI * RADIUS;

export function DailyGoalCard({ copy, minutesToday, goalMinutes }: Props) {
  const safeGoal = Math.max(1, goalMinutes);
  const pct = Math.max(0, Math.min(1, minutesToday / safeGoal));
  const dashOffset = CIRC * (1 - pct);
  const reached = minutesToday >= goalMinutes;
  const minutesLeft = Math.max(0, goalMinutes - minutesToday);

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-6">
      <svg
        width={RING_SIZE}
        height={RING_SIZE}
        viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
        className="shrink-0"
        aria-hidden
      >
        <circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="var(--surface-muted)"
          strokeWidth={STROKE_WIDTH}
        />
        <circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="var(--primary)"
          strokeWidth={STROKE_WIDTH}
          strokeLinecap="round"
          strokeDasharray={CIRC}
          strokeDashoffset={dashOffset}
          transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
        />
        <text
          x={RING_SIZE / 2}
          y={RING_SIZE / 2 + 2}
          textAnchor="middle"
          fontSize="22"
          fontWeight="700"
          fontFamily="var(--font-heading)"
          fill="var(--text-primary)"
        >
          {minutesToday}
        </text>
        <text
          x={RING_SIZE / 2}
          y={RING_SIZE / 2 + 20}
          textAnchor="middle"
          fontSize="9"
          letterSpacing="1.4"
          fontWeight="600"
          fill="var(--text-muted)"
        >
          {copy.minutesDoneOf(minutesToday, goalMinutes).toUpperCase()}
        </text>
      </svg>

      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-text-muted">
          {copy.eyebrow}
        </p>
        <p className="mt-1 font-heading text-lg font-bold leading-tight text-text-primary">
          {reached ? copy.goalReached : copy.minutesToGo(minutesLeft)}
        </p>
      </div>
    </div>
  );
}
