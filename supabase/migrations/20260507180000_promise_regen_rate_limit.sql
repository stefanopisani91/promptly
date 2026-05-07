-- Round 8b — anti-abuse for promise generation (Profilazione.md +
-- "Aggiorna le promesse di Spark" in /settings/profile).
--
-- Adds a parallel daily counter on spark_usage_daily so the existing
-- UTC date key, unique constraint and RLS policies cover both Spark
-- chat usage and promise generation in one row per user per day.
--
-- Default 0 — existing rows (Spark chat usage from prior days) keep
-- working, the new counter just stays at 0 until the first promise
-- generation kicks the row's value up.

alter table public.spark_usage_daily
  add column if not exists promise_regen_count int not null default 0;
