-- Mitigation 2 of the project_description audit (2026-05-09).
--
-- After onboarding step 12 we generate a ≤80-char compressed version of
-- the user's project_description via Claude Haiku 4.5 and store it here.
-- Frequent AI calls (Spark chat, lesson evaluators) read the compressed
-- value to keep the system prompt cheap and the model focused on the
-- domain rather than the prose. Falls back to a truncate-helper view of
-- the raw text when this column is null (legacy users / failed compress
-- runs / brand-new pre-compress profile loads).
--
-- Lazy backfill: getUserProfile() fires a fire-and-forget compress call
-- when it sees raw > 100 chars AND compressed = null, so existing users
-- get the compressed string on their next page load.

alter table public.users
  add column if not exists project_description_compressed text;
