// Robot avatar pinned to the user's current node. Idle bob via CSS only —
// the keyframes live in app/globals.css (`.map-robot-bob`), respecting
// prefers-reduced-motion.
//
// Server component: nothing here needs interactivity. The animation runs
// purely in CSS so it ships zero client JS.

import { RobotAvatar } from "@/components/promptly/RobotAvatar";

interface Props {
  level: number;
  bottomPx: number;
  leftPercent: number;
  /** Optional label rendered as a small flag above the avatar. */
  flag?: string | null;
}

export function MapRobotCursor({ level, bottomPx, leftPercent, flag }: Props) {
  return (
    <div
      className="pointer-events-none absolute z-20"
      style={{
        bottom: bottomPx,
        left: `${leftPercent}%`,
        transform: "translate(-50%, calc(-50% - 28px))",
      }}
    >
      {flag && (
        <div className="mb-1 rounded-full bg-primary px-2 py-0.5 text-center font-heading text-[10px] font-bold uppercase tracking-wider text-white shadow">
          {flag}
        </div>
      )}
      <div className="map-robot-bob">
        <RobotAvatar level={level} size="sm" />
      </div>
    </div>
  );
}
