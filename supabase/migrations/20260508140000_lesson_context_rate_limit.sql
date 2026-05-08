-- Lesson 3 (mindset-03) — anti-abuse for the context-prompt interactive widget.
--
-- Mirrors the claudemd_attempts_count counter introduced in
-- 20260508000000_lesson_claudemd_rate_limit.sql. Each lesson gets its own
-- column on spark_usage_daily so per-lesson budgets stay independent
-- (a user who burned 12 CLAUDE.md attempts can still try the context
-- editor up to 12 times the same day).
--
-- Same natural key (user_id, usage_date) so all "daily AI calls" counters
-- live on a single row.

alter table public.spark_usage_daily
  add column if not exists context_attempts_count integer not null default 0;
