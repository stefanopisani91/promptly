"use client";

import type { DailyGoal } from "@/types";
import type { AuthCopy } from "@/lib/i18n/auth";
import { cn } from "@/lib/utils";

interface Props {
  copy: AuthCopy["onboarding"]["step3"];
  value: DailyGoal;
  disabled: boolean;
  onChange: (next: DailyGoal) => void;
}

export function OnboardingStepGoal({ copy, value, disabled, onChange }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          {copy.eyebrow}
        </p>
        <h1 className="font-heading text-2xl font-bold leading-snug text-text-primary">
          {copy.title}
        </h1>
        <p className="text-sm text-text-secondary">{copy.sub}</p>
      </header>

      <fieldset className="flex flex-col gap-2.5" disabled={disabled}>
        <legend className="sr-only">{copy.title}</legend>
        {copy.cards.map((card) => {
          const active = card.goal === value;
          return (
            <label
              key={card.goal}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-xl border bg-surface px-4 py-3.5 transition-colors",
                active
                  ? "border-primary ring-2 ring-primary/30"
                  : "border-border hover:border-primary/60",
                disabled && "cursor-not-allowed opacity-60",
              )}
            >
              <input
                type="radio"
                name="onboarding-goal"
                value={card.goal}
                checked={active}
                onChange={() => onChange(card.goal)}
                className="sr-only"
              />
              <span aria-hidden="true" className="mt-0.5 text-2xl leading-none">
                {card.emoji}
              </span>
              <span className="flex flex-col gap-0.5">
                <span className="text-base font-semibold text-text-primary">
                  {card.title}
                </span>
                <span className="text-sm text-text-secondary">
                  {card.description}
                </span>
              </span>
            </label>
          );
        })}
      </fieldset>
    </div>
  );
}
