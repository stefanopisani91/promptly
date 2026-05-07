"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  isDailyGoal,
  isExperienceLevel,
  isLang,
  isProfilePromises,
  isProjectClarity,
  type DailyGoal,
  type ExperienceLevel,
  type Lang,
  type ProfilePromises,
  type ProjectClarity,
} from "@/types";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { sendWelcomeEmail } from "@/lib/notifications/email";
import { isValidReferralCode } from "@/lib/referral";
import {
  convertReferral,
  findReferrerByCode,
  getDailyPromiseRegenCount,
  incrementDailyPromiseRegenCount,
  saveOnboardingProgress,
  setUserPromises,
  todayUtcDate,
  type OnboardingProgressFields,
} from "@/lib/supabase/queries";
import { sanitiseToolSlugs, isToolSlug } from "@/lib/onboarding/tools";
import { generateProfilePromises } from "@/lib/ai/promises";

// ─── Anti-abuse for promise generation (Round 8b) ─────────────────────
//
// Two layers protect the Anthropic call from being abused via the
// "Aggiorna le promesse di Spark" button or repeated "Rifai la
// profilazione" runs:
//
//   • PROMISE_COOLDOWN_MS — a minimum interval between two successful
//     generations for the same user. Defends against double-click, fast
//     scripted regenerations and accidental re-fires. Skipped when the
//     user has no `promises` row yet (first-ever generation at the end
//     of onboarding must always succeed).
//   • PROMISE_DAILY_CAP — hard ceiling per UTC day, counted on
//     spark_usage_daily.promise_regen_count. Applies to ALL generations
//     including the first one, so a user who completes onboarding has
//     PROMISE_DAILY_CAP - 1 regenerations left for the day.
//
// Backstop: ANTHROPIC console-level spending cap (configured manually,
// see Promptly_Spark_Master_Configuration.md §6).
const PROMISE_COOLDOWN_MS = 60 * 1000;
const PROMISE_DAILY_CAP = 5;

const REFERRAL_PENDING_COOKIE = "promptly_referral_pending";

interface ReferralOutcome {
  inserted: boolean;
  referrerXpAwarded: number;
  refereeXpAwarded: number;
}

/**
 * Best-effort referral conversion. Never throws — the welcome path must
 * not fail just because a referral lookup hiccupped.
 */
async function tryConvertPendingReferral(params: {
  refereeId: string;
  refereeEmail: string;
}): Promise<ReferralOutcome | null> {
  const cookieStore = cookies();
  const raw = cookieStore.get(REFERRAL_PENDING_COOKIE)?.value;
  if (!raw) return null;

  // Always clear the cookie — even if the code is malformed or the
  // conversion is rejected — so subsequent renders don't keep retrying.
  cookieStore.set({
    name: REFERRAL_PENDING_COOKIE,
    value: "",
    path: "/",
    maxAge: 0,
  });

  if (!isValidReferralCode(raw)) return null;

  try {
    const service = createServiceClient();
    const referrer = await findReferrerByCode(service, raw);
    if (!referrer || referrer.id === params.refereeId) return null;

    return await convertReferral(service, {
      referrerId: referrer.id,
      refereeId: params.refereeId,
      refereeEmail: params.refereeEmail,
    });
  } catch (error) {
    console.error("[referral] conversion failed", error);
    return null;
  }
}

const NAME_REGEX = /^[\p{L}\p{N}\s\-']+$/u;
const NAME_MAX = 30;
const NAME_MIN = 2;
const PROJECT_DESCRIPTION_MAX = 300;
const PROJECT_DESCRIPTION_MIN = 10;
const TOOLS_OTHER_MAX = 100;
const DEEP_MOTIVATION_MAX = 500;
const DEEP_MOTIVATION_MIN = 15;

function sanitizeName(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim().replace(/\s+/g, " ");
  if (trimmed.length < NAME_MIN) return null;
  if (trimmed.length > NAME_MAX) return null;
  if (!NAME_REGEX.test(trimmed)) return null;
  return trimmed;
}

function sanitizeFreeText(
  raw: unknown,
  opts: { min: number; max: number; allowEmpty?: boolean },
): string | null {
  if (raw == null && opts.allowEmpty) return null;
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (trimmed.length === 0) return opts.allowEmpty ? null : null;
  if (trimmed.length < opts.min) return null;
  if (trimmed.length > opts.max) return null;
  return trimmed;
}

function sanitizeToolsOther(raw: unknown): string | null {
  if (raw == null) return null;
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (trimmed.length === 0) return null;
  if (trimmed.length > TOOLS_OTHER_MAX) return trimmed.slice(0, TOOLS_OTHER_MAX);
  return trimmed;
}

function sanitizeSource(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (trimmed.length > 64) return null;
  if (!/^[a-zA-Z0-9_\-:.]+$/.test(trimmed)) return null;
  return trimmed;
}

// ─── saveOnboardingStep ──────────────────────────────────────────────
//
// Progressive save called between every step (Profilazione.md §"Architettura
// tecnica" → §"Salvataggio progressivo"). Each call carries only the field(s)
// the step just collected. Validation is permissive — null fields are simply
// not written; the strict gate is in completeOnboarding below.

export type SaveStepResult =
  | { ok: true }
  | { ok: false; error: "unauthorized" | "invalid_input" | "db_error" };

export interface SaveStepInput {
  language?: string;
  full_name?: string;
  experience_level?: string;
  project_clarity?: string;
  project_description?: string | null;
  tools_used?: string[];
  tools_other?: string | null;
  preferred_tool?: string | null;
  daily_goal?: string;
  deep_motivation?: string | null;
}

export async function saveOnboardingStep(
  input: SaveStepInput,
): Promise<SaveStepResult> {
  const supabase = createClient();
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  const user = userData?.user;
  if (userErr || !user || !user.email) {
    return { ok: false, error: "unauthorized" };
  }

  const fields: OnboardingProgressFields = {};

  if (input.language !== undefined) {
    if (!isLang(input.language)) return { ok: false, error: "invalid_input" };
    fields.language = input.language;
  }
  if (input.full_name !== undefined) {
    const name = sanitizeName(input.full_name);
    if (!name) return { ok: false, error: "invalid_input" };
    fields.full_name = name;
  }
  if (input.experience_level !== undefined) {
    if (!isExperienceLevel(input.experience_level)) {
      return { ok: false, error: "invalid_input" };
    }
    fields.experience_level = input.experience_level;
  }
  if (input.project_clarity !== undefined) {
    if (!isProjectClarity(input.project_clarity)) {
      return { ok: false, error: "invalid_input" };
    }
    fields.project_clarity = input.project_clarity;
  }
  if (input.project_description !== undefined) {
    if (input.project_description === null) {
      fields.project_description = null;
    } else {
      const desc = sanitizeFreeText(input.project_description, {
        min: PROJECT_DESCRIPTION_MIN,
        max: PROJECT_DESCRIPTION_MAX,
      });
      if (!desc) return { ok: false, error: "invalid_input" };
      fields.project_description = desc;
    }
  }
  if (input.tools_used !== undefined) {
    fields.tools_used = sanitiseToolSlugs(input.tools_used);
  }
  if (input.tools_other !== undefined) {
    fields.tools_other = sanitizeToolsOther(input.tools_other);
  }
  if (input.preferred_tool !== undefined) {
    if (input.preferred_tool === null || input.preferred_tool === "") {
      fields.preferred_tool = null;
    } else if (isToolSlug(input.preferred_tool)) {
      fields.preferred_tool = input.preferred_tool;
    } else {
      return { ok: false, error: "invalid_input" };
    }
  }
  if (input.daily_goal !== undefined) {
    if (!isDailyGoal(input.daily_goal)) {
      return { ok: false, error: "invalid_input" };
    }
    fields.daily_goal = input.daily_goal;
  }
  if (input.deep_motivation !== undefined) {
    if (input.deep_motivation === null) {
      fields.deep_motivation = null;
    } else {
      const motivation = sanitizeFreeText(input.deep_motivation, {
        min: DEEP_MOTIVATION_MIN,
        max: DEEP_MOTIVATION_MAX,
      });
      if (!motivation) return { ok: false, error: "invalid_input" };
      fields.deep_motivation = motivation;
    }
  }

  if (Object.keys(fields).length === 0) {
    return { ok: true };
  }

  try {
    await saveOnboardingProgress(supabase, {
      userId: user.id,
      email: user.email,
      fields,
    });
    return { ok: true };
  } catch (err) {
    console.error("[onboarding] saveOnboardingStep failed", err);
    return { ok: false, error: "db_error" };
  }
}

// ─── generatePromises ────────────────────────────────────────────────
//
// Calls Anthropic via lib/ai/promises.ts and persists the result. Wrapped
// in a server action so the caller (the OnboardingShell) gets a typed
// return + automatic auth gating.

export type GeneratePromisesResult =
  | { ok: true; promises: ProfilePromises; fallback: boolean }
  | { ok: false; error: "unauthorized" | "invalid_input" | "db_error" }
  | { ok: false; error: "cooldown"; retryInSeconds: number }
  | {
      ok: false;
      error: "daily_cap";
      limit: number;
      // ISO timestamp of next UTC midnight — UI can render a "torna domani"
      // message without re-computing the reset time client-side.
      resetAt: string;
    };

interface GeneratePromisesInput {
  language: Lang;
  user_name: string;
  experience_level: ExperienceLevel;
  project_clarity: ProjectClarity;
  project_description: string | null;
  tools_used: string[];
  preferred_tool: string | null;
  daily_goal: DailyGoal;
  deep_motivation: string;
}

export async function generatePromises(
  input: GeneratePromisesInput,
): Promise<GeneratePromisesResult> {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user || !user.email) {
    return { ok: false, error: "unauthorized" };
  }

  if (
    !isLang(input.language) ||
    !sanitizeName(input.user_name) ||
    !isExperienceLevel(input.experience_level) ||
    !isProjectClarity(input.project_clarity) ||
    !isDailyGoal(input.daily_goal) ||
    typeof input.deep_motivation !== "string" ||
    input.deep_motivation.trim().length < DEEP_MOTIVATION_MIN
  ) {
    return { ok: false, error: "invalid_input" };
  }

  // ─── Anti-abuse gates ────────────────────────────────────────────
  //
  // We pull both the existing promises (for the cooldown's "is this a
  // first-time generation?" branch) and the daily counter in two cheap
  // reads. Doing them BEFORE the Anthropic call means a spammed button
  // never triggers an actual model spend.

  const today = todayUtcDate();

  let dailyCount: number;
  try {
    dailyCount = await getDailyPromiseRegenCount(supabase, user.id, today);
  } catch (err) {
    console.error("[onboarding] getDailyPromiseRegenCount failed", err);
    return { ok: false, error: "db_error" };
  }

  if (dailyCount >= PROMISE_DAILY_CAP) {
    return {
      ok: false,
      error: "daily_cap",
      limit: PROMISE_DAILY_CAP,
      resetAt: nextUtcMidnightIso(),
    };
  }

  // Cooldown only kicks in when the user already has a `promises` row —
  // i.e. this is a regeneration, not the first-ever generation at the
  // end of onboarding. We use users.last_profile_check (already updated
  // every time setUserPromises runs) as the timestamp of the last call.
  const { data: profileRow, error: profileErr } = await supabase
    .from("users")
    .select("promises, last_profile_check")
    .eq("id", user.id)
    .maybeSingle();
  if (profileErr) {
    console.error("[onboarding] generatePromises profile read failed", profileErr);
    return { ok: false, error: "db_error" };
  }

  if (
    profileRow?.last_profile_check &&
    isProfilePromises(profileRow.promises)
  ) {
    const elapsedMs =
      Date.now() - new Date(profileRow.last_profile_check).getTime();
    if (elapsedMs < PROMISE_COOLDOWN_MS) {
      return {
        ok: false,
        error: "cooldown",
        retryInSeconds: Math.max(
          1,
          Math.ceil((PROMISE_COOLDOWN_MS - elapsedMs) / 1000),
        ),
      };
    }
  }

  // ─── Anthropic call (always resolves, falls back internally) ────

  const result = await generateProfilePromises({
    language: input.language,
    user_name: input.user_name.trim(),
    experience_level: input.experience_level,
    project_clarity: input.project_clarity,
    project_description: input.project_description,
    tools_used: sanitiseToolSlugs(input.tools_used),
    preferred_tool:
      input.preferred_tool && isToolSlug(input.preferred_tool)
        ? input.preferred_tool
        : null,
    daily_goal: input.daily_goal,
    deep_motivation: input.deep_motivation.trim(),
  });

  try {
    await setUserPromises(supabase, user.id, result.promises);
  } catch (err) {
    console.error("[onboarding] setUserPromises failed", err);
    return { ok: false, error: "db_error" };
  }

  // Count this generation toward today's cap. Only on success — failed
  // model calls (which fall back to the static set) still count, because
  // the spend was attempted and the static set IS what the user gets.
  // Best-effort: a counter write failure shouldn't refuse a result we
  // already produced.
  try {
    await incrementDailyPromiseRegenCount(supabase, {
      userId: user.id,
      date: today,
    });
  } catch (err) {
    console.error("[onboarding] incrementDailyPromiseRegenCount failed", err);
  }

  return {
    ok: true,
    promises: result.promises,
    fallback: result.promises.source === "fallback",
  };
}

/**
 * ISO 8601 timestamp of the next UTC midnight. Used in daily_cap errors
 * so the UI can present a "next reset" without doing date math itself.
 */
function nextUtcMidnightIso(): string {
  const now = new Date();
  const next = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + 1,
      0,
      0,
      0,
      0,
    ),
  );
  return next.toISOString();
}

// ─── completeOnboarding ──────────────────────────────────────────────
//
// Final action — invoked from STEP 12 right before redirecting to the
// dashboard. Validates the full required field set (per Profilazione.md
// §"Errori da evitare"), stamps onboarding_completed_at, fires welcome
// email + referral conversion (best-effort), and returns ok=true.

export type CompleteOnboardingResult =
  | { ok: true }
  | { ok: false; error: "unauthorized" | "invalid_input" | "db_error" };

export interface CompleteOnboardingInput {
  fullName: string;
  language: Lang;
  dailyGoal: DailyGoal;
  experienceLevel: ExperienceLevel;
  projectClarity: ProjectClarity;
  projectDescription: string | null;
  toolsUsed: string[];
  toolsOther: string | null;
  preferredTool: string | null;
  deepMotivation: string;
  signupSource?: string | null;
}

export async function completeOnboarding(
  input: CompleteOnboardingInput,
): Promise<CompleteOnboardingResult> {
  const fullName = sanitizeName(input.fullName);
  if (!fullName) return { ok: false, error: "invalid_input" };
  if (!isLang(input.language)) return { ok: false, error: "invalid_input" };
  if (!isDailyGoal(input.dailyGoal)) return { ok: false, error: "invalid_input" };
  if (!isExperienceLevel(input.experienceLevel)) {
    return { ok: false, error: "invalid_input" };
  }
  if (!isProjectClarity(input.projectClarity)) {
    return { ok: false, error: "invalid_input" };
  }

  // project_description is required when clarity ≠ "exploring".
  let projectDescription: string | null = null;
  if (input.projectClarity !== "exploring") {
    projectDescription = sanitizeFreeText(input.projectDescription, {
      min: PROJECT_DESCRIPTION_MIN,
      max: PROJECT_DESCRIPTION_MAX,
    });
    if (!projectDescription) return { ok: false, error: "invalid_input" };
  }

  const toolsUsed = sanitiseToolSlugs(input.toolsUsed);
  const toolsOther = sanitizeToolsOther(input.toolsOther);
  let preferredTool: string | null = null;
  if (input.preferredTool && input.preferredTool.length > 0) {
    if (!isToolSlug(input.preferredTool)) {
      return { ok: false, error: "invalid_input" };
    }
    preferredTool = input.preferredTool;
  }

  const deepMotivation = sanitizeFreeText(input.deepMotivation, {
    min: DEEP_MOTIVATION_MIN,
    max: DEEP_MOTIVATION_MAX,
  });
  if (!deepMotivation) return { ok: false, error: "invalid_input" };

  const supabase = createClient();
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  const user = userData?.user;
  if (userErr || !user || !user.email) {
    return { ok: false, error: "unauthorized" };
  }

  const signupSource = sanitizeSource(input.signupSource);
  const completedAt = new Date().toISOString();

  // Preserve existing signup_source for users who never finished onboarding.
  const { data: existing, error: fetchErr } = await supabase
    .from("users")
    .select("id, signup_source")
    .eq("id", user.id)
    .maybeSingle();

  if (fetchErr) {
    return { ok: false, error: "db_error" };
  }

  const resolvedSource = existing?.signup_source ?? signupSource ?? null;

  const { error: upsertErr } = await supabase
    .from("users")
    .upsert(
      {
        id: user.id,
        email: user.email,
        full_name: fullName,
        language: input.language,
        daily_goal: input.dailyGoal,
        experience_level: input.experienceLevel,
        project_clarity: input.projectClarity,
        project_description: projectDescription,
        tools_used: toolsUsed,
        tools_other: toolsOther,
        preferred_tool: preferredTool,
        deep_motivation: deepMotivation,
        onboarding_completed_at: completedAt,
        last_profile_check: completedAt,
        signup_source: resolvedSource,
      },
      { onConflict: "id" },
    );

  if (upsertErr) {
    return { ok: false, error: "db_error" };
  }

  // Convert pending referral, if any. Best-effort — failures are logged.
  await tryConvertPendingReferral({
    refereeId: user.id,
    refereeEmail: user.email,
  });

  // Fire welcome email — never block onboarding on email delivery.
  try {
    const result = await sendWelcomeEmail({
      to: user.email,
      name: fullName,
      lang: input.language,
    });
    if (!result.ok) {
      console.error("[welcome-email] send failed", {
        reason: result.reason,
        error: result.error,
      });
    }
  } catch (error) {
    console.error("[welcome-email] threw", error);
  }

  return { ok: true };
}

// ─── regeneratePromises (settings) ───────────────────────────────────
//
// Settings page lets the user explicitly request a fresh AI pass. Reads
// the persisted profile, calls Anthropic, persists. Failures fall back to
// the static promise set so the user is never left with a blank card.

export async function regeneratePromisesFromProfile(): Promise<GeneratePromisesResult> {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) return { ok: false, error: "unauthorized" };

  const { data: row, error } = await supabase
    .from("users")
    .select(
      "full_name, language, experience_level, project_clarity, project_description, tools_used, preferred_tool, daily_goal, deep_motivation",
    )
    .eq("id", user.id)
    .maybeSingle();

  if (error || !row) return { ok: false, error: "db_error" };
  if (
    !row.full_name ||
    !isLang(row.language) ||
    !isExperienceLevel(row.experience_level) ||
    !isProjectClarity(row.project_clarity) ||
    !isDailyGoal(row.daily_goal) ||
    !row.deep_motivation
  ) {
    return { ok: false, error: "invalid_input" };
  }

  return generatePromises({
    language: row.language,
    user_name: row.full_name,
    experience_level: row.experience_level,
    project_clarity: row.project_clarity,
    project_description: row.project_description,
    tools_used: Array.isArray(row.tools_used) ? row.tools_used : [],
    preferred_tool: row.preferred_tool,
    daily_goal: row.daily_goal,
    deep_motivation: row.deep_motivation,
  });
}

// ─── restartOnboarding (settings) ────────────────────────────────────
//
// Backs the "↻ Rifai la profilazione" link in /settings/profile. Clears
// `onboarding_completed_at` so the (auth)/onboarding page guard lets the
// user back into the flow, then redirects there. The user's profile
// fields stay populated — they'll be overwritten step by step as the
// flow advances. This action does NOT call Anthropic itself; the
// promise-generation rate limit kicks in only when the user actually
// reaches STEP 11 of the new run.
//
// Used as a `<form action={restartOnboarding}>` target, so it must
// either redirect or throw — `next/navigation`'s `redirect()` does
// exactly that.

export async function restartOnboarding(): Promise<void> {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) {
    redirect("/auth");
  }

  const { error } = await supabase
    .from("users")
    .update({ onboarding_completed_at: null })
    .eq("id", user.id);
  if (error) {
    console.error("[onboarding] restartOnboarding failed", error);
    // Send the user back to settings with an error indicator. We don't
    // expose the DB error to the client — the settings page can read the
    // query string and show a generic toast if needed.
    redirect("/settings/profile?restart=error");
  }

  redirect("/onboarding?source=restart");
}
