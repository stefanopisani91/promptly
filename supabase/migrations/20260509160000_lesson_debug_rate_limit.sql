-- Lesson 5 (mindset-05) — anti-abuse for the broken-session debugger widget.
--
-- Mirrors the per-lesson counters added in
-- 20260508000000_lesson_claudemd_rate_limit.sql,
-- 20260508140000_lesson_context_rate_limit.sql, and
-- 20260508180000_lesson_constraints_rate_limit.sql. Each lesson keeps an
-- isolated daily budget on spark_usage_daily so users can finish lesson 4
-- and still try lesson 5 the same day without sharing the cap.
--
-- Same natural key (user_id, usage_date).

alter table public.spark_usage_daily
  add column if not exists debug_attempts_count integer not null default 0;
