"use client";

import type { TextStep as TextStepType } from "@/types";
import { StepCard } from "../StepCard";
import { RichText } from "@/components/glossary/RichText";

interface Props {
  step: TextStepType;
  // Provided by LessonV3View so reactive text steps can pick up the
  // selectedKey of an earlier choice and swap their paragraphs.
  stepState?: Record<string, unknown>;
}

export function TextStep({ step, stepState }: Props) {
  const paragraphs = resolveParagraphs(step, stepState);
  return (
    <StepCard>
      <div className="flex flex-col gap-5">
        {paragraphs.map((p, i) => (
          <p
            key={i}
            className={
              i === 0
                ? "text-lg leading-relaxed text-text-primary sm:text-xl"
                : "text-base leading-relaxed text-text-secondary sm:text-lg"
            }
          >
            <RichText text={p} />
          </p>
        ))}
      </div>
    </StepCard>
  );
}

function resolveParagraphs(
  step: TextStepType,
  stepState: Record<string, unknown> | undefined,
): string[] {
  if (!step.paragraphs_by_choice || !stepState) return step.paragraphs;
  const sourceState = stepState[step.paragraphs_by_choice.source_step_id] as
    | { selectedKey?: string }
    | undefined;
  const key = sourceState?.selectedKey;
  if (!key) return step.paragraphs;
  const variant = step.paragraphs_by_choice.by_key[key];
  if (variant && variant.length > 0) return variant;
  return step.paragraphs;
}
