"use client";

import type { Lang } from "@/types";
import { LANGS } from "@/types";
import type { ProfilingCopy } from "@/lib/i18n/profiling";
import { cn } from "@/lib/utils";
import { PrimaryCta } from "../PrimaryCta";
import { SparkLine } from "../SparkLine";

interface Props {
  copy: ProfilingCopy["step1"];
  language: Lang;
  onLanguageChange: (next: Lang) => void;
  onAdvance: () => void;
  pending: boolean;
}

export function Step1Welcome({
  copy,
  language,
  onLanguageChange,
  onAdvance,
  pending,
}: Props) {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center gap-3">
        {LANGS.map((lang) => {
          const active = lang === language;
          const label = lang === "it" ? copy.italian : copy.english;
          return (
            <button
              key={lang}
              type="button"
              onClick={() => onLanguageChange(lang)}
              aria-pressed={active}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                active
                  ? "border-primary bg-primary text-white"
                  : "border-border bg-surface text-text-primary hover:border-primary/60",
              )}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-4">
        <SparkLine emphasis="lead">{copy.sparkLines[0]}</SparkLine>
        <SparkLine>{copy.sparkLines[1]}</SparkLine>
        <SparkLine>{copy.sparkLines[2]}</SparkLine>
      </div>

      <div>
        <PrimaryCta onClick={onAdvance} pending={pending} type="button">
          {copy.cta}
        </PrimaryCta>
      </div>
    </div>
  );
}
