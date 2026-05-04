"use client";

import type { TextStep as TextStepType } from "@/types";
import { StepCard } from "../StepCard";

interface Props {
  step: TextStepType;
}

export function TextStep({ step }: Props) {
  return (
    <StepCard>
      <div className="flex flex-col gap-5">
        {step.paragraphs.map((p, i) => (
          <p
            key={i}
            className={
              i === 0
                ? "text-lg leading-relaxed text-text-primary sm:text-xl"
                : "text-base leading-relaxed text-text-secondary sm:text-lg"
            }
          >
            {p}
          </p>
        ))}
      </div>
    </StepCard>
  );
}
