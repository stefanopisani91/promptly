"use client";

// REWARD step. Two flavours:
//   - milestone        → simple celebratory card with a title + caption
//   - archetype_reveal → resolves the user's archetype from previous CHOICE
//                        steps and shows it with a description + bonus XP
//
// Confetti fires once on first mount. The resolved archetype key is reported
// upward via onArchetypeResolved so the container can persist it on lesson
// completion.

import { useEffect, useRef } from "react";
import { Sparkles, Trophy } from "lucide-react";
import { fireConfetti } from "@/lib/confetti";
import type { LessonV3Step, RewardStep as RewardStepType } from "@/types";
import { StepCard } from "../StepCard";
import {
  collectArchetypeAnswers,
  resolveArchetype,
  type ResolvedArchetype,
} from "@/lib/lessons/v3/archetype";

export interface RewardStepStrings {
  // "+{xp} XP" pattern.
  xpBonusTemplate: string;
  archetypeEyebrow: string;
}

interface Props {
  step: RewardStepType;
  steps: LessonV3Step[];
  stepState: Record<string, unknown>;
  strings: RewardStepStrings;
  onArchetypeResolved?: (archetypeKey: string) => void;
}

export function RewardStep({
  step,
  steps,
  stepState,
  strings,
  onArchetypeResolved,
}: Props) {
  const firedRef = useRef(false);

  let resolved: ResolvedArchetype | null = null;
  if (step.variant === "archetype_reveal" && step.archetype) {
    const answers = collectArchetypeAnswers(steps, stepState);
    resolved = resolveArchetype(answers, step.archetype);
  }

  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;
    fireConfetti();
    if (resolved && onArchetypeResolved) {
      onArchetypeResolved(resolved.key);
    }
  }, [resolved, onArchetypeResolved]);

  const xpBonus = step.archetype?.bonus_xp ?? 0;

  return (
    <StepCard variant="reward">
      <div className="flex flex-col items-center gap-4 py-1 text-center sm:gap-5 sm:py-6">
        <div
          aria-hidden
          className="reward-icon-pop flex h-14 w-14 items-center justify-center rounded-full bg-success/15 text-success sm:h-16 sm:w-16"
        >
          {step.variant === "archetype_reveal" ? (
            <Sparkles className="h-7 w-7 sm:h-8 sm:w-8" />
          ) : (
            <Trophy className="h-7 w-7 sm:h-8 sm:w-8" />
          )}
        </div>

        {step.variant === "archetype_reveal" && resolved ? (
          <>
            <p className="eyebrow text-success">
              {strings.archetypeEyebrow}
            </p>
            <h2 className="font-heading text-3xl font-bold leading-tight text-text-primary sm:text-4xl">
              {resolved.title}
            </h2>
            <p className="max-w-md text-base italic text-text-secondary sm:text-lg">
              {resolved.description}
            </p>
            {xpBonus > 0 && (
              <p className="mt-2 inline-flex items-center rounded-full bg-success/15 px-4 py-1 text-sm font-semibold text-success">
                {strings.xpBonusTemplate.replace("{xp}", String(xpBonus))}
              </p>
            )}
          </>
        ) : (
          <>
            {step.title && (
              <h2 className="font-heading text-3xl font-bold leading-tight text-text-primary sm:text-4xl">
                {step.title}
              </h2>
            )}
            {step.xp_label && (
              <p className="inline-flex items-center rounded-full bg-success/15 px-4 py-1 text-sm font-semibold text-success">
                {step.xp_label}
              </p>
            )}
          </>
        )}

        {step.caption && (
          <p className="mt-2 max-w-md text-sm italic text-text-secondary sm:text-base">
            {step.caption}
          </p>
        )}
      </div>
    </StepCard>
  );
}
