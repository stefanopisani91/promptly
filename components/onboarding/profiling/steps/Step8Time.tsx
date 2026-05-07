"use client";

import type { DailyGoal } from "@/types";
import type { ProfilingCopy } from "@/lib/i18n/profiling";
import { ChoiceCard } from "../ChoiceCard";
import { PrimaryCta } from "../PrimaryCta";
import { SparkLine, SparkMicro } from "../SparkLine";

interface Props {
  copy: ProfilingCopy["step8"];
  value: DailyGoal | null;
  pending: boolean;
  onChange: (next: DailyGoal) => void;
  onAdvance: () => void;
  ctaLabel: string;
}

export function Step8Time({
  copy,
  value,
  pending,
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
            name="daily-goal"
            value={opt.key}
            active={value === opt.key}
            emoji={opt.emoji}
            label={opt.label}
            disabled={pending}
            onChange={() => onChange(opt.key)}
          />
        ))}
      </fieldset>

      <SparkMicro>{copy.sparkMicro}</SparkMicro>

      <div>
        <PrimaryCta
          onClick={onAdvance}
          pending={pending}
          disabled={value === null}
        >
          {ctaLabel}
        </PrimaryCta>
      </div>
    </div>
  );
}
