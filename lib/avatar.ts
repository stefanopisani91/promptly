// Robot avatar generation — deterministic SVGs from DiceBear `bottts`.
// Each level maps to a fixed seed so all users at the same level see the
// same robot (the robot is a "rank", not personal identity — see
// DASHBOARD_V2.md §2).
//
// SVGs are generated server-side; no CDN calls at runtime.

import { createAvatar } from "@dicebear/core";
import { botttsNeutral } from "@dicebear/collection";

import { getLevelInfo, MAX_LEVEL, MIN_LEVEL } from "@/lib/levels";

const LEVEL_SEEDS: Record<number, string> = {
  1: "init-rookie-v1",
  2: "byte-explorer-v1",
  3: "circuit-coder-v1",
  4: "nexus-engineer-v1",
  5: "vertex-builder-v1",
  6: "apex-master-v1",
  7: "omega-architect-v1",
};

function clampLevel(level: number): number {
  return Math.min(MAX_LEVEL, Math.max(MIN_LEVEL, Math.floor(level)));
}

export function getRobotSvg(level: number): string {
  const lvl = clampLevel(level);
  const seed = LEVEL_SEEDS[lvl] ?? LEVEL_SEEDS[1];
  const avatar = createAvatar(botttsNeutral, {
    seed,
    size: 128,
    radius: 16,
  });
  return avatar.toString();
}

// Base64 data URL for use in <img src> or CSS background-image. Most call
// sites should prefer inline SVG (dangerouslySetInnerHTML) for crispness,
// but this is the safer default when the consumer already expects a URL.
export function getRobotSvgDataUrl(level: number): string {
  const svg = getRobotSvg(level);
  // Buffer is available in both Node (server components) and Edge runtimes
  // via Next's polyfill — but to keep this isomorphic we use btoa on the
  // raw UTF-8 bytes. encodeURIComponent + unescape avoids the unicode trap.
  const base64 =
    typeof Buffer !== "undefined"
      ? Buffer.from(svg, "utf-8").toString("base64")
      : btoa(unescape(encodeURIComponent(svg)));
  return `data:image/svg+xml;base64,${base64}`;
}

// Convenience: get the robot SVG along with the level metadata in one call,
// for components that need both (e.g. RobotAvatar with alt text).
export function getRobotForLevel(level: number) {
  const info = getLevelInfo(level);
  return {
    info,
    svg: getRobotSvg(info.level),
  };
}
