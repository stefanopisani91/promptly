-- Account types — differentiated rate limits.
--
-- Every public.users row gets an account_type. Standard users share the
-- existing per-day caps; beta/press users get higher ceilings; qa/dev
-- bypass the caps entirely. Defaults to 'standard' so existing rows
-- migrate cleanly without back-fill.
--
-- The CHECK constraint mirrors the discriminator used by
-- /lib/rate-limits/account-limits.ts. Adding a new tier requires a
-- migration AND a code change — keep them aligned.

alter table public.users
  add column if not exists account_type text not null default 'standard';

alter table public.users
  drop constraint if exists users_account_type_check;

alter table public.users
  add constraint users_account_type_check
  check (account_type in ('standard', 'beta', 'qa', 'dev', 'press'));
