// Pure helpers for the referral system. No DB access — see
// lib/supabase/queries.ts for stateful operations.

import { SITE_URL } from "@/lib/site";
import type { Lang } from "@/types";

const RANDOM_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // skip 0/O/I/1
const PREFIX_LENGTH = 4;
const RANDOM_LENGTH = 4;

function randomChars(n: number): string {
  // crypto.getRandomValues is available in both Node 19+ and the browser;
  // we don't need cryptographic strength here, but it gives uniform output
  // and avoids Math.random's weak distribution at small N.
  const bytes = new Uint8Array(n);
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < n; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  let out = "";
  for (let i = 0; i < n; i++) {
    out += RANDOM_ALPHABET[bytes[i] % RANDOM_ALPHABET.length];
  }
  return out;
}

function namePrefix(name: string | null): string | null {
  if (!name) return null;
  const ascii = name
    .normalize("NFD")
    // strip combining diacritics
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
  if (ascii.length === 0) return null;
  return ascii.slice(0, PREFIX_LENGTH).padEnd(PREFIX_LENGTH, "X");
}

/**
 * Generate a referral code from a user's display name.
 *
 * Format: `<NAME4>-<RAND4>` (e.g. "STEF-K7P3"), or `<RAND8>` when name is
 * empty/non-alphanumeric. The result is intended to be unique under the
 * users.referral_code unique index — callers should retry on conflict.
 */
export function generateReferralCode(name: string | null): string {
  const prefix = namePrefix(name);
  return prefix ? `${prefix}-${randomChars(RANDOM_LENGTH)}` : randomChars(8);
}

/**
 * Build the public referral URL for a code. Lang is appended when provided
 * so the recipient lands on a page in the inviter's language; pass null
 * (or omit) to fall back to the language detector on the marketing site.
 */
export function getReferralUrl(code: string, lang: Lang | null = null): string {
  const path = lang ? `/${lang}/signup` : "/signup";
  const url = new URL(path, SITE_URL);
  url.searchParams.set("ref", code);
  return url.toString();
}

// Cookie name shared between marketing signup capture and the onboarding
// action that converts the pending referral. Centralised here so both
// sides stay in sync.
export const REFERRAL_PENDING_COOKIE = "promptly_referral_pending";
export const REFERRAL_PENDING_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

// Loose validation — codes we generate match this; older / future formats
// are accepted as long as they're plausible (alnum + dash, ≤32 chars).
const REFERRAL_CODE_RE = /^[A-Z0-9-]{4,32}$/;

export function isValidReferralCode(value: unknown): value is string {
  return typeof value === "string" && REFERRAL_CODE_RE.test(value);
}
