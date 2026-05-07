-- Lesson 2 (mindset-02) — anti-abuse for the CLAUDE.md interactive widget.
--
-- Context: /api/lesson-claudemd-evaluate calls Anthropic Haiku 4.5 to grade
-- the user's CLAUDE.md draft. Without a server-side cap, an authenticated
-- user can hit the endpoint in a loop and burn credit. The blueprint
-- prescribes 3 attempts per lesson; we already enforce that on the client,
-- but we now mirror it on the server.
--
-- We piggy-back on the existing spark_usage_daily table — same natural key
-- (user_id, usage_date), one extra counter column. This avoids a second
-- table for what is the same conceptual "daily AI calls" budget. Mirrors
-- the promise_regen_count pattern landed in 20260507180000.
--
-- The per-lesson 3-attempt cap is enforced in user_progress.step_state
-- (already a free-form jsonb owned by the lesson view) — no schema change
-- needed. The route reads the persisted attempts before forwarding to
-- Anthropic and refuses past the threshold.

alter table public.spark_usage_daily
  add column if not exists claudemd_attempts_count integer not null default 0;
