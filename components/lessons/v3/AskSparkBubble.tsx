"use client";

// "Chiedi a Spark" — small static bubble anchored to Spark's bottom-right
// in SparkHeader. Replaces the bottom-of-screen floating launcher we used
// to render. Sits alongside the orbiting vignettes so the chat affordance
// is visually part of "Spark's brain", not a UI control bolted onto the
// page (Promptly_Spark_Master_Configuration.md §2, "Sessione 2").
//
// Visual contract:
//   - Gold ring + white "?" icon — uses --xp-gold so it reads as "live
//     light" (Spark's own colour family) instead of a generic system
//     control. Slightly different hue from the orbit chips so the user
//     can tell it's a different kind of thing.
//   - Slow pulse animation (2.4s) — slower than the 28s orbit cycle to
//     keep visual hierarchy clean: orbit = constant motion, bubble =
//     gentle invitation. Honours prefers-reduced-motion.
//   - Tooltip / aria-label includes the remaining/limit counter so the
//     user knows the quota state without opening the modal.
//
// Disabled state: when remaining <= 0 the button is disabled and the
// tooltip flips to the quota-exhausted copy. The chat modal can't be
// opened from a stale state.

import { HelpCircle } from "lucide-react";

interface Props {
  onOpen: () => void;
  remaining: number;
  limit: number;
  /** Tooltip / aria-label when there are messages left ("Chiedi a Spark"). */
  label: string;
  /** Tooltip / aria-label when remaining === 0. */
  exhaustedLabel: string;
}

export function AskSparkBubble({
  onOpen,
  remaining,
  limit,
  label,
  exhaustedLabel,
}: Props) {
  const isExhausted = remaining <= 0;
  const tooltip = isExhausted
    ? exhaustedLabel
    : `${label} · ${remaining}/${limit}`;
  return (
    <button
      type="button"
      onClick={onOpen}
      disabled={isExhausted}
      aria-label={tooltip}
      title={tooltip}
      className="ask-spark-bubble absolute z-[5] inline-flex h-7 w-7 items-center justify-center rounded-full text-white shadow-md transition-transform hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-deep disabled:opacity-50"
      style={{
        // Anchor to Spark's bottom-right just outside the 48px frame so
        // it reads as "attached to Spark" without overlapping her face.
        bottom: "-6px",
        right: "-10px",
        background: "var(--xp-gold)",
        border: "1.5px solid #fff",
      }}
    >
      <HelpCircle size={14} strokeWidth={2.5} aria-hidden="true" />
    </button>
  );
}
