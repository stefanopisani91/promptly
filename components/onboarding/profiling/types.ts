// Shared types used by every profiling step. The shell owns one
// ProfileAnswers state object; each step receives a slice + an onChange
// patcher (Partial<ProfileAnswers>). Step components stay dumb — all
// branching/skip logic lives in ProfilingShell.

import type {
  DailyGoal,
  ExperienceLevel,
  Lang,
  ProfilePromises,
  ProjectClarity,
} from "@/types";

export interface ProfileAnswers {
  language: Lang;
  full_name: string;
  experience_level: ExperienceLevel | null;
  project_clarity: ProjectClarity | null;
  project_description: string;
  tools_used: string[];
  tools_other: string;
  preferred_tool: string | null;
  daily_goal: DailyGoal | null;
  deep_motivation: string;
  promises: ProfilePromises | null;
}

export const INITIAL_ANSWERS: ProfileAnswers = {
  language: "it",
  full_name: "",
  experience_level: null,
  project_clarity: null,
  project_description: "",
  tools_used: [],
  tools_other: "",
  preferred_tool: null,
  daily_goal: null,
  deep_motivation: "",
  promises: null,
};

export type StepDirection = "forward" | "backward";
