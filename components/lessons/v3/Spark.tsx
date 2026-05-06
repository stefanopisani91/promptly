"use client";

// Spark — Promptly's lesson mascot. Provisional artwork made of an SVG
// "spark of light" with electric dots floating around her core. The final
// version will be designed by Giuseppe; this placeholder is meant to be
// recognisable at a glance and to convey six emotional states through
// minimal shape changes (size of the core, distribution of the dots).
//
// All animation is CSS — no Lottie / no extra libs. Respects prefers-reduced-
// motion via the global rule in globals.css.

import type { CSSProperties } from "react";
import type { SparkState } from "@/types";

interface Props {
  state?: SparkState;
  size?: number;
  // Decorative by default. Pass a label only when Spark stands alone as
  // the primary visual — e.g. on the reward card.
  ariaLabel?: string;
}

const CORE_GOLD = "#F5C544";
const CORE_GOLD_BRIGHT = "#FFE07A";
const ELECTRIC = "#FFD23F";
const SHADOW = "rgba(245, 197, 68, 0.45)";

export function Spark({ state = "idle", size = 64, ariaLabel }: Props) {
  // Each state alters: core scale, glow intensity, dot count + their
  // positions. Implemented as discrete SVG markup variants below — keeping
  // the conditional logic in one place reads better than CSS-only state
  // switching when the geometry actually changes.
  const dots = DOT_LAYOUTS[state];
  const coreScale = CORE_SCALE[state];
  const glowOpacity = GLOW_OPACITY[state];

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
          position: "relative",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
        } as CSSProperties
      }
    >
      <svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        style={{ overflow: "visible" }}
      >
        <defs>
          <radialGradient id="spark-core-gradient" cx="50%" cy="45%" r="55%">
            <stop offset="0%" stopColor={CORE_GOLD_BRIGHT} />
            <stop offset="60%" stopColor={CORE_GOLD} />
            <stop offset="100%" stopColor="#E0A82E" />
          </radialGradient>
          <radialGradient id="spark-glow-gradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={ELECTRIC} stopOpacity="0.5" />
            <stop offset="80%" stopColor={ELECTRIC} stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Outer glow halo — pulses on idle/listening, expands on happy. */}
        <circle
          cx="50"
          cy="50"
          r="42"
          fill="url(#spark-glow-gradient)"
          opacity={glowOpacity}
          className="spark-halo"
        />

        {/* Electric dots — vary by state. */}
        {dots.map((dot, i) => (
          <circle
            key={i}
            cx={dot.cx}
            cy={dot.cy}
            r={dot.r}
            fill={ELECTRIC}
            className="spark-dot"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}

        {/* Core spark — slightly squashed teardrop, rotated to feel alive. */}
        <g
          transform={`translate(50 50) scale(${coreScale}) translate(-50 -50)`}
          className="spark-core"
        >
          <path
            d="M50 22
               C 56 32, 65 38, 68 50
               C 65 62, 56 68, 50 78
               C 44 68, 35 62, 32 50
               C 35 38, 44 32, 50 22 Z"
            fill="url(#spark-core-gradient)"
            stroke="#C58A14"
            strokeWidth="1.2"
            strokeLinejoin="round"
            filter={`drop-shadow(0 0 6px ${SHADOW})`}
          />
          {/* Tiny inner highlight — gives Spark a sense of dimension. */}
          <ellipse
            cx="46"
            cy="40"
            rx="3.5"
            ry="6"
            fill="#FFFFFF"
            opacity="0.55"
          />
        </g>
      </svg>

      <style jsx>{`
        .spark-mascot {
          --spark-bob-distance: 3px;
        }
        .spark-core {
          transform-origin: 50px 50px;
          animation: spark-bob 2.6s ease-in-out infinite;
        }
        .spark-halo {
          transform-origin: 50px 50px;
          animation: spark-halo-pulse 2.6s ease-in-out infinite;
        }
        .spark-dot {
          transform-origin: 50px 50px;
          animation: spark-dot-pulse 1.8s ease-in-out infinite;
        }

        /* THINKING — slight tilt + faster dots */
        .spark-thinking .spark-core {
          animation: spark-think 2.2s ease-in-out infinite;
        }
        .spark-thinking .spark-dot {
          animation-duration: 1.1s;
        }

        /* HAPPY — bigger, faster bob, brighter halo */
        .spark-happy .spark-core {
          animation: spark-happy-bob 0.9s ease-in-out infinite;
        }
        .spark-happy .spark-dot {
          animation: spark-dot-dance 1.1s ease-in-out infinite;
        }

        /* SURPRISED — burst pose followed by a gentle breathing settle so
           Spark stays alive while the user reads a principle card. The
           keyframes peak at ~15% (the burst), ease back to the resting
           1.08 scale, then bob softly for the rest of the cycle. */
        .spark-surprised .spark-core {
          animation: spark-surprised 3.6s ease-in-out infinite;
        }
        .spark-surprised .spark-dot {
          animation: spark-dot-burst 1.4s ease-out infinite;
        }

        /* SAD — drooped, slower */
        .spark-sad .spark-core {
          animation: spark-sad 3.4s ease-in-out infinite;
        }
        .spark-sad .spark-dot {
          opacity: 0.35;
          animation-duration: 3s;
        }

        /* LISTENING — leaning forward, dots pull together */
        .spark-listening .spark-core {
          animation: spark-listen 2s ease-in-out infinite;
        }

        @keyframes spark-bob {
          0%, 100% {
            transform: translate(50px, 50px) scale(1) translate(-50px, -50px) translateY(0);
          }
          50% {
            transform: translate(50px, 50px) scale(1) translate(-50px, -50px)
              translateY(calc(-1 * var(--spark-bob-distance)));
          }
        }
        @keyframes spark-halo-pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.08);
            opacity: 1.1;
          }
        }
        @keyframes spark-dot-pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 0.85;
          }
          50% {
            transform: scale(1.25);
            opacity: 1;
          }
        }
        @keyframes spark-think {
          0%, 100% {
            transform: rotate(-4deg) translateY(0);
          }
          50% {
            transform: rotate(4deg) translateY(-2px);
          }
        }
        @keyframes spark-happy-bob {
          0%, 100% {
            transform: translateY(0) scale(1);
          }
          50% {
            transform: translateY(-6px) scale(1.05);
          }
        }
        @keyframes spark-dot-dance {
          0%, 100% {
            transform: scale(1) rotate(0);
            opacity: 1;
          }
          50% {
            transform: scale(1.4) rotate(15deg);
            opacity: 1;
          }
        }
        @keyframes spark-surprised {
          0% {
            transform: scale(1) translateY(0);
          }
          15% {
            transform: scale(1.18) translateY(-2px);
          }
          30% {
            transform: scale(1.08) translateY(0);
          }
          65% {
            transform: scale(1.08) translateY(-3px);
          }
          100% {
            transform: scale(1.08) translateY(0);
          }
        }
        @keyframes spark-dot-burst {
          0% {
            transform: scale(0.6) translate(0, 0);
            opacity: 1;
          }
          80% {
            transform: scale(1.6) translate(var(--burst-x, 6px), var(--burst-y, -8px));
            opacity: 0.6;
          }
          100% {
            transform: scale(1) translate(0, 0);
            opacity: 1;
          }
        }
        @keyframes spark-sad {
          0%, 100% {
            transform: rotate(-6deg) translateY(2px);
          }
          50% {
            transform: rotate(-4deg) translateY(0);
          }
        }
        @keyframes spark-listen {
          0%, 100% {
            transform: rotate(8deg) translateY(0);
          }
          50% {
            transform: rotate(8deg) translateY(-1px);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .spark-core,
          .spark-halo,
          .spark-dot {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}

interface Dot {
  cx: number;
  cy: number;
  r: number;
}

const DOT_LAYOUTS: Record<SparkState, Dot[]> = {
  idle: [
    { cx: 18, cy: 28, r: 2.4 },
    { cx: 84, cy: 30, r: 2.0 },
    { cx: 22, cy: 78, r: 2.2 },
    { cx: 80, cy: 76, r: 2.4 },
  ],
  thinking: [
    { cx: 16, cy: 24, r: 1.8 },
    { cx: 86, cy: 22, r: 2.2 },
    { cx: 24, cy: 84, r: 1.6 },
    { cx: 78, cy: 82, r: 1.8 },
    { cx: 92, cy: 50, r: 2.0 },
  ],
  happy: [
    { cx: 12, cy: 22, r: 2.8 },
    { cx: 88, cy: 24, r: 2.6 },
    { cx: 18, cy: 78, r: 2.4 },
    { cx: 84, cy: 82, r: 2.8 },
    { cx: 50, cy: 14, r: 2.0 },
    { cx: 50, cy: 90, r: 2.2 },
  ],
  surprised: [
    { cx: 8, cy: 18, r: 3.0 },
    { cx: 92, cy: 18, r: 3.0 },
    { cx: 4, cy: 50, r: 2.4 },
    { cx: 96, cy: 50, r: 2.4 },
    { cx: 16, cy: 88, r: 3.0 },
    { cx: 84, cy: 88, r: 3.0 },
    { cx: 50, cy: 6, r: 2.4 },
  ],
  sad: [
    { cx: 26, cy: 80, r: 1.6 },
    { cx: 74, cy: 82, r: 1.6 },
  ],
  listening: [
    { cx: 78, cy: 32, r: 2.4 },
    { cx: 84, cy: 50, r: 2.6 },
    { cx: 78, cy: 70, r: 2.4 },
    { cx: 22, cy: 62, r: 1.8 },
  ],
};

const CORE_SCALE: Record<SparkState, number> = {
  idle: 1,
  thinking: 0.96,
  happy: 1.08,
  surprised: 1.14,
  sad: 0.9,
  listening: 1.02,
};

const GLOW_OPACITY: Record<SparkState, number> = {
  idle: 1,
  thinking: 0.85,
  happy: 1.2,
  surprised: 1.3,
  sad: 0.6,
  listening: 1,
};
