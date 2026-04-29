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
// Streak / XP / freeze / Pro / push subscription / GDPR consent fields
// are appended in later migrations as those features ship.
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
  created_at: string;
  updated_at: string;
}
