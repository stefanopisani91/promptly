-- Dashboard V2 — Phase 2: referral system.
-- See DASHBOARD_V2.md §4.
--
-- One row per converted referral. UNIQUE(referee_id) enforces the rule
-- "a user can be referred by at most one person".
--
-- total_referrals_converted is intentionally NOT denormalized — count is
-- computed via SELECT count(*) at read time to avoid drift.

create table if not exists public.user_referrals (
  id                    uuid primary key default gen_random_uuid(),
  referrer_id           uuid not null references public.users(id) on delete cascade,
  referee_id            uuid not null references public.users(id) on delete cascade unique,
  xp_awarded_referrer   integer not null default 300,
  xp_awarded_referee    integer not null default 50,
  created_at            timestamptz not null default now()
);

create index if not exists user_referrals_referrer_idx
  on public.user_referrals (referrer_id);

alter table public.user_referrals enable row level security;

-- Both parties can see referrals they participated in. Inserts are gated
-- behind the server action (running with the user's auth context, who is
-- the referee at insert time).
drop policy if exists "user_referrals_select_participant" on public.user_referrals;
create policy "user_referrals_select_participant" on public.user_referrals
  for select using (auth.uid() = referrer_id or auth.uid() = referee_id);

drop policy if exists "user_referrals_insert_referee" on public.user_referrals;
create policy "user_referrals_insert_referee" on public.user_referrals
  for insert with check (auth.uid() = referee_id);

-- Activation timestamp — set the first time the referrer copies/shares
-- their link. Drives the +25 XP one-time bonus.
alter table public.users
  add column if not exists referral_link_activated_at timestamptz;
