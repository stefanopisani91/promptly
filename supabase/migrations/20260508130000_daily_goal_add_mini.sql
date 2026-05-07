-- Round 9 — Daily-goal expansion to 4 buckets (mini / trivial / easy / pro).
-- Adds 'mini' (5 min) to the check constraint without touching existing
-- rows. Pre-Round-9 users keep their stored value; the four buckets map
-- to discrete minute targets in lib/daily-goal.ts:
--   mini    →  5 min  (new)
--   trivial → 10 min  (was 5–10, kept since users picked the lower band)
--   easy    → 15 min  (was 15–20, settled on the lower band)
--   pro     → 30 min  (unchanged)
-- The mapping is backwards compatible — no data migration needed.

alter table public.users
  drop constraint if exists users_daily_goal_check;

alter table public.users
  add constraint users_daily_goal_check
  check (daily_goal in ('mini','trivial','easy','pro'));
