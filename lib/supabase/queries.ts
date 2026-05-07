// Single home for Supabase queries (PROMPTLY.md rule #2). Components should
// never call `.from(...)` directly — funnel everything through helpers here so
// the schema/typing surface stays in one place.

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  isProfilePromises,
  type PathSlug,
  type ProfilePromises,
  type UserProfile,
  type UserProgress,
  type UserReferral,
} from "@/types";
import type { Database, Json } from "./types";
import { generateReferralCode } from "@/lib/referral";

export type AppSupabaseClient = SupabaseClient<Database>;

export type ProfileGate =
  | { state: "missing" }
  | { state: "incomplete"; profile: UserProfile }
  | { state: "complete"; profile: UserProfile };

const USER_PROFILE_COLUMNS =
  "id, email, full_name, language, daily_goal, onboarding_completed_at, signup_source, welcome_seen_at, push_prompted_at, ai_eval_prompted_at, total_xp, current_streak, longest_streak, last_activity_date, last_level_up_notified, referral_code, referral_link_activated_at, archetype_key, experience_level, project_clarity, project_description, tools_used, tools_other, preferred_tool, deep_motivation, promises, last_profile_check, created_at, updated_at";

export async function getUserProfile(
  supabase: AppSupabaseClient,
  userId: string,
): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from("users")
    .select(USER_PROFILE_COLUMNS)
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  // `tools_used` is `text[]` in pg; supabase returns it as `string[]` but
  // the JSON serialiser sometimes spits null for an empty array if the row
  // was inserted before the default kicked in. Normalise here so callers
  // never have to.
  const toolsUsed = Array.isArray(data.tools_used) ? data.tools_used : [];
  const promises = isProfilePromises(data.promises) ? data.promises : null;

  return {
    ...data,
    tools_used: toolsUsed,
    promises,
  } satisfies UserProfile;
}

// ─── Onboarding profilazione ────────────────────────────────────────
//
// Progressive save during the 12-step onboarding flow (Profilazione.md
// §"Salvataggio progressivo"). Each step calls saveOnboardingProgress with
// the fields it just collected. The user row is upserted so a freshly
// signed-up user gets created on the first call.
//
// Note: this does NOT set onboarding_completed_at — that's reserved for
// completeOnboarding (the final action in app/(auth)/onboarding/actions.ts).
// If the user closes the tab mid-flow the row stays partial and the next
// login restarts onboarding from STEP 1, sovrascrivendo i dati parziali —
// per spec.

export interface OnboardingProgressFields {
  full_name?: string;
  language?: "en" | "it";
  experience_level?: UserProfile["experience_level"];
  project_clarity?: UserProfile["project_clarity"];
  project_description?: string | null;
  tools_used?: string[];
  tools_other?: string | null;
  preferred_tool?: string | null;
  daily_goal?: UserProfile["daily_goal"];
  deep_motivation?: string | null;
  promises?: ProfilePromises | null;
}

export async function saveOnboardingProgress(
  supabase: AppSupabaseClient,
  params: { userId: string; email: string; fields: OnboardingProgressFields },
): Promise<void> {
  // ProfilePromises is a typed interface; the Database row column is Json
  // (open shape). Cast at the persistence boundary so we don't have to
  // weaken the type everywhere it's read.
  const { promises: promisesField, ...rest } = params.fields;
  const upsertRow = {
    id: params.userId,
    email: params.email,
    ...rest,
    ...(promisesField !== undefined
      ? { promises: promisesField as unknown as Json }
      : {}),
    updated_at: new Date().toISOString(),
  };
  const { error } = await supabase
    .from("users")
    .upsert(upsertRow, { onConflict: "id" });
  if (error) throw error;
}

/**
 * Persist new promises and bump last_profile_check. Used by both the final
 * onboarding step and the "Aggiorna le promesse" action in settings.
 */
export async function setUserPromises(
  supabase: AppSupabaseClient,
  userId: string,
  promises: ProfilePromises,
): Promise<void> {
  const { error } = await supabase
    .from("users")
    .update({
      promises: promises as unknown as Json,
      last_profile_check: new Date().toISOString(),
    })
    .eq("id", userId);
  if (error) throw error;
}

/**
 * Persist the level for which the user has just been shown the level-up
 * modal. Guard against decreasing values so an out-of-order request can't
 * re-arm a celebration the user already dismissed.
 */
export async function updateLastLevelUpNotified(
  supabase: AppSupabaseClient,
  userId: string,
  level: number,
): Promise<void> {
  const { data: current, error: readErr } = await supabase
    .from("users")
    .select("last_level_up_notified")
    .eq("id", userId)
    .maybeSingle();
  if (readErr) throw readErr;

  const previous = current?.last_level_up_notified ?? 1;
  if (level <= previous) return;

  const { error: updateErr } = await supabase
    .from("users")
    .update({ last_level_up_notified: level })
    .eq("id", userId);
  if (updateErr) throw updateErr;
}

// ─── XP grants (Dashboard V2 — Phase 2) ─────────────────────────────

/**
 * Read-modify-write `users.total_xp` by `amount`. Used for ad-hoc grants
 * outside the lesson flow (referral activation, conversion bonuses).
 *
 * Returns the new total. Pass a `client` argument to use the service-role
 * client for cross-user grants — the regular Supabase client would be
 * rejected by RLS for any user other than auth.uid().
 */
export async function grantXp(
  client: AppSupabaseClient,
  userId: string,
  amount: number,
): Promise<{ newTotal: number }> {
  if (amount === 0) {
    const { data, error } = await client
      .from("users")
      .select("total_xp")
      .eq("id", userId)
      .maybeSingle();
    if (error) throw error;
    return { newTotal: data?.total_xp ?? 0 };
  }

  const { data: existing, error: readErr } = await client
    .from("users")
    .select("total_xp")
    .eq("id", userId)
    .maybeSingle();
  if (readErr) throw readErr;

  const newTotal = Math.max(0, (existing?.total_xp ?? 0) + amount);
  const { error: writeErr } = await client
    .from("users")
    .update({ total_xp: newTotal })
    .eq("id", userId);
  if (writeErr) throw writeErr;

  return { newTotal };
}

// ─── Referral system (Dashboard V2 — Phase 2) ───────────────────────

const MAX_REFERRAL_CODE_GENERATION_RETRIES = 5;

/**
 * Read the user's referral code; lazily generate and persist one if missing.
 * Uses the unique index on `users.referral_code` to detect collisions —
 * regenerates with a fresh random suffix on conflict.
 */
export async function getOrCreateReferralCode(
  supabase: AppSupabaseClient,
  userId: string,
  fullName: string | null,
): Promise<string> {
  const { data: existing, error: readErr } = await supabase
    .from("users")
    .select("referral_code")
    .eq("id", userId)
    .maybeSingle();
  if (readErr) throw readErr;
  if (existing?.referral_code) return existing.referral_code;

  for (let attempt = 0; attempt < MAX_REFERRAL_CODE_GENERATION_RETRIES; attempt++) {
    const candidate = generateReferralCode(fullName);
    const { error: updateErr } = await supabase
      .from("users")
      .update({ referral_code: candidate })
      .eq("id", userId);

    if (!updateErr) return candidate;

    // Postgres unique-violation surfaces as code 23505. Retry with a new
    // random suffix; bail out on any other error.
    const code = (updateErr as { code?: string }).code;
    if (code !== "23505") throw updateErr;
  }

  throw new Error("Failed to generate a unique referral code after retries");
}

export interface ReferralStats {
  count: number;
  activatedAt: string | null;
}

/**
 * One-shot read of (number of converted referrals, activation timestamp).
 */
export async function getReferralStats(
  supabase: AppSupabaseClient,
  userId: string,
): Promise<ReferralStats> {
  // Run the two reads in parallel — both are cheap and independent.
  const [countResult, profileResult] = await Promise.all([
    supabase
      .from("user_referrals")
      .select("id", { count: "exact", head: true })
      .eq("referrer_id", userId),
    supabase
      .from("users")
      .select("referral_link_activated_at")
      .eq("id", userId)
      .maybeSingle(),
  ]);

  if (countResult.error) throw countResult.error;
  if (profileResult.error) throw profileResult.error;

  return {
    count: countResult.count ?? 0,
    activatedAt: profileResult.data?.referral_link_activated_at ?? null,
  };
}

export interface ActivationResult {
  alreadyActive: boolean;
  xpAwarded: number; // 25 on first activation, 0 otherwise
}

/**
 * Mark the referral link as activated. Idempotent — only the first call
 * grants the +25 XP bonus and writes the timestamp.
 */
export async function activateReferralLinkOnce(
  supabase: AppSupabaseClient,
  userId: string,
): Promise<ActivationResult> {
  const { data, error: readErr } = await supabase
    .from("users")
    .select("referral_link_activated_at")
    .eq("id", userId)
    .maybeSingle();
  if (readErr) throw readErr;
  if (data?.referral_link_activated_at) {
    return { alreadyActive: true, xpAwarded: 0 };
  }

  const { error: stampErr } = await supabase
    .from("users")
    .update({ referral_link_activated_at: new Date().toISOString() })
    .eq("id", userId);
  if (stampErr) throw stampErr;

  await grantXp(supabase, userId, 25);

  return { alreadyActive: false, xpAwarded: 25 };
}

export interface ReferrerLookup {
  id: string;
  email: string;
  full_name: string | null;
}

export async function findReferrerByCode(
  supabase: AppSupabaseClient,
  referralCode: string,
): Promise<ReferrerLookup | null> {
  const { data, error } = await supabase
    .from("users")
    .select("id, email, full_name")
    .eq("referral_code", referralCode)
    .maybeSingle();
  if (error) throw error;
  return data ?? null;
}

// Anti-farm cap from DASHBOARD_V2.md §4 — beyond this many converted
// referrals a single account stops receiving the +300 XP grant. The row
// is still recorded so unlock thresholds keep working for the referee.
export const REFERRAL_REWARD_CAP = 10;

export interface ConvertReferralInput {
  referrerId: string;
  refereeId: string;
  refereeEmail: string;
}

export interface ConvertReferralResult {
  inserted: boolean;
  referrerXpAwarded: number;
  refereeXpAwarded: number;
}

/**
 * Atomically register a converted referral. Handles:
 *   - self-referral guard (referrer ≠ referee)
 *   - email-equality guard (same email can't refer themselves via aliases)
 *   - rate-limit cap on referrer XP
 *   - duplicate referral (UNIQUE on referee_id) → silent no-op
 *
 * Caller is responsible for using a service-role client so the cross-user
 * UPDATE on the referrer's row passes RLS.
 */
export async function convertReferral(
  serviceClient: AppSupabaseClient,
  input: ConvertReferralInput,
): Promise<ConvertReferralResult> {
  const { referrerId, refereeId, refereeEmail } = input;

  if (referrerId === refereeId) {
    return { inserted: false, referrerXpAwarded: 0, refereeXpAwarded: 0 };
  }

  // Same-email guard: a user creating a second account to self-refer.
  const { data: referrer, error: referrerErr } = await serviceClient
    .from("users")
    .select("id, email")
    .eq("id", referrerId)
    .maybeSingle();
  if (referrerErr) throw referrerErr;
  if (!referrer) {
    return { inserted: false, referrerXpAwarded: 0, refereeXpAwarded: 0 };
  }
  if (referrer.email.toLowerCase() === refereeEmail.toLowerCase()) {
    return { inserted: false, referrerXpAwarded: 0, refereeXpAwarded: 0 };
  }

  // Insert the referral row. UNIQUE(referee_id) makes this idempotent —
  // a duplicate insert is silently treated as "already converted".
  const { error: insertErr } = await serviceClient
    .from("user_referrals")
    .insert({ referrer_id: referrerId, referee_id: refereeId });
  if (insertErr) {
    const code = (insertErr as { code?: string }).code;
    if (code === "23505") {
      return { inserted: false, referrerXpAwarded: 0, refereeXpAwarded: 0 };
    }
    throw insertErr;
  }

  // Rate limit: count referrals already credited to the referrer.
  const { count, error: countErr } = await serviceClient
    .from("user_referrals")
    .select("id", { count: "exact", head: true })
    .eq("referrer_id", referrerId);
  if (countErr) throw countErr;

  const withinCap = (count ?? 0) <= REFERRAL_REWARD_CAP;
  const referrerXp = withinCap ? 300 : 0;

  await Promise.all([
    referrerXp > 0 ? grantXp(serviceClient, referrerId, referrerXp) : Promise.resolve(),
    grantXp(serviceClient, refereeId, 50),
  ]);

  return {
    inserted: true,
    referrerXpAwarded: referrerXp,
    refereeXpAwarded: 50,
  };
}

export async function getUserReferrals(
  supabase: AppSupabaseClient,
  userId: string,
): Promise<UserReferral[]> {
  const { data, error } = await supabase
    .from("user_referrals")
    .select(
      "id, referrer_id, referee_id, xp_awarded_referrer, xp_awarded_referee, created_at",
    )
    .eq("referrer_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as UserReferral[];
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

const USER_PROGRESS_COLUMNS =
  "id, user_id, lesson_id, path_slug, completed, attempts, xp_earned, completed_at, current_step, step_state, spark_chat_count, created_at, updated_at";

export async function getProgressForPath(
  supabase: AppSupabaseClient,
  userId: string,
  pathSlug: PathSlug,
): Promise<UserProgress[]> {
  const { data, error } = await supabase
    .from("user_progress")
    .select(USER_PROGRESS_COLUMNS)
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
    .select(USER_PROGRESS_COLUMNS)
    .eq("user_id", userId);

  if (error) throw error;
  return (data ?? []) as UserProgress[];
}

/**
 * Read the persisted lesson state for a single (user, lesson) — drives the
 * "resume where you left off" behaviour for V3 lessons. Returns null when
 * the user has never opened the lesson.
 */
export async function getLessonProgress(
  supabase: AppSupabaseClient,
  userId: string,
  lessonId: string,
): Promise<UserProgress | null> {
  const { data, error } = await supabase
    .from("user_progress")
    .select(USER_PROGRESS_COLUMNS)
    .eq("user_id", userId)
    .eq("lesson_id", lessonId)
    .maybeSingle();
  if (error) throw error;
  return (data as UserProgress | null) ?? null;
}

/**
 * Persist the user's progress through a V3 lesson without marking it
 * completed. Called by the autosave that runs on every step transition.
 * `step_state` is replaced wholesale — callers send the full bag.
 */
export async function upsertLessonProgressState(
  supabase: AppSupabaseClient,
  params: {
    userId: string;
    lessonId: string;
    pathSlug: PathSlug;
    currentStep: number;
    stepState: Record<string, unknown>;
  },
): Promise<void> {
  const { error } = await supabase
    .from("user_progress")
    .upsert(
      {
        user_id: params.userId,
        lesson_id: params.lessonId,
        path_slug: params.pathSlug,
        current_step: params.currentStep,
        step_state: params.stepState as never,
      },
      { onConflict: "user_id,lesson_id" },
    );
  if (error) throw error;
}

/**
 * Atomically increment `spark_chat_count` for a (user, lesson) row, returning
 * the new count. Creates the row with count=1 if the user hadn't opened the
 * lesson yet. The API route enforces the per-lesson 5-message quota using
 * this counter.
 */
export async function incrementSparkChatCount(
  supabase: AppSupabaseClient,
  params: { userId: string; lessonId: string; pathSlug: PathSlug },
): Promise<{ count: number }> {
  const { data: existing, error: readErr } = await supabase
    .from("user_progress")
    .select("id, spark_chat_count")
    .eq("user_id", params.userId)
    .eq("lesson_id", params.lessonId)
    .maybeSingle();
  if (readErr) throw readErr;

  const newCount = (existing?.spark_chat_count ?? 0) + 1;
  const { error: writeErr } = await supabase
    .from("user_progress")
    .upsert(
      {
        user_id: params.userId,
        lesson_id: params.lessonId,
        path_slug: params.pathSlug,
        spark_chat_count: newCount,
      },
      { onConflict: "user_id,lesson_id" },
    );
  if (writeErr) throw writeErr;
  return { count: newCount };
}

/**
 * Persist the user's archetype key once they reveal their result in the
 * Lesson 1 quiz. Idempotent — overwriting with the same key is a no-op
 * write but never throws. We don't expose a "clear" path on purpose.
 */
export async function setUserArchetype(
  supabase: AppSupabaseClient,
  userId: string,
  archetypeKey: string,
): Promise<void> {
  const { error } = await supabase
    .from("users")
    .update({ archetype_key: archetypeKey })
    .eq("id", userId);
  if (error) throw error;
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

// ─────────────────────────────────────────────────────────────────────────
// Spark — daily rate limit + safety log (Sessione 3, Master Config §6)
// ─────────────────────────────────────────────────────────────────────────

/**
 * Today's UTC date as YYYY-MM-DD. Used as the natural key for the
 * spark_usage_daily counter. UTC chosen over local timezone because we
 * don't store a per-user timezone reliably; the cost of a few hours of
 * "early reset" for users in CET/EST is acceptable for the simplicity.
 */
export function todayUtcDate(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Read today's Spark message count for a user. Returns 0 when the row
 * doesn't exist yet (first message of the day).
 */
export async function getDailySparkUsage(
  supabase: AppSupabaseClient,
  userId: string,
  date: string,
): Promise<number> {
  const { data, error } = await supabase
    .from("spark_usage_daily")
    .select("message_count")
    .eq("user_id", userId)
    .eq("usage_date", date)
    .maybeSingle();
  if (error) throw error;
  return data?.message_count ?? 0;
}

/**
 * Read-then-write counter increment, mirroring the per-lesson
 * incrementSparkChatCount style above. A double-click race could let a
 * user squeeze in one extra message; acceptable at our volumes and
 * consistent with the existing per-lesson behaviour.
 */
export async function incrementDailySparkUsage(
  supabase: AppSupabaseClient,
  params: { userId: string; date: string },
): Promise<{ count: number }> {
  const { data: existing, error: readErr } = await supabase
    .from("spark_usage_daily")
    .select("message_count")
    .eq("user_id", params.userId)
    .eq("usage_date", params.date)
    .maybeSingle();
  if (readErr) throw readErr;

  const newCount = (existing?.message_count ?? 0) + 1;
  const { error: writeErr } = await supabase.from("spark_usage_daily").upsert(
    {
      user_id: params.userId,
      usage_date: params.date,
      message_count: newCount,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,usage_date" },
  );
  if (writeErr) throw writeErr;
  return { count: newCount };
}

// ─── Promise generation rate limit (Round 8b) ─────────────────────────
//
// Mirrors the Spark daily counter pattern but uses a separate column on
// the same row so chat usage and promise spend don't compete for the
// same quota. The two counters share user_id + usage_date as the natural
// key, so a single upsert handles either.

export async function getDailyPromiseRegenCount(
  supabase: AppSupabaseClient,
  userId: string,
  date: string,
): Promise<number> {
  const { data, error } = await supabase
    .from("spark_usage_daily")
    .select("promise_regen_count")
    .eq("user_id", userId)
    .eq("usage_date", date)
    .maybeSingle();
  if (error) throw error;
  return data?.promise_regen_count ?? 0;
}

export async function incrementDailyPromiseRegenCount(
  supabase: AppSupabaseClient,
  params: { userId: string; date: string },
): Promise<{ count: number }> {
  const { data: existing, error: readErr } = await supabase
    .from("spark_usage_daily")
    .select("promise_regen_count")
    .eq("user_id", params.userId)
    .eq("usage_date", params.date)
    .maybeSingle();
  if (readErr) throw readErr;

  const newCount = (existing?.promise_regen_count ?? 0) + 1;
  const { error: writeErr } = await supabase.from("spark_usage_daily").upsert(
    {
      user_id: params.userId,
      usage_date: params.date,
      promise_regen_count: newCount,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,usage_date" },
  );
  if (writeErr) throw writeErr;
  return { count: newCount };
}

// ─── Lesson 2 — CLAUDE.md daily attempts counter ───────────────────────
//
// Same shape as the promise_regen counter above: a third column on
// spark_usage_daily, read-then-write upsert. Sits on the same natural key
// (user_id, usage_date) so all "daily AI usage" counters live on one row.

export async function getDailyClaudemdAttemptCount(
  supabase: AppSupabaseClient,
  userId: string,
  date: string,
): Promise<number> {
  const { data, error } = await supabase
    .from("spark_usage_daily")
    .select("claudemd_attempts_count")
    .eq("user_id", userId)
    .eq("usage_date", date)
    .maybeSingle();
  if (error) throw error;
  return data?.claudemd_attempts_count ?? 0;
}

export async function incrementDailyClaudemdAttemptCount(
  supabase: AppSupabaseClient,
  params: { userId: string; date: string },
): Promise<{ count: number }> {
  const { data: existing, error: readErr } = await supabase
    .from("spark_usage_daily")
    .select("claudemd_attempts_count")
    .eq("user_id", params.userId)
    .eq("usage_date", params.date)
    .maybeSingle();
  if (readErr) throw readErr;

  const newCount = (existing?.claudemd_attempts_count ?? 0) + 1;
  const { error: writeErr } = await supabase.from("spark_usage_daily").upsert(
    {
      user_id: params.userId,
      usage_date: params.date,
      claudemd_attempts_count: newCount,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,usage_date" },
  );
  if (writeErr) throw writeErr;
  return { count: newCount };
}

const SAFETY_EXCERPT_MAX_CHARS = 200;

/**
 * Append-only insert into the safety log. Excerpt is clamped to 200 chars
 * here so we never store the full message. Caller passes the raw user
 * input; this helper does the trim. Fire-and-forget at the call site:
 * a logging failure must not block the chat reply.
 */
export async function logSafetyEvent(
  supabase: AppSupabaseClient,
  params: {
    userId: string;
    lessonId?: string | null;
    signal: string;
    excerpt: string;
  },
): Promise<void> {
  const excerpt =
    params.excerpt.length > SAFETY_EXCERPT_MAX_CHARS
      ? params.excerpt.slice(0, SAFETY_EXCERPT_MAX_CHARS)
      : params.excerpt;
  const { error } = await supabase.from("spark_safety_log").insert({
    user_id: params.userId,
    lesson_id: params.lessonId ?? null,
    signal: params.signal,
    excerpt,
  });
  if (error) throw error;
}
