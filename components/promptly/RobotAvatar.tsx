import Image from "next/image";

import { getRobotPath } from "@/lib/avatar";
import { getLevelInfo } from "@/lib/levels";

export type RobotAvatarSize = "xs" | "sm" | "md" | "lg";

interface Props {
  level: number;
  size?: RobotAvatarSize;
  ariaLabel?: string;
  className?: string;
}

const SIZE_CLASS: Record<RobotAvatarSize, string> = {
  xs: "h-9 w-9",
  sm: "h-10 w-10",
  md: "h-20 w-20",
  lg: "h-[120px] w-[120px]",
};

const PIXELS: Record<RobotAvatarSize, number> = {
  xs: 36,
  sm: 40,
  md: 80,
  lg: 120,
};

export function RobotAvatar({ level, size = "md", ariaLabel, className }: Props) {
  const info = getLevelInfo(level);
  const px = PIXELS[size];

  return (
    <div
      className={[
        "relative flex shrink-0 items-center justify-center rounded-2xl bg-primary-light",
        SIZE_CLASS[size],
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ width: px, height: px }}
    >
      <Image
        src={getRobotPath(info.level)}
        alt={ariaLabel ?? info.robot_name}
        width={px}
        height={px}
        priority={size === "lg"}
        className="h-full w-full object-contain"
      />
    </div>
  );
}
