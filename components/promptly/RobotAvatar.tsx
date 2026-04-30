import { getRobotSvg } from "@/lib/avatar";
import { getLevelInfo } from "@/lib/levels";

export type RobotAvatarSize = "sm" | "md" | "lg";

interface Props {
  level: number;
  size?: RobotAvatarSize;
  // Optional override label for screen readers; defaults to robot name.
  ariaLabel?: string;
  className?: string;
}

const SIZE_CLASS: Record<RobotAvatarSize, string> = {
  sm: "h-10 w-10", // 40px
  md: "h-20 w-20", // 80px
  lg: "h-[120px] w-[120px]",
};

const PIXELS: Record<RobotAvatarSize, number> = {
  sm: 40,
  md: 80,
  lg: 120,
};

export function RobotAvatar({ level, size = "md", ariaLabel, className }: Props) {
  const info = getLevelInfo(level);
  const svg = getRobotSvg(info.level);
  const px = PIXELS[size];

  return (
    <div
      role="img"
      aria-label={ariaLabel ?? info.robot_name}
      className={[
        "relative flex shrink-0 items-center justify-center rounded-2xl bg-primary-light",
        SIZE_CLASS[size],
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ width: px, height: px }}
      // DiceBear emits a static SVG document with no scripts; safe to inline.
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
