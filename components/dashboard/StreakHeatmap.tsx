// GitHub-style mini heatmap: last 5 weeks (35 cells) of activity.
// Server component — date math runs once on the request and ships zero JS.
//
// Layout: `grid-rows-7 grid-flow-col` packs cells column-by-column, so the
// emitted DOM order (oldest → today) lays out as 5 columns × 7 rows with
// today landing in the bottom-right cell.

import { cn } from "@/lib/utils";

const WEEKS = 5;
const DAYS_PER_WEEK = 7;
const TOTAL_DAYS = WEEKS * DAYS_PER_WEEK;

interface Props {
  /** ISO date strings (YYYY-MM-DD) on which the user completed ≥1 lesson. */
  activeDates: string[];
}

export function StreakHeatmap({ activeDates }: Props) {
  const active = new Set(activeDates);
  const today = new Date();

  const cells: { date: string; isActive: boolean }[] = [];
  for (let i = TOTAL_DAYS - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - i);
    const key = d.toISOString().slice(0, 10);
    cells.push({ date: key, isActive: active.has(key) });
  }

  return (
    <div
      role="img"
      aria-label="Activity over the last 5 weeks"
      className="grid grid-flow-col grid-rows-7 gap-[2px]"
    >
      {cells.map((c) => (
        <div
          key={c.date}
          title={c.date}
          className={cn(
            "h-2.5 w-2.5 rounded-[2px]",
            c.isActive
              ? "bg-primary"
              : "border border-border bg-transparent",
          )}
        />
      ))}
    </div>
  );
}
