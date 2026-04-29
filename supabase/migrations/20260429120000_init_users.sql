-- Round 1 — minimal user profile.
-- Streak / XP / freeze / Pro / push / consent fields will be added in
-- subsequent migrations as the related features ship.

create table if not exists public.users (
  id                       uuid primary key references auth.users(id) on delete cascade,
  email                    text not null,
  full_name                text,
  language                 text not null default 'it'
                           check (language in ('en','it')),
  daily_goal               text not null default 'easy'
                           check (daily_goal in ('trivial','easy','pro')),
  onboarding_completed_at  timestamptz,
  signup_source            text,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists users_set_updated_at on public.users;
create trigger users_set_updated_at
  before update on public.users
  for each row execute procedure public.set_updated_at();

alter table public.users enable row level security;

drop policy if exists "users_select_own" on public.users;
create policy "users_select_own" on public.users
  for select using (auth.uid() = id);

drop policy if exists "users_insert_own" on public.users;
create policy "users_insert_own" on public.users
  for insert with check (auth.uid() = id);

drop policy if exists "users_update_own" on public.users;
create policy "users_update_own" on public.users
  for update using (auth.uid() = id) with check (auth.uid() = id);
