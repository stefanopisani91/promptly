-- usage_logs — append-only audit of every rate-limit hit.
--
-- Strategic intent: give Stefano the data to calibrate the caps over
-- time. By snapshotting account_type AT EVENT TIME (not joining at
-- read time) the table keeps its analytical value even after the
-- user's tier changes.
--
-- Volume: bounded by the tightest cap × signups. Standard at 10/day
-- per route × 4 routes × N users → ~40N events/day worst case. At
-- 1k DAU that's 40k rows/day = ~14M/year before any retention
-- policy. Indexes are slim (descending on occurred_at + per-dim
-- compounds) so the table stays cheap to write.

create table if not exists public.usage_logs (
  id bigserial primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  -- Snapshot of users.account_type at event time. Denormalised so
  -- analytics on "how many limits did standard users hit last week"
  -- stay correct even after a user is promoted to beta/dev.
  account_type text not null
    check (account_type in ('standard','beta','qa','dev','press')),
  -- Discriminator. Kept open-ended (text not enum) so adding a new
  -- limit kind doesn't require a migration. Conventions today:
  --   'daily_quota'         per-day evaluation cap (lesson-* routes)
  --   'daily_chat_quota'    per-day chat cap (spark-chat)
  --   'per_lesson_quota'    per-lesson chat cap (spark-chat)
  --   'lesson_attempts'     per-lesson attempt cap (3) on a quick win
  event_type text not null,
  -- Route that fired the event (e.g. 'lesson-debug-evaluate').
  endpoint text not null,
  -- Optional lesson context — null for spark-chat hits that aren't
  -- bound to a specific lesson, set otherwise.
  lesson_id text,
  -- Attempt number at the moment the limit was hit.
  attempt_number integer,
  -- Snapshot of the cap value (useful when caps move over time).
  limit_value integer,
  occurred_at timestamptz not null default now()
);

create index if not exists usage_logs_occurred_at_idx
  on public.usage_logs (occurred_at desc);
create index if not exists usage_logs_account_type_idx
  on public.usage_logs (account_type, occurred_at desc);
create index if not exists usage_logs_event_type_idx
  on public.usage_logs (event_type, occurred_at desc);
create index if not exists usage_logs_endpoint_idx
  on public.usage_logs (endpoint, occurred_at desc);

alter table public.usage_logs enable row level security;

-- Users can insert their own rows. The 5 API routes call this from
-- the user's authenticated session, so auth.uid() matches user_id.
drop policy if exists "usage_logs_self_insert" on public.usage_logs;
create policy "usage_logs_self_insert"
  on public.usage_logs
  for insert
  with check (user_id = auth.uid());

-- Only dev users can read. Stefano sees the data on /admin/users;
-- nobody else, not even the user themselves, can list their own
-- limit hits. (If you want users to see their own remaining quota
-- in the UI, that's a separate feature backed by spark_usage_daily.)
drop policy if exists "usage_logs_dev_select" on public.usage_logs;
create policy "usage_logs_dev_select"
  on public.usage_logs
  for select
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.account_type = 'dev'
    )
  );

comment on table public.usage_logs is
  'Append-only log of every rate-limit hit. Read by /admin/users (dev-only) for analytics. Insert-only via the user''s own session at the moment the route returns 403.';
