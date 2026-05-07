// Server-side personalisation of V3 lesson content based on the user's
// onboarding profile. Today only Lesson 1 (mindset-01) is touched: its
// `input-motivation` step is replaced with a recap text card so we don't
// re-ask the user something they already answered during the 12-step
// profilazione (Profilazione.md spec, BUG #2 fix).
//
// Pure function, no I/O. The caller (app/(app)/lesson/[id]/page.tsx)
// already owns the lesson + profile + i18n bundle, so we keep the rule
// of "no DB access in components" intact.

import type {
  LessonV3Content,
  LessonV3Step,
  ProjectClarity,
  TextStep,
} from "@/types";

export interface ProjectRecallCopy {
  intro: string;
  recall: (project: string) => string;
  exploring: string;
}

export interface PersonaliseProfileSlice {
  project_description: string | null;
  project_clarity: ProjectClarity | null;
}

/**
 * Returns a copy of `lesson` with any user-tailored steps swapped in.
 * Lessons we don't personalise are returned untouched (same reference is
 * fine — callers don't mutate).
 */
export function personaliseLessonForUser(
  lesson: LessonV3Content,
  profile: PersonaliseProfileSlice,
  copy: ProjectRecallCopy,
): LessonV3Content {
  if (lesson.id !== "mindset-01") return lesson;

  let touched = false;
  const steps = lesson.steps.map((step) => {
    if (step.id !== "input-motivation") return step;
    const replacement = buildMindset01ProjectRecallStep(step, profile, copy);
    if (replacement === step) return step;
    touched = true;
    return replacement;
  });

  if (!touched) return lesson;
  return { ...lesson, steps };
}

function buildMindset01ProjectRecallStep(
  original: LessonV3Step,
  profile: PersonaliseProfileSlice,
  copy: ProjectRecallCopy,
): LessonV3Step {
  // EXPLORING — user has no project yet, Spark proposes Lucia's FrigoMagico.
  if (profile.project_clarity === "exploring") {
    return makeRecallTextStep(original, [copy.intro, copy.exploring]);
  }

  // IDEA — user gave us a project description in onboarding step 5.
  const project = profile.project_description?.trim();
  if (project && project.length > 0) {
    return makeRecallTextStep(original, [copy.intro, copy.recall(project)]);
  }

  // Defensive: profile is incomplete (shouldn't happen — the (app)/layout
  // gate redirects to /onboarding when onboarding_completed_at is null).
  // Keep the original input step so the lesson still works for legacy
  // accounts that pre-date the profilazione round.
  return original;
}

function makeRecallTextStep(
  original: LessonV3Step,
  paragraphs: string[],
): TextStep {
  // Preserve `id` so any saved step_state row keeps lining up with the
  // step's slot in the lesson body. Vignettes carry over only when the
  // original was an input step (the type guard satisfies TS without an
  // unsafe cast).
  return {
    id: original.id,
    type: "text",
    spark_state: "listening",
    paragraphs,
    vignettes: original.type === "input" ? original.vignettes : undefined,
  };
}
