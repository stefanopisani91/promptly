// One path's section on the map. Server component — composes:
//   - BiomeBackground (decorative SVG layer)
//   - MapPathLine    (the connecting walked/ahead path)
//   - MapNode[]      (lesson nodes, client islands)
//   - MapBonusIsland[] + bonus bridges
//   - MapRobotCursor (when this is the user's current path)
//   - Section header banner with path title + tagline + progress.

import type { Lang } from "@/types";
import { Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getNodePosition,
  getSectionHeight,
  NODE_ROW_HEIGHT_PX,
} from "@/lib/map/layout";
import type { MapBonusAttachment, MapPathSection } from "@/lib/map/data";
import type { MapCopy } from "@/lib/i18n/map";
import { PATH_META } from "@/lib/lessons/paths";

import { BiomeBackground } from "./BiomeBackground";
import { MapPathLine } from "./MapPathLine";
import { MapNode } from "./MapNode";
import { MapBonusIsland } from "./MapBonusIsland";
import { MapRobotCursor } from "./MapRobotCursor";

interface Props {
  section: MapPathSection;
  lang: Lang;
  copy: MapCopy;
  /** When true, render the START flag above the first node (lesson 0). */
  showStart: boolean;
  /** When set, draw the robot at the given lesson index inside this section. */
  robotAtIndex: number | null;
  /** Robot's current level (drives which DiceBear seed is used). */
  level: number;
}

export function MapSection({
  section,
  lang,
  copy,
  showStart,
  robotAtIndex,
  level,
}: Props) {
  const totalNodes = section.totalLessons;
  const sectionHeight = getSectionHeight(totalNodes);

  const isSpace = section.slug === "ship";
  const titleColor = isSpace
    ? "text-[var(--bioma-ship-text)]"
    : "text-text-primary";
  const taglineColor = isSpace
    ? "text-[var(--bioma-ship-accent)]"
    : "text-text-secondary";

  const pathCopy = copy.paths[section.slug];

  return (
    <section
      aria-label={pathCopy.title}
      className="relative w-full overflow-hidden"
      style={{ minHeight: sectionHeight }}
    >
      <BiomeBackground
        bioma={section.slug}
        height={sectionHeight}
        muted={section.isPro && !section.isUnlocked}
      />

      <MapPathLine
        bioma={section.slug}
        nodes={section.nodes}
        height={sectionHeight}
      />

      {/* Section header banner — sits at the top of this section. */}
      <header
        className={cn(
          "absolute left-1/2 z-10 w-[88%] max-w-md -translate-x-1/2 rounded-2xl border bg-surface/90 px-4 py-3 text-center backdrop-blur-sm",
          isSpace ? "border-[var(--bioma-ship-accent)]/40 bg-[var(--bioma-ship-bg-deep)]/85" : "border-border",
        )}
        style={{ top: 12 }}
      >
        <div className="flex items-center justify-center gap-2">
          <h3
            className={cn(
              "font-heading text-base font-bold leading-tight",
              isSpace ? "text-[var(--bioma-ship-text)]" : titleColor,
            )}
          >
            {pathCopy.title}
          </h3>
          {section.isPro && (
            <span className="inline-flex items-center gap-1 rounded-full bg-pro-light px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-pro-accent">
              <Crown className="h-3 w-3" aria-hidden />
              {copy.pathPro}
            </span>
          )}
        </div>
        <p
          className={cn(
            "mt-0.5 text-xs",
            isSpace ? "text-[var(--bioma-ship-accent)]" : taglineColor,
          )}
        >
          {pathCopy.tagline}
        </p>
        <p className="mt-1 font-mono text-[11px] text-text-muted">
          {section.isUnlocked || section.isPro
            ? copy.pathProgress(section.completedLessons, section.totalLessons)
            : copy.pathLockedHint(
                copy.paths[PATH_META[section.slug].prerequisitePath ?? "mindset"].title,
              )}
        </p>
      </header>

      {/* Lesson nodes (client islands). */}
      {section.nodes.map((node) => {
        const pos = getNodePosition(node.index, totalNodes);
        return (
          <MapNode
            key={`${section.slug}-${node.index}`}
            node={node}
            bioma={section.slug}
            pathTitle={pathCopy.title}
            positionLabel={node.index + 1}
            lang={lang}
            bottomPx={pos.bottomPx}
            leftPercent={pos.leftPercent}
          />
        );
      })}

      {/* Bonus islands branching off this section (with bridges). */}
      {section.bonusAttachments.map((attachment) => (
        <BonusBranch
          key={`${section.slug}-bonus-${attachment.bonus.slug}`}
          attachment={attachment}
          totalNodes={totalNodes}
          sectionHeight={sectionHeight}
          lang={lang}
          biomaAccent={`var(--bioma-${section.slug}-accent)`}
        />
      ))}

      {/* Robot cursor — placed on top of the current node. */}
      {robotAtIndex !== null && (
        <MapRobotCursor
          level={level}
          bottomPx={getNodePosition(robotAtIndex, totalNodes).bottomPx}
          leftPercent={getNodePosition(robotAtIndex, totalNodes).leftPercent}
          flag={showStart ? copy.start.label : null}
        />
      )}
    </section>
  );
}

// ─── Bonus branch (bridge SVG + island) ─────────────────────────────

interface BonusBranchProps {
  attachment: MapBonusAttachment;
  totalNodes: number;
  sectionHeight: number;
  lang: Lang;
  biomaAccent: string;
}

function BonusBranch({
  attachment,
  totalNodes,
  sectionHeight,
  lang,
  biomaAccent,
}: BonusBranchProps) {
  const spinePos = getNodePosition(attachment.branchAtLessonIndex, totalNodes);
  const islandBottomPx = spinePos.bottomPx + NODE_ROW_HEIGHT_PX * 0.4;

  // SVG bridge: from the spine node to the island. Drawn in viewBox="0 0 100 H".
  const svgY1 = sectionHeight - spinePos.bottomPx;
  const svgY2 = sectionHeight - islandBottomPx;
  const svgX1 = spinePos.leftPercent;
  // Island sits at the section edge — approx 12% inset matches the
  // `left-2`/`right-2` on the island button (8px inside ~600px container).
  const svgX2 = attachment.side === "left" ? 12 : 88;
  // Cubic bezier control points for a soft arc.
  const cpX1 = svgX1;
  const cpY1 = (svgY1 + svgY2) / 2;
  const cpX2 = svgX2;
  const cpY2 = cpY1;
  const bridgePath = `M ${svgX1} ${svgY1} C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${svgX2} ${svgY2}`;

  return (
    <>
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        width="100%"
        height={sectionHeight}
        viewBox={`0 0 100 ${sectionHeight}`}
        preserveAspectRatio="none"
      >
        <path
          d={bridgePath}
          stroke={biomaAccent}
          strokeWidth="2"
          strokeOpacity="0.4"
          strokeDasharray="4 6"
          fill="none"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <MapBonusIsland
        bonus={attachment.bonus}
        unlock={attachment.unlock}
        lang={lang}
        side={attachment.side}
        bottomPx={islandBottomPx}
        spineNodeBottomPx={spinePos.bottomPx}
        spineNodeLeftPercent={spinePos.leftPercent}
        anchorIndex={attachment.branchAtLessonIndex}
      />
    </>
  );
}
