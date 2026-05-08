// Server-side personalisation of V3 lesson content based on the user's
// onboarding profile.
//
// Today four lessons opt-in:
//   - mindset-01 — `input-motivation` step is replaced with a recap text
//     card so we don't re-ask the user something they already answered
//     during the 12-step profilazione (Profilazione.md spec, BUG #2 fix).
//   - mindset-02 — Step 5 ("Cos'è un IDE AI") and Step 8 ("Anticipazione
//     concetto chiave") swap their paragraphs based on `experience_level`
//     and `preferred_tool` (Lezione2_Blueprint.md §"Integrazione dati
//     onboarding").
//   - mindset-03 — Step 11 ("applied-example") swaps in the user's actual
//     project_description, and step 12 ("quickwin-intro") appends a tool-
//     specific PS based on preferred_tool (Lezione3_Blueprint.md §"Inte-
//     grazione dati onboarding").
//   - mindset-04 — Step 12 ("applied-example") swaps in three project-
//     specific constraint examples when project_description is set, falls
//     back to the generic three-constraint example otherwise.
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
import { truncateProject } from "@/lib/utils";

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

export interface Mindset03Copy {
  step11: {
    exploring: string[];
    withProject: (project: string) => string[];
  };
  step12: {
    default: string[];
    withTool: (toolName: string) => string[];
  };
}

export interface Mindset04Copy {
  step12: {
    exploring: string[];
    withProject: (project: string) => string[];
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
  mindset03: Mindset03Copy;
  mindset04: Mindset04Copy;
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
  if (lesson.id === "mindset-03") {
    return personaliseMindset03(lesson, profile, copy.mindset03);
  }
  if (lesson.id === "mindset-04") {
    return personaliseMindset04(lesson, profile, copy.mindset04);
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
    // Pre-2026-05-09 rows can hold up to 300 chars; trim the inline
    // quote so the recap card stays readable. The cap was lowered to
    // 200 for new inserts but legacy values are not back-filled.
    const display = truncateProject(project);
    return makeRecallTextStep(original, [copy.intro, copy.recall(display)]);
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

// ─── Lesson 3 — Step 11 (applied-example) + Step 12 (quickwin-intro) ──

function personaliseMindset03(
  lesson: LessonV3Content,
  profile: PersonaliseProfileSlice,
  copy: Mindset03Copy,
): LessonV3Content {
  let touched = false;
  const steps = lesson.steps.map((step) => {
    if (step.id === "applied-example" && step.type === "text") {
      const variant = pickStep11Variant(profile, copy.step11);
      if (variant) {
        touched = true;
        return { ...step, paragraphs: variant } satisfies TextStep;
      }
    }
    if (step.id === "quickwin-intro" && step.type === "text") {
      const variant = pickStep12Variant(profile.preferred_tool, copy.step12);
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

function pickStep11Variant(
  profile: PersonaliseProfileSlice,
  copy: Mindset03Copy["step11"],
): string[] | null {
  // Exploring users (no project picked) get the generic example. Users with
  // a real project_description get it woven into the example. When neither
  // is available, leave the JSON default — never strip context blindly.
  if (profile.project_clarity === "exploring") {
    return copy.exploring;
  }
  const project = profile.project_description?.trim();
  if (project && project.length > 0) {
    // Truncate at 100 chars before the quote lands inside Spark's
    // copy — keeps the line readable on the small Lesson 3 card.
    return copy.withProject(truncateProject(project));
  }
  return null;
}

function pickStep12Variant(
  preferredTool: string | null,
  copy: Mindset03Copy["step12"],
): string[] | null {
  if (!preferredTool) return null;
  const tool = getToolBySlug(preferredTool);
  if (!tool) return null;
  return copy.withTool(tool.display_name ?? tool.name);
}

// ─── Lesson 4 — Step 12 (applied-example) ─────────────────────────────

function personaliseMindset04(
  lesson: LessonV3Content,
  profile: PersonaliseProfileSlice,
  copy: Mindset04Copy,
): LessonV3Content {
  let touched = false;
  const steps = lesson.steps.map((step) => {
    if (step.id === "applied-example" && step.type === "text") {
      const variant = pickMindset04Step12Variant(profile, copy.step12);
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

function pickMindset04Step12Variant(
  profile: PersonaliseProfileSlice,
  copy: Mindset04Copy["step12"],
): string[] | null {
  // Same shape as mindset-03 step 11: exploring → generic example,
  // any project_description → personalised constraints.
  if (profile.project_clarity === "exploring") {
    return copy.exploring;
  }
  const project = profile.project_description?.trim();
  if (project && project.length > 0) {
    // Same readability cap as L1 / L3 — see truncateProject in lib/utils.
    return copy.withProject(truncateProject(project));
  }
  return null;
}
