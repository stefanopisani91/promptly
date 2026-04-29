export type Lang = "en" | "it";

export const LANGS: readonly Lang[] = ["en", "it"] as const;

export function isLang(value: unknown): value is Lang {
  return value === "en" || value === "it";
}

export type Language = Lang;
export type DailyGoal = "trivial" | "easy" | "pro";
export type SubscriptionTier = "free" | "pro";

export const DAILY_GOALS: readonly DailyGoal[] = ["trivial", "easy", "pro"] as const;

export function isDailyGoal(value: unknown): value is DailyGoal {
  return value === "trivial" || value === "easy" || value === "pro";
}

// Round 2 — slim profile + onboarding & permission-prompt state.
// Round 3 appended cumulative XP/streak fields (see migration 20260429160000).
export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  language: Language;
  daily_goal: DailyGoal;
  onboarding_completed_at: string | null;
  signup_source: string | null;
  welcome_seen_at: string | null;
  push_prompted_at: string | null;
  ai_eval_prompted_at: string | null;
  total_xp: number;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Lessons (Round 3) ─────────────────────────────────────────────

// All five paths are typed up-front to avoid a refactor at Round 4+.
// Only `mindset` and `prompt` are active at runtime in MVP.
export type PathSlug = "mindset" | "prompt" | "build" | "debug" | "ship";

export const ACTIVE_PATH_SLUGS: readonly PathSlug[] = ["mindset", "prompt"] as const;

export function isPathSlug(value: unknown): value is PathSlug {
  return (
    value === "mindset" ||
    value === "prompt" ||
    value === "build" ||
    value === "debug" ||
    value === "ship"
  );
}

export function isActivePathSlug(value: unknown): value is "mindset" | "prompt" {
  return value === "mindset" || value === "prompt";
}

export type Difficulty = "beginner" | "intermediate" | "advanced";

export type TheoryBlock =
  | { type: "paragraph"; text: string }
  | { type: "callout"; variant: "key" | "warning" | "tip"; text: string }
  | { type: "example"; label: string; text: string }
  | { type: "simulated_output"; prompt: string; output: string }
  | {
      type: "comparison_table";
      bad: { label: string; content: string };
      good: { label: string; content: string };
    }
  | { type: "quote"; text: string; attribution: string };

export interface Blank {
  index: number;
  correct_answers: string[];
  hint_1: string;
  hint_2: string;
  explanation: string;
}

export interface FillBlankExercise {
  format: "fill_blank";
  prompt_template: string;
  blanks: Blank[];
}

export interface LessonContent {
  id: string;
  path_slug: PathSlug;
  order: number;
  title: string;
  difficulty: Difficulty;
  estimated_minutes: number;
  base_xp: number;
  difficulty_bonus_xp: number;
  icon: string;
  theory: TheoryBlock[];
  exercise: FillBlankExercise;
  outro: {
    recap: string;
    next_prompt: string;
  };
}

export interface UserProgress {
  id: string;
  user_id: string;
  lesson_id: string;
  path_slug: PathSlug;
  completed: boolean;
  attempts: number;
  xp_earned: number;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PathProgress {
  slug: PathSlug;
  total_lessons: number;
  completed_lessons: number;
  total_xp_available: number;
  earned_xp: number;
  next_lesson_id: string | null;
  is_unlocked: boolean;
}
