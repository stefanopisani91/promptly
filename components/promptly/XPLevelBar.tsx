import { getLevelFromXP, getLevelInfo, isMaxLevel, MAX_LEVEL } from "@/lib/levels";
import { getLevelsCopy } from "@/lib/i18n/levels";
import type { Lang } from "@/types";

interface Props {
  currentXP: number;
  language: Lang;
}

export function XPLevelBar({ currentXP, language }: Props) {
  const safeXP = Math.max(0, Math.floor(currentXP));
  const level = getLevelFromXP(safeXP);
  const info = getLevelInfo(level);
  const copy = getLevelsCopy(language).xpBar;

  if (isMaxLevel(level)) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-4">
        <p className="font-heading text-sm font-bold text-text-primary">
          {copy.maxLabel}
        </p>
      </div>
    );
  }

  // info.xp_max is non-null whenever level < MAX_LEVEL (guaranteed by the
  // table in lib/levels.ts) — TypeScript can't infer it through the helper,
  // so we fall back to a sensible target rather than asserting.
  const nextLevelInfo = getLevelInfo(Math.min(MAX_LEVEL, level + 1));
  const target = info.xp_max ?? nextLevelInfo.xp_min;
  const earnedInLevel = safeXP - info.xp_min;
  const span = Math.max(1, target - info.xp_min);
  const percent = Math.min(100, Math.max(0, (earnedInLevel / span) * 100));

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3 text-xs">
        <span className="font-medium text-text-secondary">
          {copy.progress(safeXP, target)}
        </span>
        <span className="font-heading font-bold text-text-primary">
          {copy.nextLabel(nextLevelInfo.robot_name)}
        </span>
      </div>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(percent)}
        className="h-2 w-full overflow-hidden rounded-full bg-surface-muted"
      >
        <div
          className="h-full rounded-full bg-xp-gold transition-[width] duration-500 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
