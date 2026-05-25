"use client";

// 4-segment progress bar shown at the top of every ingredient screen and
// the review screen. Each segment maps 1:1 to one of the 4 ingredients,
// painted in its accent colour when filled and with the band shade
// (good / weak / trap) determined deterministically by the user's pick.
//
// `activeIndex` highlights the currently-edited ingredient with a soft
// ring so the learner can see "you're here" at a glance.

import type { AnatomyDimension } from "@/types";

export type SegmentState = "empty" | "good" | "weak" | "trap";

const ORDER: AnatomyDimension[] = ["context", "task", "constraints", "format"];

const ACCENT_VAR: Record<AnatomyDimension, string> = {
  context: "var(--anatomy-context)",
  task: "var(--anatomy-task)",
  constraints: "var(--anatomy-constraints)",
  format: "var(--anatomy-format)",
};

interface Props {
  segments: Record<AnatomyDimension, SegmentState>;
  activeIndex: number; // 0..3 — the ingredient the user is currently on
  // Localised labels for the screen-reader-only progress description.
  // Example: "Ingrediente {current} di {total}: {name}"
  srTemplate: string;
  dimensionLabels: Record<AnatomyDimension, string>;
}

export function AnatomyProgressBar({
  segments,
  activeIndex,
  srTemplate,
  dimensionLabels,
}: Props) {
  const activeDim = ORDER[Math.max(0, Math.min(3, activeIndex))];
  const srLabel = srTemplate
    .replace("{current}", String(activeIndex + 1))
    .replace("{total}", "4")
    .replace("{name}", dimensionLabels[activeDim]);

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={4}
      aria-valuenow={activeIndex + 1}
      aria-label={srLabel}
      className="flex w-full items-center gap-1.5"
    >
      {ORDER.map((dim, i) => {
        const state = segments[dim];
        const isActive = i === activeIndex;
        const filled = state !== "empty";
        const accent = ACCENT_VAR[dim];
        let bg = "var(--surface-muted)";
        if (state === "good") bg = accent;
        else if (state === "weak") bg = "var(--anatomy-band-weak)";
        else if (state === "trap") bg = "var(--anatomy-band-trap)";
        return (
          <div
            key={dim}
            className="anatomy-progress-segment relative h-1.5 flex-1 overflow-hidden rounded-full transition-all"
            style={{
              backgroundColor: filled ? bg : "var(--surface-muted)",
              boxShadow: isActive
                ? `0 0 0 2px color-mix(in srgb, ${accent} 30%, transparent)`
                : "none",
            }}
          />
        );
      })}
    </div>
  );
}
