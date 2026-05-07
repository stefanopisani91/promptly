// Server-side personalisation of V3 lesson content based on the user's
// onboarding profile.
//
// Today two lessons opt-in:
//   - mindset-01 — `input-motivation` step is replaced with a recap text
//     card so we don't re-ask the user something they already answered
//     during the 12-step profilazione (Profilazione.md spec, BUG #2 fix).
//   - mindset-02 — Step 5 ("Cos'è un IDE AI") and Step 8 ("Anticipazione
//     concetto chiave") swap their paragraphs based on `experience_level`
//     and `preferred_tool` (Lezione2_Blueprint.md §"Integrazione dati
//     onboarding").
//
// Pure function, no I/O. The caller (app/(app)/lesson/[id]/page.tsx)
// already owns the lesson + profile + i18n bundle, so we keep the rule
// of "no DB access in components" intact.

import type {
  ExperienceLevel,
  LessonV3Content,
  LessonV3Step,
  ProjectClarity,
  TextStep,
} from "@/types";
import { getToolBySlug } from "@/lib/onboarding/tools";

export interface ProjectRecallCopy {
  intro: string;
  recall: (project: string) => string;
  exploring: string;
}

export interface Mindset02Copy {
  step5: {
    beginner: string[];
    triedFailed: string[];
    workingOnIt: string[];
    advanced: string[];
  };
  step8: {
    default: string[];
    withTool: (toolName: string, configFile: string) => string[];
  };
}

export interface PersonaliseProfileSlice {
  project_description: string | null;
  project_clarity: ProjectClarity | null;
  experience_level: ExperienceLevel | null;
  preferred_tool: string | null;
}

export interface PersonaliseCopy {
  projectRecall: ProjectRecallCopy;
  mindset02: Mindset02Copy;
}

/**
 * Returns a copy of `lesson` with any user-tailored steps swapped in.
 * Lessons we don't personalise are returned untouched.
 */
export function personaliseLessonForUser(
  lesson: LessonV3Content,
  profile: PersonaliseProfileSlice,
  copy: PersonaliseCopy,
): LessonV3Content {
  if (lesson.id === "mindset-01") {
    return personaliseMindset01(lesson, profile, copy.projectRecall);
  }
  if (lesson.id === "mindset-02") {
    return personaliseMindset02(lesson, profile, copy.mindset02);
  }
  return lesson;
}

// ─── Lesson 1 — input-motivation recap ─────────────────────────────────

function personaliseMindset01(
  lesson: LessonV3Content,
  profile: PersonaliseProfileSlice,
  copy: ProjectRecallCopy,
): LessonV3Content {
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
  if (profile.project_clarity === "exploring") {
    return makeRecallTextStep(original, [copy.intro, copy.exploring]);
  }
  const project = profile.project_description?.trim();
  if (project && project.length > 0) {
    return makeRecallTextStep(original, [copy.intro, copy.recall(project)]);
  }
  // Defensive: profile is incomplete (shouldn't happen — the (app)/layout
  // gate redirects to /onboarding when onboarding_completed_at is null).
  return original;
}

function makeRecallTextStep(
  original: LessonV3Step,
  paragraphs: string[],
): TextStep {
  return {
    id: original.id,
    type: "text",
    spark_state: "listening",
    paragraphs,
    vignettes: original.type === "input" ? original.vignettes : undefined,
  };
}

// ─── Lesson 2 — Step 5 (IDE AI) + Step 8 (CLAUDE.md hook) ─────────────

function personaliseMindset02(
  lesson: LessonV3Content,
  profile: PersonaliseProfileSlice,
  copy: Mindset02Copy,
): LessonV3Content {
  let touched = false;
  const steps = lesson.steps.map((step) => {
    if (step.id === "ide-explainer" && step.type === "text") {
      const variant = pickStep5Variant(profile.experience_level, copy.step5);
      if (variant) {
        touched = true;
        return { ...step, paragraphs: variant } satisfies TextStep;
      }
    }
    if (step.id === "claudemd-hook" && step.type === "text") {
      const variant = pickStep8Variant(profile.preferred_tool, copy.step8);
      if (variant) {
        touched = true;
        return { ...step, paragraphs: variant } satisfies TextStep;
      }
    }
    return step;
  });
  if (!touched) return lesson;
  return { ...lesson, steps };
}

function pickStep5Variant(
  level: ExperienceLevel | null,
  copy: Mindset02Copy["step5"],
): string[] | null {
  switch (level) {
    case "beginner":
      return copy.beginner;
    case "tried_failed":
      return copy.triedFailed;
    case "working_on_it":
      return copy.workingOnIt;
    case "advanced":
      return copy.advanced;
    default:
      return null; // keep the JSON default
  }
}

function pickStep8Variant(
  preferredTool: string | null,
  copy: Mindset02Copy["step8"],
): string[] | null {
  if (!preferredTool) return null;
  const tool = getToolBySlug(preferredTool);
  if (!tool) return null;
  const configFile = configFileForTool(preferredTool);
  return copy.withTool(tool.display_name ?? tool.name, configFile);
}

function configFileForTool(slug: string): string {
  switch (slug) {
    case "cursor":
      return ".cursorrules";
    case "claude-code":
      return "CLAUDE.md";
    case "windsurf":
      return ".windsurfrules";
    case "lovable":
      return "prompt rules (in-app)";
    case "bolt":
      return "prompt setup";
    case "replit":
      return "replit.md";
    case "vscode":
      return ".copilot-instructions.md";
    case "antigravity":
      return "agents.md";
    case "base44":
      return "prompt rules (in-app)";
    default:
      return "CLAUDE.md";
  }
}
