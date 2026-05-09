-- Mitigation 2 of the deep_motivation audit (2026-05-09).
--
-- After onboarding step 12 we generate a ≤100-char Haiku-compressed view
-- of the user's deep_motivation that preserves the emotional core
-- (frustration, dream, urgency, fear) — first-person, as if the user
-- summarised themselves. Frequent AI calls (Spark chat session context,
-- empathic interventions) read this column to keep prompts cheap and
-- emotionally anchored without dragging the full prose along.
--
-- Asymmetric usage (per spec):
--   - Spark chat / empathic interventions → compressed
--   - 3 personalised promises generator   → raw (rich emotion)
--   - Future verbatim citations           → truncated raw if needed
--
-- Lazy backfill: getUserProfile() fires a fire-and-forget compress call
-- when raw > 100 chars AND compressed = null, so existing users get the
-- compressed string on their next page load.

alter table public.users
  add column if not exists deep_motivation_compressed text;
