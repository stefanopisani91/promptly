"use client";

// CHOICE step — 2-4 clickable options. Selecting one auto-advances after a
// short visual confirmation; the parent decides what "advance" means
// (next step + autosave). The selected key is stored in stepState[step.id].
//
// Visual: selected option scales up slightly + gets an orange border flash.
// The check icon uses the same animate-check-draw SVG path as the dashboard
// MapNode checkmark (globals.css) for consistency.

import type { ChoiceStep as ChoiceStepType } from "@/types";
import { StepCard } from "../StepCard";

interface Props {
  step: ChoiceStepType;
  state: { selectedKey?: string } | undefined;
  onPick: (optionKey: string) => void;
}

function AnimatedCheck() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <path
        d="M5 13l4 4L19 7"
        stroke="white"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="animate-check-draw"
      />
    </svg>
  );
}

export function ChoiceStep({ step, state, onPick }: Props) {
  const selected = state?.selectedKey ?? null;

  return (
    <StepCard>
      <div className="flex flex-col gap-5">
        {step.intro && (
          <p className="text-base leading-relaxed text-text-secondary sm:text-lg">
            {step.intro}
          </p>
        )}
        <h2 className="font-heading text-xl font-semibold leading-tight text-text-primary sm:text-2xl">
          {step.prompt}
        </h2>

        <div className="flex flex-col gap-3">
          {step.options.map((option) => {
            const isSelected = selected === option.key;
            return (
              <button
                key={option.key}
                type="button"
                onClick={() => onPick(option.key)}
                aria-pressed={isSelected}
                className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-all duration-200 active:scale-[0.99] ${
                  isSelected
                    ? "scale-[1.015] border-primary bg-primary-light shadow-sm shadow-primary/10"
                    : "border-border bg-surface hover:border-primary/40 hover:bg-surface-muted/50"
                }`}
              >
                {/* Circle indicator */}
                <span
                  aria-hidden
                  className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-all duration-200 ${
                    isSelected
                      ? "border-primary bg-primary text-white"
                      : "border-border bg-surface text-text-muted"
                  }`}
                >
                  {isSelected ? <AnimatedCheck /> : null}
                </span>

                <span className="text-base text-text-primary sm:text-lg">
                  {option.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </StepCard>
  );
}
