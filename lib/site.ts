/**
 * Single source of truth for the production site URL.
 * Used by metadata, sitemap, robots, and JSON-LD.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://promptly.app"
).replace(/\/$/, "");
