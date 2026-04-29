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

// Round 1 — slim profile. Streak / XP / freeze / Pro / push / consent
// fields are appended in later migrations as features ship.
export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  language: Language;
  daily_goal: DailyGoal;
  onboarding_completed_at: string | null;
  signup_source: string | null;
  created_at: string;
  updated_at: string;
}
