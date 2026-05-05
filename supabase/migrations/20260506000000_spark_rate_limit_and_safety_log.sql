-- Sessione 3 (Promptly_Spark_Master_Configuration.md §6) — daily rate limit
-- and safety-event logging for Spark's free chat.
--
-- Context: V3 lessons already enforce a per-lesson cap of 5 messages via
-- user_progress.spark_chat_count. That alone doesn't stop a user from
-- opening 20 lessons in a row and burning Anthropic credit. This migration
-- adds:
--
--   1. spark_usage_daily — one row per (user, UTC date) holding a counter.
--      The route increments it after a successful Anthropic reply and
--      refuses new calls once the daily threshold is reached.
--      Resets at UTC midnight (timezone tracking would add complexity for
--      a fix that buys little — users in IT/CET hit the cap a few hours
--      "early" relative to their local midnight, acceptable).
--
--   2. spark_safety_log — append-only log of moments worth a human glance:
--      jailbreak attempts, crisis-keyword hits, etc. Used for periodic
--      review and for spotting abuse patterns. Excerpts are clamped to
--      200 chars before insert.
--
-- Pro tier (20/lesson, 80/day from the master config) is intentionally NOT
-- modeled here — there's no Stripe wiring yet, no path for a user to BE
-- Pro. The route enforces the Free quotas universally for now; a follow-up
-- migration will add a tier column when payments come online.

-- ─────────────────────────────────────────────────────────────────────────
-- spark_usage_daily
-- ─────────────────────────────────────────────────────────────────────────

create table public.spark_usage_daily (
  user_id uuid not null references public.users(id) on delete cascade,
  usage_date date not null,
  message_count integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, usage_date)
);

-- Most reads in the route are "give me today's row for this user".
-- The PK index covers (user_id, usage_date) which serves equality queries
-- on both columns. Adding a separate index on (user_id, usage_date desc)
-- would help an "list last N days" query but we don't have one yet —
-- keep the schema minimal until we do.

alter table public.spark_usage_daily enable row level security;

-- The /api/spark-chat route runs server-side with the user's authenticated
-- session, so RLS sees auth.uid() and the per-user policies below apply
-- naturally. Users can only ever see/modify their own counter.
create policy "spark_usage_daily_select_own"
  on public.spark_usage_daily
  for select using (auth.uid() = user_id);

create policy "spark_usage_daily_insert_own"
  on public.spark_usage_daily
  for insert with check (auth.uid() = user_id);

create policy "spark_usage_daily_update_own"
  on public.spark_usage_daily
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- No delete policy — we don't expose deletion to clients. Operationally,
-- old rows can be pruned by an admin job (rows older than ~90 days are
-- never read by the route).

-- ─────────────────────────────────────────────────────────────────────────
-- spark_safety_log
-- ─────────────────────────────────────────────────────────────────────────

create table public.spark_safety_log (
  id bigserial primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  lesson_id text,
  -- Free-form tag so the route can add new signals without a migration.
  -- Current signals: 'jailbreak_attempt', 'crisis_keywords'. Index below
  -- accelerates "show me all crises this week" queries when reviewing.
  signal text not null,
  -- Excerpt of the user's message that triggered the log, clamped to
  -- 200 chars by the route before insert. Useful for review without
  -- storing the full conversation.
  excerpt text,
  occurred_at timestamptz not null default now()
);

create index spark_safety_log_user_idx
  on public.spark_safety_log (user_id, occurred_at desc);

create index spark_safety_log_signal_idx
  on public.spark_safety_log (signal, occurred_at desc);

alter table public.spark_safety_log enable row level security;

-- Users see their own log entries (useful for transparency / data export).
create policy "spark_safety_log_select_own"
  on public.spark_safety_log
  for select using (auth.uid() = user_id);

-- Users can only insert rows tagged with their own user_id. The route
-- ensures user_id matches the authenticated user before inserting.
create policy "spark_safety_log_insert_own"
  on public.spark_safety_log
  for insert with check (auth.uid() = user_id);

-- Append-only: no update or delete policies. Safety logs are immutable
-- by design; an admin job (with service role) can prune old entries when
-- retention rules require it.
