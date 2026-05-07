"use client";

import { useEffect, useId, useRef, type FormEvent } from "react";
import type { ProfilingCopy } from "@/lib/i18n/profiling";
import { cn } from "@/lib/utils";
import { PrimaryCta } from "../PrimaryCta";
import { SparkLine, SparkMicro } from "../SparkLine";

const DEEP_MOTIVATION_MAX = 500;

interface Props {
  copy: ProfilingCopy["step9"];
  value: string;
  error: string | null;
  pending: boolean;
  onChange: (value: string) => void;
  onAdvance: () => void;
  ctaLabel: string;
}

export function Step9Motivation({
  copy,
  value,
  error,
  pending,
  onChange,
  onAdvance,
  ctaLabel,
}: Props) {
  const inputId = useId();
  const ref = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    onAdvance();
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <SparkLine emphasis="lead">{copy.sparkIntroLine1}</SparkLine>
        <SparkLine>{copy.sparkIntroLine2}</SparkLine>
      </div>

      <label
        htmlFor={inputId}
        className="flex flex-col gap-2 text-sm font-medium text-text-primary"
      >
        <span className="sr-only">{copy.sparkIntroLine1}</span>
        <textarea
          id={inputId}
          ref={ref}
          rows={5}
          maxLength={DEEP_MOTIVATION_MAX}
          spellCheck={false}
          placeholder={copy.placeholder}
          value={value}
          disabled={pending}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={Boolean(error)}
          className={cn(
            "min-h-[160px] resize-none rounded-xl border bg-surface px-4 py-3 text-base leading-relaxed text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-primary",
            error ? "border-error" : "border-border",
            pending && "opacity-60",
          )}
        />
        <span className="self-end text-xs text-text-muted">
          {value.trim().length}/{DEEP_MOTIVATION_MAX}
        </span>
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
