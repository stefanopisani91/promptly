// Smooth sine-wave spine connecting the lesson nodes (Mimo-style,
// top-down). Server component — pure rendering.
//
// Two visual layers:
//   - "ahead": dashed, muted, the full spine from start to end
//   - "walked": solid, accent-coloured, drawn ON TOP from start to the
//     last completed/current node
//
// Both layers are sampled from the same sine in lib/map/layout.ts, so
// nodes always sit exactly on the curve.

import type { PathSlug } from "@/types";
import { buildSpinePathD } from "@/lib/map/layout";

import type { NodeState } from "@/lib/map/data";

interface Props {
  bioma: PathSlug;
  nodes: { state: NodeState }[];
  height: number; // section height in px
}

export function MapPathLine({ bioma, nodes, height }: Props) {
  if (nodes.length < 1) return null;

  const accent = `var(--bioma-${bioma}-accent)`;

  // Find the last walked t — the last completed or current node defines
  // where the solid line ends. -1 means nothing is walked yet.
  const lastWalkedIdx = (() => {
    for (let i = nodes.length - 1; i >= 0; i--) {
      if (nodes[i].state === "completed" || nodes[i].state === "current") {
        return i;
      }
    }
    return -1;
  })();

  const fullD = buildSpinePathD(0, nodes.length - 1);
  const walkedD = lastWalkedIdx > 0 ? buildSpinePathD(0, lastWalkedIdx) : "";

  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0"
      width="100%"
      height={height}
      viewBox={`0 0 100 ${height}`}
      preserveAspectRatio="none"
    >
      {/* Ahead — full spine, muted dashed. */}
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
      {/* Walked — drawn on top, solid. */}
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
