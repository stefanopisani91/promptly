import { getLevelInfo } from "@/lib/levels";
import { getLevelsCopy } from "@/lib/i18n/levels";
import type { Lang } from "@/types";

import { RobotAvatar } from "./RobotAvatar";

interface Props {
  level: number;
  language: Lang;
}

export function LevelBadge({ level, language }: Props) {
  const info = getLevelInfo(level);
  const copy = getLevelsCopy(language);
  const title = language === "it" ? info.title_it : info.title_en;

  return (
    <div className="flex items-center gap-3">
      <RobotAvatar level={info.level} size="sm" />
      <div className="flex min-w-0 flex-col">
        <span className="font-heading text-sm font-bold leading-tight text-text-primary">
          {info.robot_name}
        </span>
        <span className="text-xs text-text-secondary">{title}</span>
        <span className="sr-only">{copy.badge.levelLabel(info.level)}</span>
      </div>
    </div>
  );
}
