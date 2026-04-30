// Robot avatar pinned to the user's current node. Idle bob via CSS only —
// the keyframes live in app/globals.css (`.map-robot-bob`), respecting
// prefers-reduced-motion.
//
// Server component: nothing here needs interactivity. The animation runs
// purely in CSS so it ships zero client JS.

import { RobotAvatar } from "@/components/promptly/RobotAvatar";

interface Props {
  level: number;
  topPx: number;
  leftPercent: number;
  /** Optional label rendered as a small flag next to the avatar. */
  flag?: string | null;
}

export function MapRobotCursor({ level, topPx, leftPercent, flag }: Props) {
  return (
    <div
      className="pointer-events-none absolute z-20 flex flex-col items-center"
      style={{
        top: topPx,
        left: `${leftPercent}%`,
        transform: "translate(-50%, -50%)",
      }}
    >
      <div className="map-robot-bob">
        <RobotAvatar level={level} size="sm" />
      </div>
      {flag && (
        <div className="mt-1 rounded-full bg-primary px-2 py-0.5 text-center font-heading text-[10px] font-bold uppercase tracking-wider text-white shadow">
          {flag}
        </div>
      )}
    </div>
  );
}
