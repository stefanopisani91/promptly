"use client";

// Single radio option used by STEP 3, 4, 7, 8. Visual: rounded card with
// emoji + label + radio bullet. Selected state adds a primary ring; hover
// nudges the border to primary-tint.

import type { ChangeEvent } from "react";
import { cn } from "@/lib/utils";

interface Props {
  name: string;
  value: string;
  active: boolean;
  emoji?: string;
  label: string;
  description?: string;
  disabled?: boolean;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}

export function ChoiceCard({
  name,
  value,
  active,
  emoji,
  label,
  description,
  disabled,
  onChange,
}: Props) {
  return (
    <label
      className={cn(
        // Base: layout + 200ms ease-out so border, bg AND transform
        // animate together (was just `transition-all` with no duration,
        // browser-default 0ms in some cases).
        "group flex cursor-pointer items-start gap-4 rounded-2xl border bg-surface px-5 py-4 transition-all duration-200 ease-out",
        // Selected vs idle. Idle gets the brand-orange border and a faint
        // tint preview on hover to signal "click me".
        active
          ? "border-primary shadow-[0_0_0_4px_rgba(232,112,63,0.12)]"
          : "border-border hover:border-primary hover:bg-primary-light/30",
        // Tactile feedback. Same recipe as the tag-cloud cards in Step 6.
        // prefers-reduced-motion users see only the colour transitions.
        !disabled &&
          "hover:scale-[1.02] active:scale-[0.98] motion-reduce:hover:scale-100 motion-reduce:active:scale-100",
        // The visible focus ring is on the label; the actual focus lives
        // on the inner radio input. focus-within bridges them so keyboard
        // navigation lights up the same orange ring as PrimaryCta.
        "focus-within:outline-none focus-within:ring-2 focus-within:ring-primary/40 focus-within:ring-offset-2 focus-within:ring-offset-background",
        disabled && "cursor-not-allowed opacity-60",
      )}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={active}
        disabled={disabled}
        onChange={onChange}
        className="sr-only"
      />
      {emoji ? (
        <span aria-hidden="true" className="mt-0.5 text-2xl leading-none">
          {emoji}
        </span>
      ) : null}
      <span className="flex flex-1 flex-col gap-1">
        <span className="text-base font-semibold text-text-primary">{label}</span>
        {description ? (
          <span className="text-sm text-text-secondary">{description}</span>
        ) : null}
      </span>
      <span
        aria-hidden="true"
        className={cn(
          "mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
          active ? "border-primary" : "border-border",
        )}
      >
        <span
          className={cn(
            "h-2.5 w-2.5 rounded-full transition-colors",
            active ? "bg-primary" : "bg-transparent",
          )}
        />
      </span>
    </label>
  );
}
