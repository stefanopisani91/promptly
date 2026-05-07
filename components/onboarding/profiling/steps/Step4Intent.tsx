"use client";

import type { ProjectClarity } from "@/types";
import type { ProfilingCopy } from "@/lib/i18n/profiling";
import { ChoiceCard } from "../ChoiceCard";
import { PrimaryCta } from "../PrimaryCta";
import { SparkLine } from "../SparkLine";

interface Props {
  copy: ProfilingCopy["step4"];
  value: ProjectClarity | null;
  pending: boolean;
  showExploringCommentary: boolean;
  onChange: (next: ProjectClarity) => void;
  onAdvance: () => void;
  ctaLabel: string;
}

export function Step4Intent({
  copy,
  value,
  pending,
  showExploringCommentary,
  onChange,
  onAdvance,
  ctaLabel,
}: Props) {
  return (
    <div className="flex flex-col gap-6">
      <SparkLine emphasis="lead">{copy.sparkIntro}</SparkLine>

      <fieldset className="flex flex-col gap-3" disabled={pending}>
        <legend className="sr-only">{copy.sparkIntro}</legend>
        {copy.options.map((opt) => (
          <ChoiceCard
            key={opt.key}
            name="project-clarity"
            value={opt.key}
            active={value === opt.key}
            emoji={opt.emoji}
            label={opt.label}
            disabled={pending}
            onChange={() => onChange(opt.key)}
          />
        ))}
      </fieldset>

      {showExploringCommentary && value === "exploring" ? (
        <div className="rounded-2xl border border-primary/20 bg-primary-light/40 px-5 py-4">
          <p className="text-base leading-relaxed text-text-primary">
            {copy.exploringCommentary}
          </p>
        </div>
      ) : null}

      <div>
        <PrimaryCta
          onClick={onAdvance}
          pending={pending}
          disabled={value == null}
        >
          {ctaLabel}
        </PrimaryCta>
      </div>
    </div>
  );
}
