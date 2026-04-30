// Map layout primitives (Dashboard V2 — Phase 4, Mimo-style top-down).
//
// Coordinate convention: each section is rendered with `position: relative`,
// node 0 sits at the *top* of its section and indices grow downward.
// The user starts at the top-most lesson of mindset and progresses down
// through the world.
//
// Path shape: a continuous sine wave (not a stepped zigzag). Nodes sit
// directly on the curve at fixed t-values; the connecting spine is a
// dense polyline sampled from the same sine, so nodes and line agree.
//
// Bonus paths sit *inside the concave spaces* of the curve (no bridges).
// Their position is computed automatically from the spine direction at
// their anchor y, so they always feel nestled inside the wave rather
// than tacked on as branches.

export const NODE_ROW_HEIGHT_PX = 96;
// The top padding leaves room for the section header banner. Bottom
// padding is just breathing room before the next biome starts.
export const SECTION_TOP_PADDING_PX = 104;
export const SECTION_BOTTOM_PADDING_PX = 56;

// Sine parameters — tuned visually for legibility at 320px viewport.
// Amplitude is the half-swing of the wave (% of section width).
// Period is how many node-rows it takes to complete one full S.
const AMPLITUDE_PERCENT = 22; // x sweeps from 50−22 = 28% to 50+22 = 72%
const PERIOD_NODES = 4;

export interface NodePosition {
  /** Distance from the top of the section, in CSS px. */
  topPx: number;
  /** Horizontal position as a percentage of the section width. */
  leftPercent: number;
}

function spineXAt(t: number): number {
  // t is a continuous "node index". Phase chosen so node 0 sits dead
  // center (x=50%) and the curve immediately swings to the right.
  const phase = (t / PERIOD_NODES) * Math.PI * 2;
  return 50 + AMPLITUDE_PERCENT * Math.sin(phase);
}

function spineTopAt(t: number): number {
  return SECTION_TOP_PADDING_PX + t * NODE_ROW_HEIGHT_PX;
}

/**
 * Position the i-th lesson node (0-based) along the spine. Higher index
 * → lower in the section (you "descend" through the world).
 */
export function getNodePosition(index: number, totalNodes: number): NodePosition {
  void totalNodes;
  return {
    topPx: spineTopAt(index),
    leftPercent: spineXAt(index),
  };
}

/**
 * Total height of a section in CSS px. Sums top padding (banner room),
 * one row per node, and bottom padding (breathing room).
 */
export function getSectionHeight(totalNodes: number): number {
  return (
    SECTION_TOP_PADDING_PX +
    totalNodes * NODE_ROW_HEIGHT_PX +
    SECTION_BOTTOM_PADDING_PX
  );
}

/**
 * Build an SVG `d` string sampling the spine between two t-values.
 * High sample count → visually-smooth curve at all viewports. The path
 * is rendered with `vector-effect: non-scaling-stroke` so width stays
 * crisp under preserveAspectRatio="none".
 *
 * y in the returned d-string IS the SVG-natural coordinate (top = 0)
 * which now matches the node convention — no flip needed.
 */
export function buildSpinePathD(fromT: number, toT: number): string {
  if (toT <= fromT) return "";
  const SAMPLES_PER_NODE = 18;
  const totalSamples = Math.max(1, Math.ceil((toT - fromT) * SAMPLES_PER_NODE));

  const segments: string[] = [];
  for (let s = 0; s <= totalSamples; s++) {
    const t = fromT + (s / totalSamples) * (toT - fromT);
    const x = spineXAt(t);
    const y = spineTopAt(t);
    segments.push(`${s === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`);
  }
  return segments.join(" ");
}

/**
 * Position a bonus path "in the concave" of the spine.
 *
 * Each parent path may have up to two bonuses attached. Slot 0 anchors
 * near the upper-third of the parent's spine (early bonuses), slot 1 a
 * bit lower — so two bonuses on the same parent never collide.
 *
 * `requestedSide` is honored when it doesn't conflict with the natural
 * concave (the spine, not the call-site, decides what looks right).
 */
export type BonusSide = "left" | "right";

export interface BonusPosition {
  /** Distance from the top of the parent section, in CSS px. */
  topPx: number;
  /** Horizontal position as a percentage of the section width. */
  leftPercent: number;
  /** Side actually used (after concave reconciliation). */
  resolvedSide: BonusSide;
}

const BONUS_INSET_PERCENT = 12; // distance from section edge

export function getBonusPosition(
  parentTotalNodes: number,
  slotIndex: number,
  requestedSide: BonusSide,
): BonusPosition {
  // Anchor t — for top-down progression, slot 0 sits closer to the top
  // (early in the journey) and slot 1 a bit lower. The mid-section
  // placement keeps both slots in the most "watery" part of the wave.
  const slotOffsets = [0.4, 0.65];
  const fromTop = slotOffsets[slotIndex] ?? 0.5;
  const anchorT = fromTop * (parentTotalNodes - 1);

  const spineX = spineXAt(anchorT);
  // Concave side: when the spine is on the right half (x > 50), the
  // *left* half is "inside" the curve's bend → that's the bonus slot.
  const naturalSide: BonusSide = spineX >= 50 ? "left" : "right";

  // Honor the request only when it matches the natural side; otherwise
  // override silently — visual coherence trumps catalog metadata.
  const resolvedSide = requestedSide === naturalSide ? requestedSide : naturalSide;

  return {
    topPx: spineTopAt(anchorT),
    leftPercent:
      resolvedSide === "left" ? BONUS_INSET_PERCENT : 100 - BONUS_INSET_PERCENT,
    resolvedSide,
  };
}
