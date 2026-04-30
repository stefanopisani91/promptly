// One path's section on the map. Server component — composes:
//   - BiomeBackground (decorative SVG layer)
//   - MapPathLine    (the smooth sine-wave spine)
//   - MapNode[]      (lesson nodes, client islands, sitting on the spine)
//   - MapBonusIsland[] (nestled inside concave spaces of the spine)
//   - MapRobotCursor (when this is the user's current path)
//   - Section header banner with path title + tagline + progress.

import { Crown } from "lucide-react";
import type { Lang } from "@/types";

import { cn } from "@/lib/utils";
import {
  getBonusPosition,
  getNodePosition,
  getSectionHeight,
} from "@/lib/map/layout";
import type { MapPathSection } from "@/lib/map/data";
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
          isSpace
            ? "border-[var(--bioma-ship-accent)]/40 bg-[var(--bioma-ship-bg-deep)]/85"
            : "border-border",
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
                copy.paths[PATH_META[section.slug].prerequisitePath ?? "mindset"]
                  .title,
              )}
        </p>
      </header>

      {/* Lesson nodes — sit on the spine. */}
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

      {/* Bonus islands nestled in the concave spaces of the spine. */}
      {section.bonusAttachments.map((attachment) => {
        const pos = getBonusPosition(
          totalNodes,
          attachment.slotIndex,
          attachment.side,
        );
        return (
          <MapBonusIsland
            key={`${section.slug}-bonus-${attachment.bonus.slug}`}
            bonus={attachment.bonus}
            unlock={attachment.unlock}
            lang={lang}
            bottomPx={pos.bottomPx}
            leftPercent={pos.leftPercent}
          />
        );
      })}

      {/* Robot cursor — placed on top of the current node, on the spine. */}
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
