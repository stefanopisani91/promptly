-- Dashboard V2 — Phase 1: robot avatar + XP levels + referral preparation.
-- See DASHBOARD_V2.md §2 (levels) and §4 (referral).
--
-- xp_level is intentionally NOT stored — it's computed from total_xp at read
-- time via lib/levels.ts to avoid drift. We only persist the last level for
-- which the user has seen the level-up modal.
--
-- referral_code is added now (Phase 2 prep): nullable + unique. It will be
-- populated during Phase 2 signup flow; existing users get a backfill there.

alter table public.users
  add column if not exists last_level_up_notified integer not null default 1;

alter table public.users
  add column if not exists referral_code text;

-- Unique only across non-null values, so the column can stay nullable until
-- Phase 2 backfills codes for everyone.
create unique index if not exists users_referral_code_unique
  on public.users (referral_code)
  where referral_code is not null;

-- Backfill last_level_up_notified for existing users to their currently
-- earned level — prevents a retroactive modal flood when this rolls out.
-- Thresholds mirror LEVEL_THRESHOLDS in lib/levels.ts.
update public.users
set last_level_up_notified = case
  when total_xp >= 10000 then 7
  when total_xp >=  6000 then 6
  when total_xp >=  4000 then 5
  when total_xp >=  2500 then 4
  when total_xp >=  1200 then 3
  when total_xp >=   500 then 2
  else 1
end;
