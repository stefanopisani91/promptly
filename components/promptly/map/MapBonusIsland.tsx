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
  lang: Lang;
  /** y position relative to section bottom, in px (from layout helper). */
  bottomPx: number;
  /** Horizontal position as a percentage of section width. */
  leftPercent: number;
}

export function MapBonusIsland({
  bonus,
  unlock,
  lang,
  bottomPx,
  leftPercent,
}: Props) {
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

  return (
    <>
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className={cn(
          "absolute z-10 flex h-12 w-12 items-center justify-center rounded-2xl border-2 transition-transform hover:scale-110 sm:h-14 sm:w-14",
          isUnlocked
            ? "border-[var(--bioma-bonus-accent)] bg-[var(--bioma-bonus-bg)] shadow-md"
            : "border-dashed border-[var(--bioma-bonus-bg-deep)] bg-[var(--bioma-bonus-bg)]/80 opacity-90",
        )}
        style={{
          bottom: bottomPx,
          left: `${leftPercent}%`,
          transform: "translate(-50%, 50%)",
        }}
        aria-label={`${mapCopy.legend.bonus} — ${title}`}
      >
        {isUnlocked ? (
          <Star
            className="h-6 w-6"
            strokeWidth={2.5}
            fill="var(--bioma-bonus-accent)"
            color="var(--bioma-bonus-accent)"
            aria-hidden
          />
        ) : (
          <Lock
            className="h-5 w-5 text-[var(--bioma-bonus-accent)]"
            strokeWidth={2.5}
            aria-hidden
          />
        )}
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
