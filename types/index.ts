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
// Round 4 (Dashboard V2 Phase 1) appended level/referral fields
// (see migration 20260430120000).
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
  // Dashboard V2 — Phase 1.
  // xp_level itself is computed from total_xp (see lib/levels.ts) and not
  // persisted, to avoid drift. Only the last level for which we showed the
  // celebratory modal is stored, so we know whether to fire it again.
  last_level_up_notified: number;
  // Referral system (Dashboard V2 — Phase 2).
  // Code is generated lazily on first ReferralCard render; activation
  // timestamp marks the first copy/share (drives the +25 XP one-time bonus).
  referral_code: string | null;
  referral_link_activated_at: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Referrals (Dashboard V2 — Phase 2) ────────────────────────────

export interface UserReferral {
  id: string;
  referrer_id: string;
  referee_id: string;
  xp_awarded_referrer: number;
  xp_awarded_referee: number;
  created_at: string;
}

// ─── Bonus paths (Dashboard V2 — Phase 3) ──────────────────────────

export type BonusPathSlug =
  | "path-x"
  | "path-y"
  | "path-z"
  | "path-w"
  | "path-q"
  | "path-r"
  | "path-s"
  | "path-t";

export const BONUS_PATH_SLUGS: readonly BonusPathSlug[] = [
  "path-x",
  "path-y",
  "path-z",
  "path-w",
  "path-q",
  "path-r",
  "path-s",
  "path-t",
] as const;

export function isBonusPathSlug(value: unknown): value is BonusPathSlug {
  return (
    typeof value === "string" &&
    (BONUS_PATH_SLUGS as readonly string[]).includes(value)
  );
}

export type BonusPathTier = SubscriptionTier; // 'free' | 'pro'

/**
 * Discriminated union covering every unlock rule used by §3 of DASHBOARD_V2.md.
 * Each variant carries exactly the fields needed to evaluate it — no
 * optional bag-of-fields, so the checker can switch on `type` exhaustively.
 */
export type UnlockCondition =
  | { type: "xp_threshold"; xp_required: number }
  | { type: "achievement_path"; path_slug: PathSlug }
  | { type: "achievement_streak"; streak_min: number }
  | { type: "achievement_all_paths" }
  | { type: "social_referral"; min_count: number }
  | { type: "composite_and"; all_of: UnlockCondition[] };

export interface BonusPath {
  slug: BonusPathSlug;
  title_en: string;
  title_it: string;
  description_en: string;
  description_it: string;
  tier: BonusPathTier;
  difficulty: Difficulty;
  lesson_count: number;
  estimated_minutes_min: number;
  estimated_minutes_max: number;
  // Where this path "branches off" the main spine — used by the map (Phase 4)
  // to position the bonus island next to the right main-path node. null for
  // PathT (endgame, sits above Path 5).
  branch_from_path: PathSlug | null;
  // Lesson content lives in Phase 5; until then `is_published: false` keeps
  // the path visible on the map but the click-through goes to "Coming soon".
  is_published: boolean;
  unlock_condition: UnlockCondition;
}

/**
 * Result of evaluating a UnlockCondition against a user snapshot. When
 * `unlocked: false`, the missing-* fields describe what's left so the UI
 * can render a precise tooltip ("Earn 200 more XP", "Invite 1 friend").
 */
export interface UnlockState {
  unlocked: boolean;
  missing_xp?: number;
  missing_streak?: number;
  missing_referrals?: number;
  missing_paths?: PathSlug[];
}

// ─── Levels (Dashboard V2 — Phase 1) ───────────────────────────────

export interface LevelInfo {
  level: number;
  xp_min: number;
  xp_max: number | null; // null on the top level (no upper bound)
  robot_name: string;
  title_en: string;
  title_it: string;
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
