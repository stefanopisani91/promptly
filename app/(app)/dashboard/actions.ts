"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  activateReferralLinkOnce,
  getOrCreateReferralCode,
  updateLastLevelUpNotified,
} from "@/lib/supabase/queries";
import { getLevelFromXP } from "@/lib/levels";
import { getReferralUrl, isValidReferralCode } from "@/lib/referral";
import { isLang, type Lang } from "@/types";

export type DismissWelcomeResult =
  | { ok: true }
  | { ok: false; error: "unauthorized" | "db_error" };

export async function dismissWelcome(): Promise<DismissWelcomeResult> {
  const supabase = createClient();
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  const user = userData?.user;
  if (userErr || !user) return { ok: false, error: "unauthorized" };

  const { error } = await supabase
    .from("users")
    .update({ welcome_seen_at: new Date().toISOString() })
    .eq("id", user.id);

  if (error) return { ok: false, error: "db_error" };

  revalidatePath("/dashboard");
  return { ok: true };
}

export type MarkLevelUpNotifiedResult =
  | { ok: true }
  | { ok: false; error: "unauthorized" | "invalid" | "db_error" };

/**
 * Persist that the user has seen the level-up modal up to `level`.
 * The level is verified server-side against the user's actual total_xp so
 * a tampered client can't pre-claim a level it hasn't earned.
 */
export async function markLevelUpNotified(
  level: number,
): Promise<MarkLevelUpNotifiedResult> {
  if (!Number.isInteger(level) || level < 1 || level > 7) {
    return { ok: false, error: "invalid" };
  }

  const supabase = createClient();
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  const user = userData?.user;
  if (userErr || !user) return { ok: false, error: "unauthorized" };

  const { data: profile, error: profileErr } = await supabase
    .from("users")
    .select("total_xp")
    .eq("id", user.id)
    .maybeSingle();
  if (profileErr || !profile) return { ok: false, error: "db_error" };

  // Cap at the level the user has actually earned — protects against a
  // client claiming a level it hasn't reached yet.
  const earnedLevel = getLevelFromXP(profile.total_xp);
  const capped = Math.min(level, earnedLevel);

  try {
    await updateLastLevelUpNotified(supabase, user.id, capped);
  } catch {
    return { ok: false, error: "db_error" };
  }

  revalidatePath("/dashboard");
  return { ok: true };
}

export type ActivateReferralLinkResult =
  | {
      ok: true;
      referralCode: string;
      referralUrl: string;
      xpAwarded: number;
      firstActivation: boolean;
    }
  | { ok: false; error: "unauthorized" | "db_error" };

/**
 * First call: ensures the user has a referral code, marks the link as
 * activated, grants +25 XP. Subsequent calls are idempotent and just
 * return the existing code/URL with `xpAwarded: 0`.
 */
export async function activateReferralLink(
  preferredLang?: Lang,
): Promise<ActivateReferralLinkResult> {
  const lang = isLang(preferredLang) ? preferredLang : null;

  const supabase = createClient();
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  const user = userData?.user;
  if (userErr || !user) return { ok: false, error: "unauthorized" };

  try {
    const { data: profile, error: profileErr } = await supabase
      .from("users")
      .select("full_name, language")
      .eq("id", user.id)
      .maybeSingle();
    if (profileErr) throw profileErr;

    const referralCode = await getOrCreateReferralCode(
      supabase,
      user.id,
      profile?.full_name ?? null,
    );
    const activation = await activateReferralLinkOnce(supabase, user.id);

    const resolvedLang = lang ?? (isLang(profile?.language) ? profile?.language : null);
    const referralUrl = getReferralUrl(referralCode, resolvedLang ?? null);

    if (activation.xpAwarded > 0) revalidatePath("/dashboard");

    return {
      ok: true,
      referralCode,
      referralUrl,
      xpAwarded: activation.xpAwarded,
      firstActivation: !activation.alreadyActive,
    };
  } catch {
    return { ok: false, error: "db_error" };
  }
}

const REFERRAL_PENDING_COOKIE = "promptly_referral_pending";

/**
 * Server action used by the marketing signup page to persist the
 * incoming `?ref=` value into a cookie that survives magic-link / OAuth
 * round-trips. Validates shape before writing.
 */
export async function persistPendingReferral(rawCode: string): Promise<void> {
  if (!isValidReferralCode(rawCode)) return;
  const { cookies } = await import("next/headers");
  cookies().set({
    name: REFERRAL_PENDING_COOKIE,
    value: rawCode,
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    sameSite: "lax",
    httpOnly: false, // not security-critical; allow client-read for diagnostics
    secure: process.env.NODE_ENV === "production",
  });
}
