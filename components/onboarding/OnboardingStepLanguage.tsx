"use client";

import { LANGS, type Lang } from "@/types";
import type { AuthCopy } from "@/lib/i18n/auth";
import { cn } from "@/lib/utils";

interface Props {
  copy: AuthCopy["onboarding"]["step2"];
  value: Lang;
  disabled: boolean;
  onChange: (next: Lang) => void;
}

export function OnboardingStepLanguage({ copy, value, disabled, onChange }: Props) {
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
        {LANGS.map((lang) => {
          const active = lang === value;
          const label = lang === "it" ? copy.optionIt : copy.optionEn;
          return (
            <label
              key={lang}
              className={cn(
                "group flex cursor-pointer items-center gap-3 rounded-xl border bg-surface px-4 py-3.5 text-base font-medium text-text-primary transition-colors",
                active
                  ? "border-primary ring-2 ring-primary/30"
                  : "border-border hover:border-primary/60",
                disabled && "cursor-not-allowed opacity-60",
              )}
            >
              <input
                type="radio"
                name="onboarding-lang"
                value={lang}
                checked={active}
                onChange={() => onChange(lang)}
                className="sr-only"
              />
              <span
                aria-hidden="true"
                className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
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
              <span>{label}</span>
            </label>
          );
        })}
      </fieldset>
    </div>
  );
}
