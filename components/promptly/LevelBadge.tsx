import { getLevelInfo } from "@/lib/levels";
import { getLevelsCopy } from "@/lib/i18n/levels";
import type { Lang } from "@/types";

import { RobotAvatar } from "./RobotAvatar";

interface Props {
  level: number;
  language: Lang;
  /**
   * Compact rendering for surfaces where the LevelBadge is a stat
   * indicator (e.g. MapTopBar on the dashboard) and should not compete
   * visually with Spark, who is the brand voice. Smaller robot, lighter
   * type, muted secondary line.
   */
  compact?: boolean;
}

export function LevelBadge({ level, language, compact = false }: Props) {
  const info = getLevelInfo(level);
  const copy = getLevelsCopy(language);
  const title = language === "it" ? info.title_it : info.title_en;

  return (
    <div className={compact ? "flex items-center gap-2" : "flex items-center gap-3"}>
      <RobotAvatar level={info.level} size={compact ? "xs" : "sm"} />
      <div className="flex min-w-0 flex-col">
        <span
          className={
            compact
              ? "font-heading text-xs font-semibold leading-tight text-text-primary"
              : "font-heading text-sm font-bold leading-tight text-text-primary"
          }
        >
          {info.robot_name}
        </span>
        <span
          className={
            compact ? "text-[11px] text-text-muted" : "text-xs text-text-secondary"
          }
        >
          {title}
        </span>
        <span className="sr-only">{copy.badge.levelLabel(info.level)}</span>
      </div>
    </div>
  );
}
