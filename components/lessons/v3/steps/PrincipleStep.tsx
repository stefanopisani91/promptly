"use client";

import type { PrincipleStep as PrincipleStepType } from "@/types";
import { StepCard } from "../StepCard";

interface Props {
  step: PrincipleStepType;
}

export function PrincipleStep({ step }: Props) {
  return (
    <StepCard variant="principle">
      <div className="flex flex-col items-center gap-6 py-4 text-center sm:py-8">
        <p className="font-heading text-3xl font-bold leading-tight text-text-primary sm:text-5xl">
          {step.headline}
        </p>
        <p className="font-heading text-3xl font-extrabold leading-tight text-primary-deep sm:text-5xl">
          {step.emphasis}
        </p>
        {step.caption && (
          <p className="mt-4 max-w-md text-sm italic text-text-secondary sm:text-base">
            {step.caption}
          </p>
        )}
      </div>
    </StepCard>
  );
}
