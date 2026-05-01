"use client";

// One path's section on the map. Renders the spine + nodes + bonus badges
// either vertically (default) or horizontally (≥1024px viewport, "wide").
//
// Why a client component: orientation depends on `matchMedia`, which can
// only be observed in the browser. We default to vertical for the first
// paint (matches mobile/tablet, the common case) and flip to horizontal
// after mount on desktop.

import { useEffect, useState } from "react";
import { Crown } from "lucide-react";
import type { Lang } from "@/types";

import {
  HORIZONTAL_SECTION_HEIGHT_PX,
  getBonusPosition,
  getBonusPositionH,
  getNodePosition,
  getNodePositionH,
  getSectionHeight,
} from "@/lib/map/layout";
import type { MapPathSection } from "@/lib/map/data";
import { getMapCopy } from "@/lib/i18n/map";
import { PATH_META } from "@/lib/lessons/paths";

import { BiomeBackground } from "./BiomeBackground";
import { MapPathLine } from "./MapPathLine";
import { MapNode } from "./MapNode";
import { MapBonusBadge } from "./MapBonusBadge";
import { MapRobotCursor } from "./MapRobotCursor";

interface Props {
  section: MapPathSection;
  // We pass `lang` (a primitive) instead of the resolved MapCopy so we
  // don't try to serialize i18n *functions* across the RSC boundary —
  // MapSection is a client component, and copy.* contains methods like
  // `pathProgress(completed, total)` that aren't serializable.
  lang: Lang;
  showStart: boolean;
  robotAtIndex: number | null;
  level: number;
}

const BIOMA_NEON: Record<string, string> = {
  mindset: "#7DF9FF",
  prompt: "#A6FF00",
  build: "#FF4D8B",
  debug: "#FFB400",
  ship: "#7DF9FF",
};

export function MapSection({
  section,
  lang,
  showStart,
  robotAtIndex,
  level,
}: Props) {
  const copy = getMapCopy(lang);
  const totalNodes = section.totalLessons;
  const pathCopy = copy.paths[section.slug];
  const neon = BIOMA_NEON[section.slug] ?? "#7DF9FF";

  const [isWide, setIsWide] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(min-width: 1024px)");
    setIsWide(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setIsWide(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const sectionHeight = isWide
    ? HORIZONTAL_SECTION_HEIGHT_PX
    : getSectionHeight(totalNodes);

  const popoverSideForNode = (
    index: number,
    yPx: number,
  ): "top" | "bottom" => {
    if (!isWide) return index === 0 ? "bottom" : "top";
    return yPx < HORIZONTAL_SECTION_HEIGHT_PX / 2 ? "bottom" : "top";
  };

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
        orientation={isWide ? "horizontal" : "vertical"}
      />

      {isWide ? (
        <header className="absolute left-3 top-3 z-10 inline-flex max-w-[60%] items-center gap-2 rounded-full border border-border bg-surface/95 px-3 py-1.5 shadow-sm backdrop-blur-md">
          <h3 className="font-heading text-sm font-bold leading-tight text-text-primary">
            {pathCopy.title}
          </h3>
          {section.isPro && (
            <span className="inline-flex items-center gap-1 rounded-full bg-pro-light px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-pro-accent">
              <Crown className="h-2.5 w-2.5" aria-hidden />
              {copy.pathPro}
            </span>
          )}
          <span className="ml-1 rounded-full bg-text-primary/85 px-2 py-0.5 font-mono text-[10px] font-semibold text-white">
            {section.completedLessons}/{section.totalLessons}
          </span>
        </header>
      ) : (
        <header
          className="absolute left-1/2 z-10 w-[88%] max-w-md -translate-x-1/2 rounded-2xl border border-border bg-background px-4 py-3 text-center"
          style={{ top: 12 }}
        >
          <div className="flex items-center justify-center gap-2">
            <h3 className="font-heading text-base font-bold leading-tight text-text-primary">
              {pathCopy.title}
            </h3>
            {section.isPro && (
              <span className="inline-flex items-center gap-1 rounded-full bg-pro-light px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-pro-accent">
                <Crown className="h-3 w-3" aria-hidden />
                {copy.pathPro}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-text-secondary">{pathCopy.tagline}</p>
          <p className="mt-1 font-mono text-[11px] text-text-muted">
            {section.isUnlocked || section.isPro
              ? copy.pathProgress(section.completedLessons, section.totalLessons)
              : copy.pathLockedHint(
                  copy.paths[PATH_META[section.slug].prerequisitePath ?? "mindset"]
                    .title,
                )}
          </p>
        </header>
      )}

      {section.nodes.map((node) => {
        const pos = isWide
          ? getNodePositionH(node.index, totalNodes)
          : getNodePosition(node.index, totalNodes);
        return (
          <MapNode
            key={`${section.slug}-${node.index}`}
            node={node}
            bioma={section.slug}
            pathTitle={pathCopy.title}
            positionLabel={node.index + 1}
            lang={lang}
            topPx={pos.topPx}
            leftPercent={pos.leftPercent}
            popoverSide={popoverSideForNode(node.index, pos.topPx)}
          />
        );
      })}

      {section.bonusAttachments.map((attachment) => {
        const pos = isWide
          ? getBonusPositionH(totalNodes, attachment.slotIndex, attachment.side)
          : getBonusPosition(totalNodes, attachment.slotIndex, attachment.side);
        return (
          <MapBonusBadge
            key={`${section.slug}-bonus-${attachment.bonus.slug}`}
            bonus={attachment.bonus}
            unlock={attachment.unlock}
            lang={lang}
            topPx={pos.topPx}
            leftPercent={pos.leftPercent}
            neonColor={neon}
          />
        );
      })}

      {robotAtIndex !== null && (
        <MapRobotCursor
          level={level}
          topPx={
            isWide
              ? getNodePositionH(robotAtIndex, totalNodes).topPx
              : getNodePosition(robotAtIndex, totalNodes).topPx
          }
          leftPercent={
            isWide
              ? getNodePositionH(robotAtIndex, totalNodes).leftPercent
              : getNodePosition(robotAtIndex, totalNodes).leftPercent
          }
          flag={showStart ? copy.start.label : null}
        />
      )}
    </section>
  );
}
