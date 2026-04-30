// Map layout primitives (Dashboard V2 — Phase 4, Mimo-style curve).
//
// Path shape: a continuous sine wave (not a stepped zigzag). Nodes sit
// directly on the curve at fixed t-values; the connecting spine is a
// dense polyline sampled from the same sine, so nodes and line agree.
//
// Coordinate convention: each section is rendered with `position: relative`
// and `bottom` (px) + `left` (%) — lesson 0 sits at the bottom-left of
// its section. The user "climbs" upward as they progress.
//
// Bonus paths sit *inside the concave spaces* of the curve (no bridges).
// Their position is computed automatically from the spine direction at
// their anchor y, so they always feel nestled inside the wave rather
// than tacked on as branches.

export const NODE_ROW_HEIGHT_PX = 96;
export const SECTION_VERTICAL_PADDING_PX = 64;

// Sine parameters — tuned visually for legibility at 320px viewport.
// Amplitude is the half-swing of the wave (% of section width).
// Period is how many node-rows it takes to complete one full S.
const AMPLITUDE_PERCENT = 22; // x sweeps from 50−22 = 28% to 50+22 = 72%
const PERIOD_NODES = 4;

export interface NodePosition {
  /** Distance from the bottom of the section, in CSS px. */
  bottomPx: number;
  /** Horizontal position as a percentage of the section width. */
  leftPercent: number;
}

function spineXAt(t: number): number {
  // t is a continuous "node index". Phase chosen so node 0 sits dead
  // center (x=50%) and the curve immediately swings to the right.
  const phase = (t / PERIOD_NODES) * Math.PI * 2;
  return 50 + AMPLITUDE_PERCENT * Math.sin(phase);
}

function spineBottomAt(t: number): number {
  return SECTION_VERTICAL_PADDING_PX + t * NODE_ROW_HEIGHT_PX;
}

/**
 * Position the i-th lesson node (0-based) along the spine. Higher index
 * → higher up in the section.
 */
export function getNodePosition(index: number, totalNodes: number): NodePosition {
  void totalNodes;
  return {
    bottomPx: spineBottomAt(index),
    leftPercent: spineXAt(index),
  };
}

/**
 * Total height of a section in CSS px. The +1 padding row at the top
 * makes room for the section header banner without overlapping node 0
 * (which is at the bottom anyway, but the SVG viewBox needs to extend).
 */
export function getSectionHeight(totalNodes: number): number {
  return totalNodes * NODE_ROW_HEIGHT_PX + SECTION_VERTICAL_PADDING_PX * 2;
}

/**
 * Build an SVG `d` string sampling the spine between two t-values.
 * High sample count → visually-smooth curve at all viewports. The path
 * is rendered with `vector-effect: non-scaling-stroke` so width stays
 * crisp under preserveAspectRatio="none".
 *
 * The y axis in the returned d-string is SVG-natural (top = 0), so
 * callers should pass viewBox=`0 0 100 sectionHeight` and let the SVG
 * coordinate system do the flip.
 */
export function buildSpinePathD(
  fromT: number,
  toT: number,
  sectionHeight: number,
): string {
  if (toT <= fromT) return "";
  const SAMPLES_PER_NODE = 18;
  const totalSamples = Math.max(1, Math.ceil((toT - fromT) * SAMPLES_PER_NODE));

  const segments: string[] = [];
  for (let s = 0; s <= totalSamples; s++) {
    const t = fromT + (s / totalSamples) * (toT - fromT);
    const x = spineXAt(t);
    const yBottom = spineBottomAt(t);
    const yViewBox = sectionHeight - yBottom;
    segments.push(`${s === 0 ? "M" : "L"} ${x.toFixed(2)} ${yViewBox.toFixed(2)}`);
  }
  return segments.join(" ");
}

/**
 * Position a bonus path "in the concave" of the spine.
 *
 * Each parent path may have up to two bonuses attached. Slot 0 anchors
 * near the upper third of the parent's spine, slot 1 a bit lower — so
 * two bonuses on the same parent never collide vertically. The X is
 * derived from the *opposite* extreme of the spine at that y, which
 * naturally puts the bonus inside the curve's bend.
 *
 * `requestedSide` is honored when it doesn't conflict with the natural
 * concave (the spine, not the call-site, decides what looks right).
 */
export type BonusSide = "left" | "right";

export interface BonusPosition {
  /** Distance from the bottom of the parent section, in CSS px. */
  bottomPx: number;
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
  // Anchor t — slot 0 sits ~25% down from the top, slot 1 ~50% down.
  // We measure from the top so bonuses stay near the path's exit point
  // (where the user "leaves" the parent biome on completion).
  const slotOffsets = [0.25, 0.5];
  const fromTop = slotOffsets[slotIndex] ?? 0.4;
  const anchorT = parentTotalNodes - 1 - fromTop * (parentTotalNodes - 1);

  const spineX = spineXAt(anchorT);
  // Concave side: the spine's value at this t is between 28 and 72.
  // If the spine is on the right half, the left half is "inside" the
  // bend and that's our preferred bonus slot.
  const naturalSide: BonusSide = spineX >= 50 ? "left" : "right";

  // Honor the request only when it matches the natural side; otherwise
  // override silently — visual coherence trumps catalog metadata.
  const resolvedSide = requestedSide === naturalSide ? requestedSide : naturalSide;

  return {
    bottomPx: spineBottomAt(anchorT),
    leftPercent:
      resolvedSide === "left" ? BONUS_INSET_PERCENT : 100 - BONUS_INSET_PERCENT,
    resolvedSide,
  };
}
