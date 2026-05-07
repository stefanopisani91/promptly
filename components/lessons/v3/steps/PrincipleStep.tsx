"use client";

// PRINCIPLE step — bold headline + coloured emphasis, staggered pop-in.
// The headline bursts in first (0ms), then the emphasis follows with a
// slightly larger overshoot (120ms delay) — same choreography as the
// completion card, giving the step a "ta-da" feel. The caption fades up
// last (280ms). CSS keyframes live in globals.css.

import type { PrincipleStep as PrincipleStepType } from "@/types";
import { StepCard } from "../StepCard";

interface Props {
  step: PrincipleStepType;
}

export function PrincipleStep({ step }: Props) {
  return (
    <StepCard variant="principle">
      <div className="flex flex-col items-center gap-4 py-2 text-center sm:gap-6 sm:py-8">
        <p className="principle-headline font-heading text-3xl font-bold leading-tight tracking-tight text-text-primary sm:text-5xl">
          {step.headline}
        </p>
        <p className="principle-emphasis font-heading text-4xl font-bold leading-tight tracking-tight text-primary-deep sm:text-6xl">
          {step.emphasis}
        </p>
        {step.caption && (
          <p className="principle-caption mt-2 max-w-md text-sm italic text-text-secondary sm:mt-4 sm:text-base">
            {step.caption}
          </p>
        )}
      </div>
    </StepCard>
  );
}
