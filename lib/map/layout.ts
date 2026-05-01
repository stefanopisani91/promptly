// Map layout primitives.
//
// Two layout modes:
//   - VERTICAL (default, <1024px viewport): top-down sine wave, the user
//     descends through the world. Used on tablet/phone.
//   - HORIZONTAL (≥1024px viewport, "wide"): left-to-right sine wave, used
//     on laptop/desktop. Each biome section is a fixed-height band the user
//     scrolls down through, but within a band the path runs horizontally.
//
// Both modes derive node positions from the same sine. The runtime picks
// which set of helpers to call (see MapSection — client component).
//
// Bonus paths sit *inside the concave spaces* of the curve in both modes
// (no bridges).

export const NODE_ROW_HEIGHT_PX = 96;
export const SECTION_TOP_PADDING_PX = 156;
export const SECTION_BOTTOM_PADDING_PX = 56;

const AMPLITUDE_PERCENT = 22;
const PERIOD_NODES = 4;

export interface NodePosition {
  /** Distance from the top of the section, in CSS px. */
  topPx: number;
  /** Horizontal position as a percentage of the section width. */
  leftPercent: number;
}

// ─── Vertical mode (existing behaviour) ──────────────────────────────

function spineXAt(t: number): number {
  const phase = (t / PERIOD_NODES) * Math.PI * 2;
  return 50 + AMPLITUDE_PERCENT * Math.sin(phase);
}

function spineTopAt(t: number): number {
  return SECTION_TOP_PADDING_PX + t * NODE_ROW_HEIGHT_PX;
}

export function getNodePosition(index: number, totalNodes: number): NodePosition {
  void totalNodes;
  return {
    topPx: spineTopAt(index),
    leftPercent: spineXAt(index),
  };
}

export function getSectionHeight(totalNodes: number): number {
  return (
    SECTION_TOP_PADDING_PX +
    totalNodes * NODE_ROW_HEIGHT_PX +
    SECTION_BOTTOM_PADDING_PX
  );
}

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

export type BonusSide = "left" | "right";

export interface BonusPosition {
  topPx: number;
  leftPercent: number;
  resolvedSide: BonusSide;
}

const BONUS_INSET_PERCENT = 12;

export function getBonusPosition(
  parentTotalNodes: number,
  slotIndex: number,
  requestedSide: BonusSide,
): BonusPosition {
  const slotOffsets = [0.4, 0.65];
  const fromTop = slotOffsets[slotIndex] ?? 0.5;
  const anchorT = fromTop * (parentTotalNodes - 1);

  const spineX = spineXAt(anchorT);
  const naturalSide: BonusSide = spineX >= 50 ? "left" : "right";
  const resolvedSide = requestedSide === naturalSide ? requestedSide : naturalSide;

  return {
    topPx: spineTopAt(anchorT),
    leftPercent:
      resolvedSide === "left" ? BONUS_INSET_PERCENT : 100 - BONUS_INSET_PERCENT,
    resolvedSide,
  };
}

// ─── Horizontal mode (≥1024px) ───────────────────────────────────────

export const HORIZONTAL_SECTION_HEIGHT_PX = 420;
const H_PAD_LEFT_PERCENT = 7;
const H_PAD_RIGHT_PERCENT = 7;
const H_AMPLITUDE_PX = 78;
const H_CENTER_Y_PX = HORIZONTAL_SECTION_HEIGHT_PX / 2;

function spineXAtH(t: number, totalNodes: number): number {
  if (totalNodes <= 1) return 50;
  const usable = 100 - H_PAD_LEFT_PERCENT - H_PAD_RIGHT_PERCENT;
  return H_PAD_LEFT_PERCENT + (t / (totalNodes - 1)) * usable;
}

function spineYAtH(t: number): number {
  const phase = (t / PERIOD_NODES) * Math.PI * 2;
  return H_CENTER_Y_PX + H_AMPLITUDE_PX * Math.sin(phase);
}

export function getNodePositionH(index: number, totalNodes: number): NodePosition {
  return {
    topPx: spineYAtH(index),
    leftPercent: spineXAtH(index, totalNodes),
  };
}

/**
 * Build the SVG path for the horizontal spine.
 * Coordinates are emitted in the same `viewBox="0 0 100 H"` system as the
 * vertical mode — x is a percentage (0..100), y is pixels.
 */
export function buildSpinePathDH(
  fromT: number,
  toT: number,
  totalNodes: number,
): string {
  if (toT <= fromT) return "";
  const SAMPLES_PER_NODE = 22;
  const totalSamples = Math.max(1, Math.ceil((toT - fromT) * SAMPLES_PER_NODE));

  const segments: string[] = [];
  for (let s = 0; s <= totalSamples; s++) {
    const t = fromT + (s / totalSamples) * (toT - fromT);
    const x = spineXAtH(t, totalNodes);
    const y = spineYAtH(t);
    segments.push(`${s === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`);
  }
  return segments.join(" ");
}

/**
 * Bonus position in horizontal mode — "side" gets re-mapped:
 *   left  → bonus floats ABOVE the spine (towards section top)
 *   right → bonus floats BELOW the spine (towards section bottom)
 *
 * Strategy: anchor at consecutive spine extrema (peak, valley, peak,
 * valley...) using slotIndex as the picker. This guarantees the badge
 * lands in a naturally concave pocket. The catalog's `requestedSide` is
 * honoured only when it matches the anchor's natural concave; otherwise
 * the natural side wins (visual coherence beats catalog metadata).
 *
 * Period of the spine is PERIOD_NODES (=4): peaks at t=3,7,11... and
 * valleys at t=1,5,9... For typical paths (N=6..10) we get up to 2 useful
 * extrema, which matches the catalog (max 2 bonuses per parent path).
 */
const HORIZONTAL_BONUS_EXTREMA_TS = [3, 5, 7, 9, 11, 13];
const H_BONUS_OFFSET_PX = 95; // distance between spine and badge centre

export function getBonusPositionH(
  parentTotalNodes: number,
  slotIndex: number,
  requestedSide: BonusSide,
): BonusPosition {
  // Pick the slotIndex-th extremum, clamped to within the path range.
  // For very short paths the same anchor may be reused, but in practice
  // the catalog never declares >2 bonuses on a path.
  const rawAnchor =
    HORIZONTAL_BONUS_EXTREMA_TS[slotIndex] ??
    HORIZONTAL_BONUS_EXTREMA_TS[HORIZONTAL_BONUS_EXTREMA_TS.length - 1];
  const anchorT = Math.min(rawAnchor, parentTotalNodes - 1);

  const x = spineXAtH(anchorT, parentTotalNodes);
  const yOnSpine = spineYAtH(anchorT);

  // Concave pocket: at a peak (small y, top of section) the cup opens
  // downward — natural side is "right" (below). At a valley (large y) it
  // opens upward — natural side is "left" (above).
  const naturalSide: BonusSide = yOnSpine >= H_CENTER_Y_PX ? "left" : "right";
  const resolvedSide = requestedSide === naturalSide ? requestedSide : naturalSide;

  const topPx =
    resolvedSide === "left"
      ? yOnSpine - H_BONUS_OFFSET_PX
      : yOnSpine + H_BONUS_OFFSET_PX;

  return { topPx, leftPercent: x, resolvedSide };
}
