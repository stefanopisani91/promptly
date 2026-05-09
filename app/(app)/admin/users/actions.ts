"use server";

// Admin server actions — update a user's account_type, plus manage
// the pending_account_tiers list. Every action re-checks the caller's
// tier on each invocation (server actions are reachable independently
// of the page render, so the page-level gate is not enough).
//
// CHECK constraints on the DB are the last line of defence; we
// validate up-front to surface clean error codes to the UI.

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isAccountType, type AccountType } from "@/types";

export interface UpdateAccountTypeResult {
  ok: boolean;
  error?:
    | "unauthorized"
    | "forbidden"
    | "invalid_input"
    | "not_found"
    | "db_error";
}

export interface AddPendingTierResult {
  ok: boolean;
  error?:
    | "unauthorized"
    | "forbidden"
    | "invalid_input"
    | "duplicate_email"
    | "db_error";
}

export interface RemovePendingTierResult {
  ok: boolean;
  error?: "unauthorized" | "forbidden" | "invalid_input" | "db_error";
}

const NOTE_MAX_CHARS = 200;
// Loose RFC-5322 sanity check — the auth provider is the source of
// truth, this just stops obvious typos at the admin form before they
// hit the DB and become orphaned rows that match no real signup.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function updateAccountType(
  targetUserId: string,
  newType: AccountType,
): Promise<UpdateAccountTypeResult> {
  if (typeof targetUserId !== "string" || targetUserId.length === 0) {
    return { ok: false, error: "invalid_input" };
  }
  if (!isAccountType(newType)) {
    return { ok: false, error: "invalid_input" };
  }

  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  const me = userData?.user;
  if (!me) {
    return { ok: false, error: "unauthorized" };
  }

  // Re-verify caller is a dev. Don't trust the page's gate alone —
  // server actions are reachable independently of the page render.
  const { data: meRow } = await supabase
    .from("users")
    .select("account_type")
    .eq("id", me.id)
    .maybeSingle();
  if (!meRow || meRow.account_type !== "dev") {
    return { ok: false, error: "forbidden" };
  }

  const { error: updateError, data } = await supabase
    .from("users")
    .update({ account_type: newType })
    .eq("id", targetUserId)
    .select("id")
    .maybeSingle();
  if (updateError) {
    return { ok: false, error: "db_error" };
  }
  if (!data) {
    return { ok: false, error: "not_found" };
  }

  revalidatePath("/admin/users");
  return { ok: true };
}

/**
 * Add a row to pending_account_tiers. The email is normalised
 * (trim + lowercase) before storage so case differences at signup
 * still match the pending entry.
 */
export async function addPendingTier(
  rawEmail: string,
  tier: AccountType,
  note: string | null,
): Promise<AddPendingTierResult> {
  if (typeof rawEmail !== "string") {
    return { ok: false, error: "invalid_input" };
  }
  const email = rawEmail.trim().toLowerCase();
  if (!EMAIL_REGEX.test(email) || email.length > 320) {
    return { ok: false, error: "invalid_input" };
  }
  if (!isAccountType(tier)) {
    return { ok: false, error: "invalid_input" };
  }
  let cleanedNote: string | null = null;
  if (note !== null && note !== undefined) {
    if (typeof note !== "string") {
      return { ok: false, error: "invalid_input" };
    }
    const trimmed = note.trim();
    if (trimmed.length > NOTE_MAX_CHARS) {
      return { ok: false, error: "invalid_input" };
    }
    cleanedNote = trimmed.length > 0 ? trimmed : null;
  }

  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  const me = userData?.user;
  if (!me) return { ok: false, error: "unauthorized" };

  const { data: meRow } = await supabase
    .from("users")
    .select("account_type")
    .eq("id", me.id)
    .maybeSingle();
  if (!meRow || meRow.account_type !== "dev") {
    return { ok: false, error: "forbidden" };
  }

  // If the email already belongs to a registered user, redirect the
  // dev to the proper flow (use the dropdown on the user's row).
  // We don't auto-promote here because the existing tier might be
  // intentional (e.g. they were just demoted).
  const { data: existingUser } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  if (existingUser) {
    return { ok: false, error: "duplicate_email" };
  }

  const { error } = await supabase.from("pending_account_tiers").insert({
    email,
    account_type: tier,
    note: cleanedNote,
    created_by: me.id,
  });
  if (error) {
    // Postgres unique violation (already pending) → bubble up as
    // duplicate_email so the UI can offer "remove first" instead of
    // a generic db_error.
    if (error.code === "23505") {
      return { ok: false, error: "duplicate_email" };
    }
    return { ok: false, error: "db_error" };
  }

  revalidatePath("/admin/users");
  return { ok: true };
}

/**
 * Remove a pending tier by email. Idempotent — removing a row that
 * doesn't exist returns ok=true (the desired end state is "not in
 * the list", which is already the case).
 */
export async function removePendingTier(
  rawEmail: string,
): Promise<RemovePendingTierResult> {
  if (typeof rawEmail !== "string") {
    return { ok: false, error: "invalid_input" };
  }
  const email = rawEmail.trim().toLowerCase();
  if (email.length === 0) return { ok: false, error: "invalid_input" };

  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  const me = userData?.user;
  if (!me) return { ok: false, error: "unauthorized" };

  const { data: meRow } = await supabase
    .from("users")
    .select("account_type")
    .eq("id", me.id)
    .maybeSingle();
  if (!meRow || meRow.account_type !== "dev") {
    return { ok: false, error: "forbidden" };
  }

  const { error } = await supabase
    .from("pending_account_tiers")
    .delete()
    .eq("email", email);
  if (error) return { ok: false, error: "db_error" };

  revalidatePath("/admin/users");
  return { ok: true };
}
