"use client";

// Spark — Promptly's lesson mascot.
// Renders public/spark.png via a plain <img> tag (no next/image cache).
// All six emotional states are expressed through CSS-only animations
// applied to the wrapper div — no Lottie, no GSAP, no Framer Motion.
// Respects prefers-reduced-motion via the @media block at the bottom.

import type { CSSProperties } from "react";
import type { SparkState } from "@/types";

interface Props {
  state?: SparkState;
  size?: number;
  // Decorative by default. Pass a label only when Spark stands alone as
  // the primary visual — e.g. on the reward card.
  ariaLabel?: string;
}

export function Spark({ state = "idle", size = 64, ariaLabel }: Props) {
  return (
    <div
      className={`spark-mascot spark-${state}`}
      role={ariaLabel ? "img" : undefined}
      aria-label={ariaLabel}
      aria-hidden={ariaLabel ? undefined : true}
      style={
        {
          width: size,
          height: size,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        } as CSSProperties
      }
    >
      {/* Plain <img> — bypasses next/image cache, always serves fresh PNG */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/spark.png"
        alt={ariaLabel ?? ""}
        aria-hidden={ariaLabel ? undefined : true}
        width={size}
        height={size}
        style={{
          width: size,
          height: size,
          objectFit: "contain",
          display: "block",
        }}
      />

      <style jsx>{`
        /* ── BASE ─────────────────────────────────────────────────────── */
        .spark-mascot {
          --spark-bob-distance: 4px;
        }

        /* ── IDLE: gentle vertical bob ────────────────────────────────── */
        .spark-idle {
          animation: spark-bob 2.6s ease-in-out infinite;
        }

        /* ── THINKING: tilt left ↔ right + bob ───────────────────────── */
        .spark-thinking {
          animation: spark-think 2.2s ease-in-out infinite;
        }

        /* ── HAPPY: faster bob + slight scale-up ─────────────────────── */
        .spark-happy {
          animation: spark-happy-bob 0.9s ease-in-out infinite;
        }

        /* ── SURPRISED: burst scale, then settle + breathe ───────────── */
        .spark-surprised {
          animation: spark-surprised 3.6s ease-in-out infinite;
        }

        /* ── SAD: tilt left + very slow bob + reduced opacity ─────────── */
        .spark-sad {
          animation: spark-sad 3.4s ease-in-out infinite;
          opacity: 0.75;
        }

        /* ── LISTENING: lean right + gentle bob ──────────────────────── */
        .spark-listening {
          animation: spark-listen 2s ease-in-out infinite;
        }

        /* ── KEYFRAMES ────────────────────────────────────────────────── */
        @keyframes spark-bob {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(calc(-1 * var(--spark-bob-distance))); }
        }

        @keyframes spark-think {
          0%, 100% { transform: rotate(-4deg) translateY(0); }
          50%       { transform: rotate(4deg)  translateY(-2px); }
        }

        @keyframes spark-happy-bob {
          0%, 100% { transform: translateY(0)   scale(1); }
          50%       { transform: translateY(-6px) scale(1.07); }
        }

        @keyframes spark-surprised {
          0%    { transform: scale(1)    translateY(0); }
          15%   { transform: scale(1.18) translateY(-4px); }
          30%   { transform: scale(1.06) translateY(0); }
          65%   { transform: scale(1.06) translateY(-3px); }
          100%  { transform: scale(1.06) translateY(0); }
        }

        @keyframes spark-sad {
          0%, 100% { transform: rotate(-6deg) translateY(2px); }
          50%       { transform: rotate(-4deg) translateY(0); }
        }

        @keyframes spark-listen {
          0%, 100% { transform: rotate(8deg)  translateY(0); }
          50%       { transform: rotate(8deg)  translateY(-1px); }
        }

        /* ── REDUCED MOTION ───────────────────────────────────────────── */
        @media (prefers-reduced-motion: reduce) {
          .spark-mascot {
            animation: none !important;
            opacity: 1 !important;
          }
        }
      `}</style>
    </div>
  );
}
