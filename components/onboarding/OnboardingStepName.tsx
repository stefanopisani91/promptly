"use client";

import { useId, type FormEvent } from "react";
import type { AuthCopy } from "@/lib/i18n/auth";
import { cn } from "@/lib/utils";

const NAME_MAX = 40;

interface Props {
  copy: AuthCopy["onboarding"]["step1"];
  value: string;
  error: string | null;
  disabled: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
}

export function OnboardingStepName({
  copy,
  value,
  error,
  disabled,
  onChange,
  onSubmit,
}: Props) {
  const inputId = useId();

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    onSubmit();
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <header className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          {copy.eyebrow}
        </p>
        <h1 className="font-heading text-2xl font-bold leading-snug text-text-primary">
          {copy.title}
        </h1>
        <p className="text-sm text-text-secondary">{copy.sub}</p>
      </header>

      <label
        htmlFor={inputId}
        className="flex flex-col gap-1.5 text-sm font-medium text-text-primary"
      >
        {copy.label}
        <input
          id={inputId}
          type="text"
          inputMode="text"
          autoComplete="given-name"
          autoFocus
          maxLength={NAME_MAX}
          spellCheck={false}
          placeholder={copy.placeholder}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={Boolean(error)}
          className={cn(
            "rounded-lg border bg-surface px-3.5 py-2.5 text-base text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-primary",
            error ? "border-error" : "border-border",
            disabled && "opacity-60",
          )}
        />
      </label>

      {error && (
        <p role="alert" className="text-sm text-error">
          {error}
        </p>
      )}

      {/* Hidden submit so Enter triggers form submit */}
      <button type="submit" className="hidden" aria-hidden="true" tabIndex={-1} />
    </form>
  );
}
