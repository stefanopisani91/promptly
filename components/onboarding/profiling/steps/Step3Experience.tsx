"use client";

import type { ExperienceLevel } from "@/types";
import type { ProfilingCopy } from "@/lib/i18n/profiling";
import { ChoiceCard } from "../ChoiceCard";
import { PrimaryCta } from "../PrimaryCta";
import { SparkLine } from "../SparkLine";

interface Props {
  copy: ProfilingCopy["step3"];
  userName: string;
  value: ExperienceLevel | null;
  pending: boolean;
  onChange: (next: ExperienceLevel) => void;
  onAdvance: () => void;
  ctaLabel: string;
}

export function Step3Experience({
  copy,
  userName,
  value,
  pending,
  onChange,
  onAdvance,
  ctaLabel,
}: Props) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <SparkLine emphasis="lead">{copy.sparkIntro(userName)}</SparkLine>
        <SparkLine>{copy.sparkQuestion}</SparkLine>
      </div>

      <fieldset className="flex flex-col gap-3" disabled={pending}>
        <legend className="sr-only">{copy.sparkQuestion}</legend>
        {copy.options.map((opt) => (
          <ChoiceCard
            key={opt.key}
            name="experience-level"
            value={opt.key}
            active={value === opt.key}
            emoji={opt.emoji}
            label={opt.label}
            disabled={pending}
            onChange={() => onChange(opt.key)}
          />
        ))}
      </fieldset>

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
