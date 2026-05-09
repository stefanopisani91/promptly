// Rate limits keyed on users.account_type.
//
// One source of truth for every API route that gates AI calls. Routes
// resolve the user's tier with `getLimitsForUser`, then check against
// the relevant field. `Infinity` means "skip the check AND the
// increment" — qa/dev sessions don't pollute the counter tables.
//
// Tier semantics:
//   - standard : default for every signup. Tight per-day caps.
//   - beta     : pre-launch testers. ×10 per-day evaluation cap.
//   - press    : journalists / partners. ×5.
//   - qa       : QA agents (curl bots etc). Uncapped.
//   - dev      : Stefano + admins. Uncapped.
//
// Adding a tier requires:
//   1. New value in the SQL CHECK constraint (see migration
//      20260509170000_user_account_types.sql)
//   2. New entry in `LIMITS_BY_ACCOUNT_TYPE`
//   3. New value in `AccountType` and `ACCOUNT_TYPES` (types/index.ts)

import type { AccountType } from "@/types";
import type { AppSupabaseClient } from "@/lib/supabase/queries";

export interface AccountLimits {
  // Lesson evaluators (claudemd / context / constraints / debug).
  // Each route counts independently against this number — the cap
  // is "per quick win, per day", not a global pool. Standard is 10
  // per route per day; everything else scales from there.
  evaluations_per_day_per_route: number;
  // Spark chat — total messages allowed per day across all lessons.
  chat_messages_per_day: number;
  // Spark chat — per-lesson cap. Prevents one lesson from burning
  // the whole daily budget on its own. Scales proportionally to
  // chat_messages_per_day so the ratio (~17%) stays consistent.
  chat_messages_per_lesson: number;
}

export const LIMITS_BY_ACCOUNT_TYPE: Record<AccountType, AccountLimits> = {
  standard: {
    evaluations_per_day_per_route: 10,
    chat_messages_per_day: 30,
    chat_messages_per_lesson: 5,
  },
  beta: {
    evaluations_per_day_per_route: 100,
    chat_messages_per_day: 300,
    chat_messages_per_lesson: 50,
  },
  press: {
    evaluations_per_day_per_route: 50,
    chat_messages_per_day: 150,
    chat_messages_per_lesson: 25,
  },
  qa: {
    evaluations_per_day_per_route: Infinity,
    chat_messages_per_day: Infinity,
    chat_messages_per_lesson: Infinity,
  },
  dev: {
    evaluations_per_day_per_route: Infinity,
    chat_messages_per_day: Infinity,
    chat_messages_per_lesson: Infinity,
  },
};

const DEFAULT_TIER: AccountType = "standard";

/**
 * Reads users.account_type and returns the matching limits. Falls back
 * to 'standard' on missing/unknown rows so a corrupted column never
 * breaks the request — the user just gets the strictest tier instead
 * of bypassing the limiter entirely.
 *
 * Throws on transport errors (caller decides whether to fail-closed
 * or fail-open). All callers today fail-closed, returning 500.
 */
export async function getLimitsForUser(
  supabase: AppSupabaseClient,
  userId: string,
): Promise<AccountLimits> {
  const { data, error } = await supabase
    .from("users")
    .select("account_type")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  const raw: unknown = data?.account_type;
  const tier: AccountType = isKnownAccountType(raw) ? raw : DEFAULT_TIER;
  return LIMITS_BY_ACCOUNT_TYPE[tier];
}

/**
 * Sync version for callers that already loaded the user row.
 * Falls back to 'standard' for unknown tiers — same defensive
 * behaviour as the async version.
 */
export function limitsFromTier(tier: AccountType | string | null): AccountLimits {
  if (isKnownAccountType(tier)) return LIMITS_BY_ACCOUNT_TYPE[tier];
  return LIMITS_BY_ACCOUNT_TYPE[DEFAULT_TIER];
}

/**
 * Returns true when the limit is effectively uncapped. Routes use this
 * to short-circuit BOTH the check AND the increment so qa/dev calls
 * don't end up writing massive counters into spark_usage_daily.
 */
export function isUnlimited(limit: number): boolean {
  return !Number.isFinite(limit);
}

function isKnownAccountType(value: unknown): value is AccountType {
  return (
    value === "standard" ||
    value === "beta" ||
    value === "press" ||
    value === "qa" ||
    value === "dev"
  );
}
