"use client";

// CHOICE step — 2-4 cliccable options. Selecting one auto-advances after a
// short visual confirmation; the parent decides what "advance" means
// (next step + autosave). The selected key is stored in stepState[step.id].

import { Check } from "lucide-react";
import type { ChoiceStep as ChoiceStepType } from "@/types";
import { StepCard } from "../StepCard";

interface Props {
  step: ChoiceStepType;
  state: { selectedKey?: string } | undefined;
  onPick: (optionKey: string) => void;
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
                className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-all active:scale-[0.99] ${
                  isSelected
                    ? "border-primary bg-primary-light"
                    : "border-border bg-surface hover:border-primary/40 hover:bg-surface-muted/50"
                }`}
              >
                <span
                  aria-hidden
                  className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-transform ${
                    isSelected
                      ? "scale-100 border-primary bg-primary text-white"
                      : "scale-95 border-border bg-surface text-text-muted"
                  }`}
                >
                  {isSelected ? <Check size={14} strokeWidth={3} /> : null}
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
