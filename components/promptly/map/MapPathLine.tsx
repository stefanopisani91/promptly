// Decorative SVG that draws the curved dashed line connecting the lesson
// nodes within a section. Server component — pure rendering.
//
// The line is split into two visual states:
//   - "walked" — solid, accent-coloured, between completed nodes (and to
//     the current node).
//   - "ahead" — dashed, muted, between not-yet-reached nodes.

import type { PathSlug } from "@/types";
import { getNodePosition, NODE_ROW_HEIGHT_PX } from "@/lib/map/layout";

import type { NodeState } from "@/lib/map/data";

interface Props {
  bioma: PathSlug;
  nodes: { state: NodeState }[];
  height: number; // section height in px (matches BiomeBackground)
}

export function MapPathLine({ bioma, nodes, height }: Props) {
  if (nodes.length < 2) return null;

  const accent = `var(--bioma-${bioma}-accent)`;

  // Translate (leftPercent, bottomPx) → (xViewBox, yViewBox).
  // viewBox: width=100 (matches percent), height=`height` px.
  const points = nodes.map((_, i) => {
    const pos = getNodePosition(i, nodes.length);
    return {
      x: pos.leftPercent,
      // SVG y grows downward; we want lesson 0 at bottom, so y = height - bottomPx.
      y: height - pos.bottomPx,
    };
  });

  // Build two paths: one walked (solid), one ahead (dashed). The split
  // point is the LAST node in {completed, current} — the line up to (and
  // including) the current node is "walked", everything after is "ahead".
  const lastWalkedIdx = (() => {
    for (let i = nodes.length - 1; i >= 0; i--) {
      if (nodes[i].state === "completed" || nodes[i].state === "current") {
        return i;
      }
    }
    return -1;
  })();

  function buildD(from: number, to: number): string {
    if (to <= from) return "";
    const segments: string[] = [`M ${points[from].x} ${points[from].y}`];
    for (let i = from + 1; i <= to; i++) {
      const prev = points[i - 1];
      const cur = points[i];
      // Quadratic Bezier with control point offset toward the previous y
      // — gives a soft curve through the zigzag.
      const cx = (prev.x + cur.x) / 2;
      const cy = (prev.y + cur.y) / 2 - NODE_ROW_HEIGHT_PX * 0.05;
      segments.push(`Q ${cx} ${cy} ${cur.x} ${cur.y}`);
    }
    return segments.join(" ");
  }

  const walkedD = lastWalkedIdx > 0 ? buildD(0, lastWalkedIdx) : "";
  const aheadFrom = Math.max(0, lastWalkedIdx);
  const aheadD = aheadFrom < nodes.length - 1 ? buildD(aheadFrom, nodes.length - 1) : "";

  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0"
      width="100%"
      height={height}
      viewBox={`0 0 100 ${height}`}
      preserveAspectRatio="none"
    >
      {aheadD && (
        <path
          d={aheadD}
          stroke={accent}
          strokeWidth="2"
          strokeOpacity="0.35"
          strokeLinecap="round"
          strokeDasharray="3 5"
          fill="none"
          // Path is drawn in % space (x: 0-100) but stroke-width is in
          // user units. preserveAspectRatio="none" stretches the viewBox,
          // so we use vector-effect to keep stroke crisp.
          vectorEffect="non-scaling-stroke"
        />
      )}
      {walkedD && (
        <path
          d={walkedD}
          stroke={accent}
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
          vectorEffect="non-scaling-stroke"
        />
      )}
    </svg>
  );
}
