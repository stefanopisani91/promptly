// Single home for Supabase queries (PROMPTLY.md rule #2). Components should
// never call `.from(...)` directly — funnel everything through helpers here so
// the schema/typing surface stays in one place.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { UserProfile } from "@/types";
import type { Database } from "./types";

export type AppSupabaseClient = SupabaseClient<Database>;

export type ProfileGate =
  | { state: "missing" }
  | { state: "incomplete"; profile: UserProfile }
  | { state: "complete"; profile: UserProfile };

export async function getUserProfile(
  supabase: AppSupabaseClient,
  userId: string,
): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from("users")
    .select(
      "id, email, full_name, language, daily_goal, onboarding_completed_at, signup_source, welcome_seen_at, push_prompted_at, ai_eval_prompted_at, created_at, updated_at",
    )
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

/**
 * Fetch only the bits the auth callback needs to decide where to send the
 * user next. Cheaper than pulling the full profile.
 */
export async function getOnboardingGate(
  supabase: AppSupabaseClient,
  userId: string,
): Promise<{ exists: boolean; completedAt: string | null }> {
  const { data, error } = await supabase
    .from("users")
    .select("id, onboarding_completed_at")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return { exists: false, completedAt: null };
  return { exists: true, completedAt: data.onboarding_completed_at };
}
