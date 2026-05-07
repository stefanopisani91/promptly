"use client";

// Reusable card-grid picker. Originally extracted from Lesson 2's
// CLAUDE.md project chooser (Lezione2_Blueprint.md §13b), but the
// shape is generic on purpose — Path 1 future lessons will reuse it
// for "pick a topic / pick a stack / pick an exercise variant" flows.
//
// Animations are all CSS-only (keyframes in globals.css → option-card-*),
// matching the rest of the V3 lesson surface (step-slide-fwd,
// principle-headline, claudemd-editor-shake). No framer-motion dep — the
// tradeoff is documented in the file header for the next person who's
// tempted to add it.
//
// Behavioural rules:
//   - Idle (nothing picked yet, pulseIdle=true): all cards share a synced
//     4s pulse, signalling "pick one of us".
//   - Hover (when not selected): border tints brand orange, icon nudges,
//     bg gets a faint warm wash. Hover on a selected card is a no-op
//     (the choice has landed; no need to re-invite).
//   - Selected: scale 1.02 stable, brand-orange 2px border, inset glow.
//     Pulse stops on every card the moment any card is selected.
//   - On a fresh selection: the new card plays a one-shot bounce
//     (option-card-bounce-in, 350ms). Re-selecting the same card does
//     nothing (no animation re-trigger).
//
// Accessibility:
//   - aria-pressed mirrors selection state.
//   - Focus ring uses brand primary with offset.
//   - prefers-reduced-motion is respected via globals.css overrides
//     (idle pulse off, hover icon nudge off, bounce instantaneous).

import { useEffect, useRef, useState } from "react";

export interface OptionCardItem {
  // Stable id — what comes back via onSelect, what selected matches.
  id: string;
  // Single visible glyph above the title (emoji or one-char label).
  icon: string;
  title: string;
  description: string;
}

interface Props {
  options: OptionCardItem[];
  selected: string | null;
  onSelect: (id: string) => void;
  // When true (default) and nothing is selected, all cards pulse in sync.
  // Set false in contexts where the pulsing affordance would be noisy
  // (e.g. inside a modal that already has a focused element).
  pulseIdle?: boolean;
  // Lock state — cards can't be picked but stay visible (e.g. once the
  // exercise has been finalised). Selected card keeps its visual.
  disabled?: boolean;
  ariaLabel?: string;
}

export function OptionCardSelector({
  options,
  selected,
  onSelect,
  pulseIdle = true,
  disabled = false,
  ariaLabel,
}: Props) {
  // Track the most recent selection so we can play the one-shot bounce on
  // the new card without re-triggering it on every render. Keyed by id; we
  // clear it after the animation duration so a future re-pick of the same
  // option still bounces.
  const [bouncingId, setBouncingId] = useState<string | null>(null);
  const bounceTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (bounceTimer.current !== null) {
        window.clearTimeout(bounceTimer.current);
      }
    };
  }, []);

  function handleSelect(id: string) {
    if (disabled) return;
    if (id === selected) {
      // Re-clicking the same card: no state change, no bounce.
      return;
    }
    onSelect(id);
    setBouncingId(id);
    if (bounceTimer.current !== null) {
      window.clearTimeout(bounceTimer.current);
    }
    bounceTimer.current = window.setTimeout(() => {
      setBouncingId(null);
      bounceTimer.current = null;
    }, 380);
  }

  const showIdlePulse = pulseIdle && !selected && !disabled;

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="grid grid-cols-1 gap-3 sm:grid-cols-3"
    >
      {options.map((option) => {
        const isSelected = selected === option.id;
        const isBouncing = bouncingId === option.id;
        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            // a radio uses aria-checked exclusively — aria-pressed is for
            // toggle buttons and conflicts with the radio role (lint rule
            // jsx-a11y/role-supports-aria-props). The brief asked for
            // aria-pressed; aria-checked is the correct alternative for
            // a single-select group like this one.
            aria-checked={isSelected}
            onClick={() => handleSelect(option.id)}
            disabled={disabled}
            className={`option-card group relative flex h-full flex-col gap-2 rounded-2xl border p-4 text-left transition-[transform,border-color,background-color,box-shadow] duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
              isSelected
                ? "option-card-selected border-2 border-primary bg-primary-light scale-[1.02]"
                : "border border-border bg-surface hover:border-primary/60 hover:bg-primary-light/40 hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
            } ${
              showIdlePulse && !isSelected ? "option-card-idle-pulse" : ""
            } ${isBouncing ? "option-card-bounce-in" : ""} ${
              disabled ? "cursor-default opacity-90" : "cursor-pointer"
            }`}
            style={
              isSelected
                ? // Inset glow stays here so it composes correctly with
                  // the hover shadow on non-selected siblings.
                  { boxShadow: "inset 0 0 12px rgba(232, 112, 63, 0.15)" }
                : undefined
            }
          >
            <span
              aria-hidden
              className={`option-card-icon text-2xl transition-transform duration-200 ${
                isSelected ? "scale-[1.05]" : "group-hover:scale-[1.05] group-hover:rotate-2"
              }`}
            >
              {option.icon}
            </span>
            <span className="font-heading text-base font-semibold text-text-primary">
              {option.title}
            </span>
            <span className="text-sm text-text-secondary">
              {option.description}
            </span>
          </button>
        );
      })}
    </div>
  );
}
