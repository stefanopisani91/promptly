"use client";

// Client-side shell for DailyGoalCard.
// Handles: SVG ring mount animation, count-up for the center number,
// confetti burst when the daily goal is reached, and the green
// background transition.
//
// All text that depends on i18n functions is pre-computed server-side
// in DailyGoalCard.tsx and passed as plain strings here, so this
// component only receives serializable props.

import { useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";

interface Props {
  pct: number;
  minutesToday: number;
  reached: boolean;
  eyebrow: string;
  statusLabel: string;
  minutesDoneLabel: string;
}

const RING_SIZE = 108;
const STROKE_WIDTH = 10;
const RADIUS = (RING_SIZE - STROKE_WIDTH) / 2;
const CIRC = 2 * Math.PI * RADIUS;

function useCountUp(target: number, duration = 900, delay = 80) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (target === 0) {
      setValue(0);
      return;
    }
    const startTimer = setTimeout(() => {
      const startTime = performance.now();
      const tick = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // ease-out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        setValue(Math.round(target * eased));
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, delay);
    return () => clearTimeout(startTimer);
  }, [target, duration, delay]);
  return value;
}

export function DailyGoalInteractive({
  pct,
  minutesToday,
  reached,
  eyebrow,
  statusLabel,
  minutesDoneLabel,
}: Props) {
  // Animate ring from empty → real value on mount
  const dashTarget = CIRC * (1 - pct);
  const [animatedOffset, setAnimatedOffset] = useState(CIRC);
  const cardRef = useRef<HTMLDivElement>(null);
  const [hasShot, setHasShot] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setAnimatedOffset(dashTarget), 100);
    return () => clearTimeout(t);
  }, [dashTarget]);

  // Count-up for the minutes number in the ring center
  const displayMinutes = useCountUp(minutesToday, 950, 200);

  // Confetti burst when goal is reached (fires once per session)
  useEffect(() => {
    if (!reached || hasShot) return;
    setHasShot(true);
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (rect.left + rect.width / 2) / window.innerWidth;
    const y = (rect.top + rect.height / 2) / window.innerHeight;
    confetti({
      particleCount: 55,
      spread: 52,
      origin: { x, y },
      colors: ["#E8703F", "#EAB308", "#16A34A", "#ffffff"],
      scalar: 0.85,
      ticks: 220,
    });
  }, [reached, hasShot]);

  const ringStroke = reached ? "var(--success)" : "var(--primary)";
  const centerFill = reached ? "var(--success)" : "var(--text-primary)";

  return (
    <div
      ref={cardRef}
      className={`flex items-center gap-4 rounded-2xl border border-border p-5 shadow-sm transition-colors duration-700 sm:p-6 ${
        reached ? "bg-success-light" : "bg-surface"
      }`}
    >
      <svg
        width={RING_SIZE}
        height={RING_SIZE}
        viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
        className="shrink-0"
        aria-hidden
      >
        {/* Track */}
        <circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="var(--surface-muted)"
          strokeWidth={STROKE_WIDTH}
        />
        {/* Animated fill */}
        <circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke={ringStroke}
          strokeWidth={STROKE_WIDTH}
          strokeLinecap="round"
          strokeDasharray={CIRC}
          strokeDashoffset={animatedOffset}
          transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
          style={{
            transition:
              "stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1), stroke 0.5s ease",
          }}
        />
        {/* Center: count-up minutes */}
        <text
          x={RING_SIZE / 2}
          y={RING_SIZE / 2 + 2}
          textAnchor="middle"
          fontSize="22"
          fontWeight="700"
          fontFamily="var(--font-heading)"
          fill={centerFill}
          style={{ transition: "fill 0.5s ease" }}
        >
          {displayMinutes}
        </text>
        <text
          x={RING_SIZE / 2}
          y={RING_SIZE / 2 + 20}
          textAnchor="middle"
          fontSize="9"
          letterSpacing="1.4"
          fontWeight="600"
          fill="var(--text-muted)"
        >
          {minutesDoneLabel}
        </text>
      </svg>

      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-text-muted">
          {eyebrow}
        </p>
        <p className="mt-1 font-heading text-lg font-bold leading-tight text-text-primary">
          {statusLabel}
        </p>
        {reached && (
          <p className="mt-1 text-xs font-semibold text-success">
            ✓ Obiettivo raggiunto
          </p>
        )}
      </div>
    </div>
  );
}
