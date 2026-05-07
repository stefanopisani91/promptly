"use client";

import { useEffect, useId, useRef, type FormEvent } from "react";
import type { ProjectClarity } from "@/types";
import type { ProfilingCopy } from "@/lib/i18n/profiling";
import { cn } from "@/lib/utils";
import { PrimaryCta } from "../PrimaryCta";
import { SparkLine, SparkMicro } from "../SparkLine";

const PROJECT_DESCRIPTION_MAX = 300;
const PROJECT_DESCRIPTION_MIN = 10;

interface Props {
  copy: ProfilingCopy["step5"];
  clarity: Exclude<ProjectClarity, "exploring">;
  value: string;
  error: string | null;
  pending: boolean;
  onChange: (value: string) => void;
  onAdvance: () => void;
  ctaLabel: string;
}

export function Step5Project({
  copy,
  clarity,
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

  const sparkLine = clarity === "precise" ? copy.sparkPrecise : copy.sparkVague;
  const placeholder =
    clarity === "precise" ? copy.placeholderPrecise : copy.placeholderVague;

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    onAdvance();
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
      <SparkLine emphasis="lead">{sparkLine}</SparkLine>

      <label
        htmlFor={inputId}
        className="flex flex-col gap-2 text-sm font-medium text-text-primary"
      >
        <span className="sr-only">{sparkLine}</span>
        <textarea
          id={inputId}
          ref={ref}
          rows={3}
          maxLength={PROJECT_DESCRIPTION_MAX}
          spellCheck={false}
          placeholder={placeholder}
          value={value}
          disabled={pending}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={Boolean(error)}
          className={cn(
            "min-h-[110px] resize-none rounded-xl border bg-surface px-4 py-3 text-base leading-relaxed text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-primary",
            error ? "border-error" : "border-border",
            pending && "opacity-60",
          )}
        />
        <span className="self-end text-xs text-text-muted">
          {value.trim().length}/{PROJECT_DESCRIPTION_MAX}
        </span>
      </label>

      <SparkMicro>{copy.sparkMicro}</SparkMicro>

      {error ? (
        <p role="alert" className="text-sm text-error">
          {error}
        </p>
      ) : null}

      <div>
        <PrimaryCta
          type="submit"
          pending={pending}
          disabled={value.trim().length < PROJECT_DESCRIPTION_MIN}
        >
          {ctaLabel}
        </PrimaryCta>
      </div>
    </form>
  );
}
