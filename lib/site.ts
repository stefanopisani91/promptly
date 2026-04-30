/**
 * Single source of truth for the production site URL.
 * Used by metadata, sitemap, robots, and JSON-LD.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://learnpromptly.app"
).replace(/\/$/, "");

/**
 * Strict canonical origin for OAuth/auth-callback redirects.
 *
 * Unlike SITE_URL, this throws if NEXT_PUBLIC_SITE_URL is missing — we
 * never want to silently fall back during the auth flow, because a
 * non-canonical origin (e.g. a Netlify deploy-preview URL) is not in
 * Supabase's allowlist and the redirect will fail.
 */
export function getCanonicalOrigin(): string {
  const url = process.env.NEXT_PUBLIC_SITE_URL;
  if (!url) {
    throw new Error("NEXT_PUBLIC_SITE_URL is required for OAuth redirects");
  }
  return url.replace(/\/$/, "");
}
