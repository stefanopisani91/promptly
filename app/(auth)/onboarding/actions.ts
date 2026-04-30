"use server";

import { cookies } from "next/headers";
import { isDailyGoal, isLang, type DailyGoal, type Lang } from "@/types";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { sendWelcomeEmail } from "@/lib/notifications/email";
import { isValidReferralCode } from "@/lib/referral";
import { convertReferral, findReferrerByCode } from "@/lib/supabase/queries";

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
const NAME_MAX = 40;

export type CompleteOnboardingResult =
  | { ok: true }
  | { ok: false; error: "unauthorized" | "invalid_input" | "db_error" };

export interface CompleteOnboardingInput {
  fullName: string;
  language: Lang;
  dailyGoal: DailyGoal;
  signupSource?: string | null;
}

function sanitizeName(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim().replace(/\s+/g, " ");
  if (!trimmed) return null;
  if (trimmed.length > NAME_MAX) return null;
  if (!NAME_REGEX.test(trimmed)) return null;
  return trimmed;
}

function sanitizeSource(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  // Tight upper bound — UTM-style values, not free text.
  if (trimmed.length > 64) return null;
  if (!/^[a-zA-Z0-9_\-:.]+$/.test(trimmed)) return null;
  return trimmed;
}

export async function completeOnboarding(
  input: CompleteOnboardingInput,
): Promise<CompleteOnboardingResult> {
  const fullName = sanitizeName(input.fullName);
  if (!fullName) return { ok: false, error: "invalid_input" };
  if (!isLang(input.language)) return { ok: false, error: "invalid_input" };
  if (!isDailyGoal(input.dailyGoal)) return { ok: false, error: "invalid_input" };

  const supabase = createClient();
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  const user = userData?.user;
  if (userErr || !user || !user.email) {
    return { ok: false, error: "unauthorized" };
  }

  const signupSource = sanitizeSource(input.signupSource);
  const completedAt = new Date().toISOString();

  // Fetch the existing row (if any) so we can preserve created signup_source
  // for returning users who never finished onboarding.
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
        onboarding_completed_at: completedAt,
        signup_source: resolvedSource,
      },
      { onConflict: "id" },
    );

  if (upsertErr) {
    return { ok: false, error: "db_error" };
  }

  // Convert pending referral, if any. Best-effort — failures are logged
  // but don't break onboarding.
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
