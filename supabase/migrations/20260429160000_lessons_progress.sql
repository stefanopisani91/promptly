-- Round 3 — lesson progress + cumulative XP/streak placeholders on users.
-- One row per (user, lesson) tracking attempts, completion and earned XP.
-- Streak fields are reserved for Round 4 (currently never populated).

create table if not exists public.user_progress (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.users(id) on delete cascade,
  lesson_id     text not null,
  path_slug     text not null,
  completed     boolean not null default false,
  attempts      integer not null default 0,
  xp_earned     integer not null default 0,
  completed_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (user_id, lesson_id)
);

create index if not exists user_progress_user_path_idx
  on public.user_progress (user_id, path_slug);
create index if not exists user_progress_user_completed_idx
  on public.user_progress (user_id, completed);

alter table public.user_progress enable row level security;

drop policy if exists "user_progress_select_own" on public.user_progress;
create policy "user_progress_select_own" on public.user_progress
  for select using (auth.uid() = user_id);

drop policy if exists "user_progress_insert_own" on public.user_progress;
create policy "user_progress_insert_own" on public.user_progress
  for insert with check (auth.uid() = user_id);

drop policy if exists "user_progress_update_own" on public.user_progress;
create policy "user_progress_update_own" on public.user_progress
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop trigger if exists user_progress_set_updated_at on public.user_progress;
create trigger user_progress_set_updated_at
  before update on public.user_progress
  for each row execute procedure public.set_updated_at();

-- Cumulative counters on users. Denormalized on purpose to avoid aggregations
-- on every dashboard render. Streak fields ship inert in Round 3.
alter table public.users add column if not exists total_xp           integer not null default 0;
alter table public.users add column if not exists current_streak     integer not null default 0;
alter table public.users add column if not exists longest_streak     integer not null default 0;
alter table public.users add column if not exists last_activity_date date;
