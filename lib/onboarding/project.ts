// Helpers around the user's project_description column.
//
// Two separate views of the same raw value:
//   - SHORT (≤80 chars) — used in every frequent AI prompt (Spark chat,
//     lesson evaluators) so we don't burn tokens on prose. Backed by
//     the Haiku-compressed `project_description_compressed` column,
//     with a deterministic truncate fallback when the column is null.
//   - RAW — used only for the in-lesson inline citations, already
//     guarded by truncateProject() in lib/utils.ts at the call site.
//
// The lazy-backfill trigger lives here too: a fire-and-forget call that
// generates and stores the compressed value when an existing user with
// raw > 100 chars but no compressed value loads a page. Idempotent at
// the DB layer (we never overwrite a non-null compressed without an
// explicit `force` flag from the caller — see compress-project.ts).

import type { Lang, UserProfile } from "@/types";
import { isLang } from "@/types";
import {
  type AppSupabaseClient,
  type ProfileBackfillSnapshot,
} from "@/lib/supabase/queries";
import {
  compressProjectDescription,
  storeCompressedProjectDescription,
} from "./compress-project";
import {
  compressMotivation,
  storeCompressedMotivation,
} from "./compress-motivation";

const LAZY_BACKFILL_THRESHOLD = 100;

/**
 * Pick the right project_description view for an AI prompt: the Haiku-
 * compressed string when present, else a deterministic 80-char truncate
 * of the raw. Returns the empty string when neither is set, so callers
 * can do a simple `if (short.length === 0)` guard.
 */
export function getProjectDescriptionShort(profile: UserProfile): string {
  const compressed = profile.project_description_compressed?.trim();
  if (compressed && compressed.length > 0) return compressed;
  const raw = profile.project_description?.trim();
  if (!raw) return "";
  if (raw.length <= 80) return raw;
  return raw.slice(0, 80).trimEnd() + "…";
}

/**
 * Eager generator + setter — used by the onboarding finalize flow once
 * the user lands on step 12. Best-effort: a failure (network, missing
 * key, invalid AI response) just leaves the column null and the lazy
 * backfill below picks it up on the next page load.
 */
export async function generateAndStoreCompressedProject(
  supabase: AppSupabaseClient,
  userId: string,
  rawDescription: string,
  lang: Lang,
): Promise<void> {
  if (!rawDescription || rawDescription.trim().length === 0) return;
  const result = await compressProjectDescription({
    raw: rawDescription,
    lang,
  });
  if (!result.ok) return;
  try {
    await storeCompressedProjectDescription(
      supabase,
      userId,
      result.compressed,
    );
  } catch {
    /* Ignored — lazy backfill will retry. */
  }
}

/**
 * Fire-and-forget lazy backfill. Called from getUserProfile (or any
 * server-side render that already has the profile + a Supabase client)
 * when the user has a raw description that's verbose enough to benefit
 * from compression but the compressed column is still null.
 *
 * Doesn't await: the caller continues rendering with the raw value,
 * and the next page load picks up the compressed value via the cached
 * column read. No retry logic — a transient failure will just be tried
 * again on the next eligible page load.
 */
export function maybeBackfillCompressedProject(
  supabase: AppSupabaseClient,
  snapshot: ProfileBackfillSnapshot,
): void {
  if (snapshot.project_description_compressed) return;
  const raw = snapshot.project_description?.trim();
  if (!raw || raw.length <= LAZY_BACKFILL_THRESHOLD) return;
  const lang: Lang = isLang(snapshot.language) ? snapshot.language : "it";
  void generateAndStoreCompressedProject(supabase, snapshot.id, raw, lang);
}

// ─── deep_motivation ──────────────────────────────────────────────────
// Same pattern as the project_description helpers above, applied to the
// deep_motivation column. Different defaults: 100-char ceiling and a
// looser lazy threshold (most motivations are between 80 and 400 chars,
// and even a borderline 90-char raw still benefits from being normalised
// into the first-person Spark anchor). The helpers stay paired in the
// same file so callers (queries.ts, onboarding actions, spark-chat
// route) can pull both compressions from a single import.

const MOTIVATION_LAZY_BACKFILL_THRESHOLD = 90;

/**
 * Pick the right deep_motivation view for an empathic AI prompt: the
 * Haiku-compressed first-person string when present, else a determ-
 * inistic 100-char truncate of the raw. Returns the empty string when
 * neither is set.
 */
export function getDeepMotivationShort(profile: UserProfile): string {
  const compressed = profile.deep_motivation_compressed?.trim();
  if (compressed && compressed.length > 0) return compressed;
  const raw = profile.deep_motivation?.trim();
  if (!raw) return "";
  if (raw.length <= 100) return raw;
  return raw.slice(0, 100).trimEnd() + "…";
}

/**
 * Eager generator + setter — used by completeOnboarding once the user
 * lands on step 12. Best-effort: a failure leaves the column null and
 * the lazy backfill below picks it up on the next page load.
 */
export async function generateAndStoreCompressedMotivation(
  supabase: AppSupabaseClient,
  userId: string,
  rawMotivation: string,
  lang: Lang,
): Promise<void> {
  if (!rawMotivation || rawMotivation.trim().length === 0) return;
  const result = await compressMotivation({ raw: rawMotivation, lang });
  if (!result.ok) return;
  try {
    await storeCompressedMotivation(supabase, userId, result.compressed);
  } catch {
    /* Ignored — lazy backfill will retry. */
  }
}

/**
 * Fire-and-forget lazy backfill for deep_motivation. Same shape as
 * maybeBackfillCompressedProject — see getUserProfile for the trigger
 * conditions.
 */
export function maybeBackfillCompressedMotivation(
  supabase: AppSupabaseClient,
  snapshot: ProfileBackfillSnapshot,
): void {
  if (snapshot.deep_motivation_compressed) return;
  const raw = snapshot.deep_motivation?.trim();
  if (!raw || raw.length <= MOTIVATION_LAZY_BACKFILL_THRESHOLD) return;
  const lang: Lang = isLang(snapshot.language) ? snapshot.language : "it";
  void generateAndStoreCompressedMotivation(supabase, snapshot.id, raw, lang);
}
