// Single home for Supabase queries (PROMPTLY.md rule #2). Components should
// never call `.from(...)` directly — funnel everything through helpers here so
// the schema/typing surface stays in one place.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { PathSlug, UserProfile, UserProgress } from "@/types";
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
      "id, email, full_name, language, daily_goal, onboarding_completed_at, signup_source, welcome_seen_at, push_prompted_at, ai_eval_prompted_at, total_xp, current_streak, longest_streak, last_activity_date, created_at, updated_at",
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

// ─── Lessons (Round 3) ─────────────────────────────────────────────

export async function getProgressForPath(
  supabase: AppSupabaseClient,
  userId: string,
  pathSlug: PathSlug,
): Promise<UserProgress[]> {
  const { data, error } = await supabase
    .from("user_progress")
    .select(
      "id, user_id, lesson_id, path_slug, completed, attempts, xp_earned, completed_at, created_at, updated_at",
    )
    .eq("user_id", userId)
    .eq("path_slug", pathSlug);

  if (error) throw error;
  return (data ?? []) as UserProgress[];
}

export async function getAllUserProgress(
  supabase: AppSupabaseClient,
  userId: string,
): Promise<UserProgress[]> {
  const { data, error } = await supabase
    .from("user_progress")
    .select(
      "id, user_id, lesson_id, path_slug, completed, attempts, xp_earned, completed_at, created_at, updated_at",
    )
    .eq("user_id", userId);

  if (error) throw error;
  return (data ?? []) as UserProgress[];
}

export async function upsertLessonCompletion(
  supabase: AppSupabaseClient,
  params: {
    userId: string;
    lessonId: string;
    pathSlug: PathSlug;
    attempts: number;
    xpEarned: number;
  },
): Promise<{ xpDelta: number }> {
  // 1. Read existing row to compute the XP delta — we never decrement total_xp
  //    (replays of an already-completed lesson don't grant more XP).
  const { data: existing, error: readErr } = await supabase
    .from("user_progress")
    .select("id, completed, xp_earned, completed_at")
    .eq("user_id", params.userId)
    .eq("lesson_id", params.lessonId)
    .maybeSingle();

  if (readErr) throw readErr;

  const previousXp = existing?.completed ? existing.xp_earned : 0;
  const xpDelta = Math.max(0, params.xpEarned - previousXp);

  const completedAt = new Date().toISOString();

  const { error: upsertErr } = await supabase
    .from("user_progress")
    .upsert(
      {
        user_id: params.userId,
        lesson_id: params.lessonId,
        path_slug: params.pathSlug,
        completed: true,
        attempts: params.attempts,
        xp_earned: Math.max(previousXp, params.xpEarned),
        completed_at: existing?.completed ? existing.completed_at ?? completedAt : completedAt,
      },
      { onConflict: "user_id,lesson_id" },
    );

  if (upsertErr) throw upsertErr;

  if (xpDelta > 0) {
    // Read-modify-write on total_xp. Two completions racing would lose at most
    // one delta; acceptable for MVP and avoids a Postgres function.
    const { data: u, error: readUserErr } = await supabase
      .from("users")
      .select("total_xp")
      .eq("id", params.userId)
      .maybeSingle();
    if (readUserErr) throw readUserErr;

    const newTotal = (u?.total_xp ?? 0) + xpDelta;
    const { error: bumpErr } = await supabase
      .from("users")
      .update({ total_xp: newTotal })
      .eq("id", params.userId);
    if (bumpErr) throw bumpErr;
  }

  return { xpDelta };
}
