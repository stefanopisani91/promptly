"use client";

// Pre-written thought bubbles that float around Spark on each step. Tap to
// expand a short label (3-7 words) into the full quote (max 30 words).
//
// Layout: the (max 3) vignettes orbit Spark on a horizontal 3D ring,
// driven by the `vignette-orbit` keyframes in globals.css. The orbit
// runs on every viewport — radius and chip size shrink on narrow
// screens via CSS variables (`--orbit-rx`/`--orbit-ry`) and the
// `.vignette-orbit-chip` mobile media query. The wrapper pauses the
// animation on hover so the user can read mid-orbit; respects
// prefers-reduced-motion via the global rule.

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import type { Vignette } from "@/types";

interface Props {
  vignettes: Vignette[];
  closeLabel: string;
}

// Desktop runs the 3D ring orbit — see globals.css `vignette-orbit`.
// Each bubble is anchored at Spark's centre (top:50% / left:50% with
// margins to recentre) and the keyframe drives the `translate + scale +
// z-index` cycle. animation-delay staggers chips evenly across the
// cycle based on the actual count so 1 chip orbits alone, 2 chips sit
// exactly opposite (180°) and 3 chips form a 120° triangle — never
// bunched, never aligned.
const ORBIT_DURATION_S = 28;
const MAX_ORBIT_VIGNETTES = 3;

function orbitDelaySeconds(index: number, total: number): number {
  if (total <= 0) return 0;
  return -((ORBIT_DURATION_S / total) * index);
}

export function VignetteCloud({ vignettes, closeLabel }: Props) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const trimmed = vignettes.slice(0, MAX_ORBIT_VIGNETTES);

  useEffect(() => {
    if (activeIndex === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setActiveIndex(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeIndex]);

  return (
    <>
      {/* Each bubble orbits Spark on a horizontal ring. The wrapper
          carries the hover-pause hook (see globals.css
          `vignette-orbit-wrapper:hover`) — and crucially must NOT
          create its own stacking context, otherwise the chips' z-index
          would be confined inside the wrapper and Spark (z=2 on the
          sibling above) would always cover them. So no `perspective`,
          no `transform-style`, no `z-index` on this wrapper — chips'
          z-indices live in the same stacking context as Spark, which is
          the only way front chips can occlude her. pointer-events
          stays on the chips themselves so the rest of the header stays
          fully clickable through the empty orbit area. */}
      <div className="vignette-orbit-wrapper pointer-events-none absolute inset-0">
        {trimmed.map((v, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setActiveIndex(i)}
            className="vignette-orbit-item vignette-orbit-chip pointer-events-auto"
            style={{
              animationDelay: `${orbitDelaySeconds(i, trimmed.length)}s`,
            }}
            aria-label={`${v.short} — ${closeLabel}`}
          >
            {v.short}
          </button>
        ))}
      </div>

      {/* Expanded overlay — same component on desktop and mobile. */}
      {activeIndex !== null && (
        <ExpandedVignette
          vignette={trimmed[activeIndex]}
          onClose={() => setActiveIndex(null)}
          closeLabel={closeLabel}
        />
      )}
    </>
  );
}

function ExpandedVignette({
  vignette,
  onClose,
  closeLabel,
}: {
  vignette: Vignette;
  onClose: () => void;
  closeLabel: string;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    closeRef.current?.focus();
  }, []);
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={vignette.short}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      {/* Backdrop as its own button so click-to-close is keyboard-accessible
          (Escape also closes via the keydown listener above). */}
      <button
        type="button"
        aria-label={closeLabel}
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(15, 18, 24, 0.45)",
          backdropFilter: "blur(2px)",
          border: "none",
          cursor: "pointer",
        }}
      />
      <div
        style={{
          background: "#FFFFFF",
          borderRadius: 16,
          padding: "24px 22px 18px",
          maxWidth: 360,
          width: "100%",
          boxShadow: "0 20px 40px rgba(0,0,0,0.18)",
          position: "relative",
        }}
      >
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label={closeLabel}
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            width: 32,
            height: 32,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            background: "transparent",
            border: "none",
            color: "var(--text-muted)",
            cursor: "pointer",
            borderRadius: 999,
          }}
        >
          <X size={18} />
        </button>
        <p
          style={{
            fontStyle: "italic",
            fontSize: 15,
            lineHeight: 1.55,
            color: "var(--text-primary)",
            margin: 0,
            paddingRight: 24,
          }}
        >
          “{vignette.full}”
        </p>
      </div>
    </div>
  );
}
