// Map layout primitives (Dashboard V2 — Phase 4).
//
// Pure helpers that compute pixel/percent positions for nodes within a
// path section. Kept separate from the React components so the geometry
// is testable and easy to retune visually.
//
// Coordinate convention: each section is rendered with `position: relative`
// and node positions are expressed via `bottom` (px) + `left` (%) — the
// "bottom" reference makes lesson #1 sit at the bottom-left, which matches
// the spec's "scroll from villaggio at bottom up to spazio at top".

export const NODE_ROW_HEIGHT_PX = 92;
// Extra padding at top/bottom of each section so robots/labels don't get clipped.
export const SECTION_VERTICAL_PADDING_PX = 56;

// Four-step zigzag — gives a rhythmic S-curve while staying tappable on
// narrow viewports. Tuned manually so consecutive nodes never overlap on
// 320px-wide screens at 56px node size.
const ZIGZAG_X_PERCENTS: readonly number[] = [28, 50, 72, 50];

export interface NodePosition {
  /** Distance from the bottom of the section, in CSS px. */
  bottomPx: number;
  /** Horizontal position as a percentage of the section width. */
  leftPercent: number;
}

/**
 * Position the i-th lesson node (0-based) in a section of `totalNodes`.
 * Higher index → higher up in the section (you "climb" while progressing).
 */
export function getNodePosition(index: number, totalNodes: number): NodePosition {
  void totalNodes; // total isn't currently needed but keeps the API symmetric
  const bottomPx = SECTION_VERTICAL_PADDING_PX + index * NODE_ROW_HEIGHT_PX;
  const leftPercent = ZIGZAG_X_PERCENTS[index % ZIGZAG_X_PERCENTS.length];
  return { bottomPx, leftPercent };
}

/**
 * Total height of a section in CSS px. Used by the SVG overlay viewBox and
 * by the section container's min-height.
 */
export function getSectionHeight(totalNodes: number): number {
  return totalNodes * NODE_ROW_HEIGHT_PX + SECTION_VERTICAL_PADDING_PX * 2;
}

export type BonusSide = "left" | "right";

/**
 * Where a bonus island sits relative to the parent path's section.
 * Each bonus path declares which main-path lesson it branches off from
 * (`branchAtLessonIndex`) and which side (`side`). The island is drawn
 * outside the section's padding box on that side, with a short SVG bridge
 * connecting the spine node to the island.
 */
export interface BonusIslandPosition {
  /** y of the *anchor* lesson on the spine, in section-bottom-relative px. */
  spineNodeBottomPx: number;
  /** x of the spine node (matches the zigzag), in percent. */
  spineNodeLeftPercent: number;
  /** Which side of the section the island sits on. */
  side: BonusSide;
  /** y of the island center, in section-bottom-relative px. */
  islandBottomPx: number;
}

export function getBonusIslandPosition(
  branchAtLessonIndex: number,
  totalNodes: number,
  side: BonusSide,
): BonusIslandPosition {
  const spine = getNodePosition(branchAtLessonIndex, totalNodes);
  // Offset the island slightly upward so it doesn't perfectly align with
  // the anchor — feels less rigid.
  const islandBottomPx = spine.bottomPx + NODE_ROW_HEIGHT_PX * 0.4;
  return {
    spineNodeBottomPx: spine.bottomPx,
    spineNodeLeftPercent: spine.leftPercent,
    side,
    islandBottomPx,
  };
}
