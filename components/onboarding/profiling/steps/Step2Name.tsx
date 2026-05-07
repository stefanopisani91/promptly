"use client";

import { useEffect, useId, useRef, type FormEvent } from "react";
import type { ProfilingCopy } from "@/lib/i18n/profiling";
import { cn } from "@/lib/utils";
import { PrimaryCta } from "../PrimaryCta";
import { SparkLine, SparkMicro } from "../SparkLine";

const NAME_MAX = 30;

interface Props {
  copy: ProfilingCopy["step2"];
  value: string;
  error: string | null;
  pending: boolean;
  onChange: (value: string) => void;
  onAdvance: () => void;
  ctaLabel: string;
}

export function Step2Name({
  copy,
  value,
  error,
  pending,
  onChange,
  onAdvance,
  ctaLabel,
}: Props) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    onAdvance();
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <SparkLine emphasis="lead">{copy.sparkIntro}</SparkLine>
        <SparkLine>{copy.sparkSub}</SparkLine>
      </div>

      <label
        htmlFor={inputId}
        className="flex flex-col gap-2 text-sm font-medium text-text-primary"
      >
        <span className="sr-only">{copy.inputLabel}</span>
        <input
          id={inputId}
          ref={inputRef}
          type="text"
          inputMode="text"
          autoComplete="given-name"
          maxLength={NAME_MAX}
          spellCheck={false}
          placeholder={copy.placeholder}
          value={value}
          disabled={pending}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={Boolean(error)}
          className={cn(
            "rounded-xl border bg-surface px-4 py-3 text-lg text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-primary",
            error ? "border-error" : "border-border",
            pending && "opacity-60",
          )}
        />
      </label>

      <SparkMicro>{copy.sparkMicro}</SparkMicro>

      {error ? (
        <p role="alert" className="text-sm text-error">
          {error}
        </p>
      ) : null}

      <div>
        <PrimaryCta type="submit" pending={pending}>
          {ctaLabel}
        </PrimaryCta>
      </div>
    </form>
  );
}
