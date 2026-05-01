"use client";

// Hex-shaped bonus badge with neon radar pulse — the futuristic side-quest
// marker that floats in the concave spaces of the spine. Replaces the old
// MapBonusIsland in the new map design.
//
// Visual: dark hex shell with neon stroke, BONUS eyebrow, and either a
// gold star (unlocked) or a vault lock (locked). A radar pulse ripples
// outward to draw the eye.

import { useState } from "react";

import type { BonusPath, Lang, UnlockState } from "@/types";
import { describeUnlockState, getBonusPathsCopy } from "@/lib/i18n/bonus-paths";
import { getMapCopy } from "@/lib/i18n/map";

import { MapNodeDetailsModal, type NodeModalContent } from "./MapNodeDetailsModal";

interface Props {
  bonus: BonusPath;
  unlock: UnlockState;
  lang: Lang;
  /** y in CSS px relative to section top. */
  topPx: number;
  /** x in % of section width. */
  leftPercent: number;
  /** Per-biome neon stroke color (hex or CSS var). */
  neonColor: string;
}

export function MapBonusBadge({
  bonus,
  unlock,
  lang,
  topPx,
  leftPercent,
  neonColor,
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

  // Unique gradient ids per slug to avoid SVG def collisions.
  const bgId = `bonus-bg-${bonus.slug}`;
  const goldId = `bonus-gold-${bonus.slug}`;

  return (
    <>
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className="absolute z-10 transition-transform hover:scale-110"
        style={{
          top: topPx,
          left: `${leftPercent}%`,
          transform: "translate(-50%, -50%)",
        }}
        aria-label={`${mapCopy.legend.bonus} — ${title}`}
      >
        <span className="relative inline-block h-[72px] w-[64px]">
          {/* Radar pulse — neon ring rippling outward */}
          <span
            className="map-bonus-radar pointer-events-none absolute inset-1 rounded-full"
            style={{
              border: `2px solid ${neonColor}`,
              filter: `drop-shadow(0 0 6px ${neonColor})`,
            }}
            aria-hidden
          />
          {/* Hex shell */}
          <svg
            viewBox="0 0 64 72"
            width="64"
            height="72"
            className="absolute inset-0"
          >
            <defs>
              <linearGradient id={bgId} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0" stopColor="#1B1F23" />
                <stop offset="1" stopColor="#0B0D10" />
              </linearGradient>
              <linearGradient id={goldId} x1="0" x2="1" y1="0" y2="1">
                <stop offset="0" stopColor="#FFD27A" />
                <stop offset="1" stopColor="#B69337" />
              </linearGradient>
            </defs>
            {/* outer hex */}
            <polygon
              points="32,2 60,18 60,54 32,70 4,54 4,18"
              fill={`url(#${bgId})`}
              stroke={neonColor}
              strokeWidth="1.6"
              style={{
                filter: `drop-shadow(0 0 5px ${neonColor}) drop-shadow(0 4px 8px rgba(0,0,0,.35))`,
              }}
            />
            {/* inner hex outline */}
            <polygon
              points="32,9 53,21 53,51 32,63 11,51 11,21"
              fill="none"
              stroke={neonColor}
              strokeWidth="0.8"
              opacity="0.45"
            />
            {/* corner ticks */}
            <g stroke={neonColor} strokeWidth="1.2" opacity="0.85">
              <line x1="32" y1="2" x2="32" y2="6" />
              <line x1="32" y1="66" x2="32" y2="70" />
              <line x1="6" y1="20" x2="10" y2="22" />
              <line x1="58" y1="20" x2="54" y2="22" />
              <line x1="6" y1="52" x2="10" y2="50" />
              <line x1="58" y1="52" x2="54" y2="50" />
            </g>
            {/* center glyph */}
            {isUnlocked ? (
              <g transform="translate(32 38)">
                <path
                  d="M0,-11 L3,-3 L11,-3 L4.5,2 L7,10 L0,5 L-7,10 L-4.5,2 L-11,-3 L-3,-3 Z"
                  fill={`url(#${goldId})`}
                  stroke="#FFE9B5"
                  strokeWidth="0.8"
                />
              </g>
            ) : (
              <g transform="translate(32 38)">
                <rect
                  x="-8"
                  y="-3"
                  width="16"
                  height="13"
                  rx="2"
                  fill="#F4EDE4"
                  stroke="#1B1F23"
                  strokeWidth="1"
                />
                <path
                  d="M -5 -3 V -7 a 5 5 0 0 1 10 0 V -3"
                  fill="none"
                  stroke="#F4EDE4"
                  strokeWidth="2"
                />
                <circle cx="0" cy="3" r="1.6" fill="#1B1F23" />
              </g>
            )}
            {/* labels */}
            <text
              x="32"
              y="22"
              textAnchor="middle"
              fontFamily="ui-monospace, 'JetBrains Mono', monospace"
              fontSize="6.5"
              fontWeight="700"
              fill={neonColor}
              letterSpacing="0.2em"
              opacity="0.95"
            >
              BONUS
            </text>
          </svg>
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
