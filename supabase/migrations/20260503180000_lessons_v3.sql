-- Lesson V3 — card-step lessons with Spark mascot.
-- Adds:
--   1. users.archetype_key — set when the user reveals their result in the
--      Lesson 1 archetype quiz (mindset-01). Used to personalize Spark's
--      tone in later lessons. Nullable; null = quiz not taken yet.
--   2. user_progress.current_step — 0-indexed step the user is currently on.
--      Drives the "resume where you left off" experience (premium feel).
--   3. user_progress.step_state — jsonb bag of input answers, choice picks,
--      and Lucia attempt counts. Free-form so different lessons can store
--      their own per-step state without a schema migration each time.
--   4. user_progress.spark_chat_count — per-lesson "Ask Spark" usage,
--      enforced at 5/lesson by the API route. No daily reset by design;
--      the quota is per lesson, not per day.

alter table public.users
  add column if not exists archetype_key text;

alter table public.user_progress
  add column if not exists current_step      integer not null default 0,
  add column if not exists step_state        jsonb   not null default '{}'::jsonb,
  add column if not exists spark_chat_count  integer not null default 0;
