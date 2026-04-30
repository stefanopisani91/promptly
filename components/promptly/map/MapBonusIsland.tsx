"use client";

import { useState } from "react";
import { Lock, Star } from "lucide-react";

import { cn } from "@/lib/utils";
import type { BonusPath, Lang, UnlockState } from "@/types";
import { describeUnlockState, getBonusPathsCopy } from "@/lib/i18n/bonus-paths";
import { getMapCopy } from "@/lib/i18n/map";

import { MapNodeDetailsModal, type NodeModalContent } from "./MapNodeDetailsModal";

interface Props {
  bonus: BonusPath;
  unlock: UnlockState;
  // Same reasoning as MapNode: only `lang` crosses the RSC boundary, and
  // i18n copy is resolved on the client. MapCopy contains function fields
  // that can't be serialized.
  lang: Lang;
  side: "left" | "right";
  /** y position relative to section bottom, in px. */
  bottomPx: number;
  /** y of the spine node it branches off — used to draw the bridge. */
  spineNodeBottomPx: number;
  /** x of the spine node, in % of section width. */
  spineNodeLeftPercent: number;
  /** Anchor lesson index (0-based) — used purely for keying. */
  anchorIndex: number;
}

const ISLAND_WIDTH_PX = 124;

export function MapBonusIsland({
  bonus,
  unlock,
  lang,
  side,
  bottomPx,
  spineNodeBottomPx,
  spineNodeLeftPercent,
}: Props) {
  void spineNodeBottomPx;
  void spineNodeLeftPercent;
  const [modalOpen, setModalOpen] = useState(false);
  const mapCopy = getMapCopy(lang);
  const bonusCopy = getBonusPathsCopy(lang);
  const title = lang === "it" ? bonus.title_it : bonus.title_en;
  const description = lang === "it" ? bonus.description_it : bonus.description_en;

  const isUnlocked = unlock.unlocked;
  const isPublished = bonus.is_published;

  const stateLabel = isUnlocked
    ? bonusCopy.badge.unlocked
    : describeUnlockState(unlock, bonusCopy);

  const modalContent: NodeModalContent = {
    eyebrow: mapCopy.modal.bonusEyebrow,
    title,
    body: isUnlocked
      ? isPublished
        ? mapCopy.modal.bonusUnlockedSub
        : mapCopy.modal.bonusUnlockedComingSoon
      : `${mapCopy.modal.bonusLockedSub}\n\n${stateLabel}`,
    stat: description,
    primary:
      isUnlocked && isPublished
        ? { label: mapCopy.modal.bonusGoCta, href: `/path/${bonus.slug}` }
        : null,
    tone: "bonus",
  };

  const sideStyle: React.CSSProperties =
    side === "left"
      ? { left: 8, transform: "translateY(50%)" }
      : { right: 8, transform: "translateY(50%)" };

  return (
    <>
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className={cn(
          "absolute z-10 flex flex-col items-center gap-1 rounded-2xl border-2 border-dashed bg-[var(--bioma-bonus-bg)] px-3 py-2 text-center transition-transform hover:scale-105",
          isUnlocked ? "border-[var(--bioma-bonus-accent)]" : "border-[var(--bioma-bonus-bg-deep)] opacity-80",
        )}
        style={{
          width: ISLAND_WIDTH_PX,
          bottom: bottomPx,
          ...sideStyle,
        }}
        aria-label={`${mapCopy.legend.bonus} — ${title}`}
      >
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full",
            isUnlocked ? "bg-[var(--bioma-bonus-accent)] text-white" : "bg-surface text-text-muted",
          )}
        >
          {isUnlocked ? (
            <Star className="h-5 w-5" strokeWidth={2.5} aria-hidden />
          ) : (
            <Lock className="h-4 w-4" aria-hidden />
          )}
        </div>
        <span className="line-clamp-2 font-heading text-[11px] font-bold leading-tight text-text-primary">
          {title}
        </span>
        <span className="text-[10px] font-medium uppercase tracking-wide text-[var(--bioma-bonus-accent)]">
          {bonus.tier === "pro" ? bonusCopy.badge.pro : bonusCopy.badge.bonus}
        </span>
      </button>

      {modalOpen && (
        <MapNodeDetailsModal
          content={modalContent}
          onClose={() => setModalOpen(false)}
          closeAria={mapCopy.modal.closeAria}
        />
      )}
    </>
  );
}
