-- Spark Helper (contextual tutor inside V3 quick-win widgets) — quota
-- columns. Mirrors the existing Spark-chat / per-lesson-evaluator counter
-- pattern so the helper gets its own isolated budget and never shares the
-- cap with chat or with the evaluators.
--
--   1. user_progress.spark_helper_count — per-(user, lesson) message
--      counter. Sibling of spark_chat_count. The /api/spark-helper route
--      enforces the per-quick-win cap (10 for standard tier) against it.
--   2. spark_usage_daily.helper_messages_count — per-(user, day) counter.
--      Sibling of message_count / *_attempts_count. Enforces the daily cap
--      (30 standard / 300 beta / 150 press / uncapped qa·dev).
--
-- Additive, non-breaking: both columns get a NOT NULL default of 0, so
-- existing rows are valid immediately and the route reads 0 for users who
-- have never used the helper.

alter table public.user_progress
  add column if not exists spark_helper_count integer not null default 0;

alter table public.spark_usage_daily
  add column if not exists helper_messages_count integer not null default 0;
