// Smooth sine-wave spine connecting the lesson nodes. Renders in either
// vertical (top-down) or horizontal (left-to-right) orientation, picking
// the matching layout helpers from lib/map/layout.ts.
//
// Two visual layers:
//   - "ahead": dashed, muted, full spine
//   - "walked": solid accent on top, ending at the last completed/current node

import type { PathSlug } from "@/types";
import { buildSpinePathD, buildSpinePathDH } from "@/lib/map/layout";

import type { NodeState } from "@/lib/map/data";

interface Props {
  bioma: PathSlug;
  nodes: { state: NodeState }[];
  /** Section height in px. For horizontal mode this is the band height. */
  height: number;
  orientation: "vertical" | "horizontal";
}

export function MapPathLine({ bioma, nodes, height, orientation }: Props) {
  if (nodes.length < 1) return null;

  const accent = `var(--bioma-${bioma}-accent)`;

  const lastWalkedIdx = (() => {
    for (let i = nodes.length - 1; i >= 0; i--) {
      if (nodes[i].state === "completed" || nodes[i].state === "current") {
        return i;
      }
    }
    return -1;
  })();

  const buildD = (from: number, to: number) =>
    orientation === "horizontal"
      ? buildSpinePathDH(from, to, nodes.length)
      : buildSpinePathD(from, to);

  const fullD = buildD(0, nodes.length - 1);
  const walkedD = lastWalkedIdx > 0 ? buildD(0, lastWalkedIdx) : "";

  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0"
      width="100%"
      height={height}
      viewBox={`0 0 100 ${height}`}
      preserveAspectRatio="none"
    >
      <path
        d={fullD}
        stroke={accent}
        strokeWidth="6"
        strokeOpacity="0.25"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="4 8"
        fill="none"
        vectorEffect="non-scaling-stroke"
      />
      {walkedD && (
        <path
          d={walkedD}
          stroke={accent}
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          vectorEffect="non-scaling-stroke"
        />
      )}
    </svg>
  );
}
