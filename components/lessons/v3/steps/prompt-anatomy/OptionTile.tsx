"use client";

// Tap tile used by all 3 tile-pick screens of the prompt anatomy builder
// (context / constraints / format). Single-select screens render
// role=radio inside a radiogroup; the multi-select constraints screen
// renders role=checkbox. The component itself only knows how to look
// "selected" or "trap-warned" — the parent owns the selection state and
// the per-band scoring.
//
// Visual states:
//   - idle      : white surface, neutral border
//   - selected  : accent-coloured border + check icon + accent tint
//   - disabled  : 60% opacity, no interaction (post-victory)
//
// The "trap" status is intentionally NOT exposed visually until the
// learner taps — see the §7.2 micro-coaching pattern in the blueprint.

import { Check } from "lucide-react";

interface Props {
  // Single source of truth for selection state — parent decides.
  selected: boolean;
  disabled?: boolean;
  // "radio" → single-select screens (one of N). "checkbox" → multi-select.
  role: "radio" | "checkbox";
  // Used by screen readers + native semantics. ARIA value mirrors `selected`.
  label: string;
  onPick: () => void;
  // CSS var name for the accent (e.g. "var(--anatomy-context)"). Drives
  // border + check colour when selected.
  accentVar: string;
  // Child content — the tile label. Free-form so the parent can mix
  // emphasis or chips.
  children: React.ReactNode;
}

export function OptionTile({
  selected,
  disabled = false,
  role,
  label,
  onPick,
  accentVar,
  children,
}: Props) {
  return (
    <button
      type="button"
      role={role}
      aria-checked={selected}
      aria-label={label}
      onClick={onPick}
      disabled={disabled}
      className="anatomy-option-tile group relative flex w-full min-h-[64px] items-start gap-3 rounded-2xl border-2 bg-surface px-4 py-3 text-left text-sm leading-relaxed text-text-primary transition-[transform,border-color,background-color] duration-150 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
      style={{
        borderColor: selected ? accentVar : "var(--border)",
        backgroundColor: selected ? `color-mix(in srgb, ${accentVar} 7%, var(--surface))` : "var(--surface)",
        touchAction: "manipulation",
      }}
    >
      <span
        aria-hidden
        className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors"
        style={{
          borderColor: selected ? accentVar : "var(--border)",
          backgroundColor: selected ? accentVar : "transparent",
        }}
      >
        {selected && <Check size={12} color="#fff" strokeWidth={3} />}
      </span>
      <span className="flex-1">{children}</span>
    </button>
  );
}
