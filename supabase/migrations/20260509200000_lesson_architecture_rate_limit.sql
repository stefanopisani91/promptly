-- Lesson 6 (mindset-06) — anti-abuse for the prompt-architecture
-- generation widget. Mirrors the per-route counters added in
-- 20260508000000 / 14000 / 18000 / 20260509160000. Each lesson
-- gets its own daily budget on spark_usage_daily so a user can
-- finish lesson 5 and still try lesson 6 the same day without
-- sharing the cap.

alter table public.spark_usage_daily
  add column if not exists architecture_attempts_count integer not null default 0;
