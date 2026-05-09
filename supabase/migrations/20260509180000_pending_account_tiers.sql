-- Pending account tiers — pre-assign a tier to an email BEFORE the
-- person signs up. When the onboarding action upserts to public.users
-- for that email, it consumes the matching pending row (sets the tier
-- on users.account_type) and deletes the pending entry.
--
-- Stefano (or any other dev) populates this from /admin/users so a
-- press journalist or beta tester gets the right tier from minute one,
-- without him having to remember a manual promotion later.

create table if not exists public.pending_account_tiers (
  -- Stored normalised lower-cased + trimmed; the admin form does the
  -- normalisation before insert. Primary key prevents two pending
  -- rows for the same email.
  email text primary key,
  account_type text not null
    check (account_type in ('standard', 'beta', 'qa', 'dev', 'press')),
  -- Optional human-readable note ("press @ Wired", "beta wave 1").
  -- Visible only to dev-tier users in the admin panel.
  note text,
  -- Who created this pending entry. Null-safe so a dev account
  -- deletion doesn't cascade-wipe pending invitations.
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);

comment on table public.pending_account_tiers is
  'Email → tier assignments waiting for the user to sign up. Consumed and deleted by the onboarding action.';

-- RLS: only authenticated users with users.account_type = 'dev' can
-- see / modify this table. Server actions run as the caller's session
-- so the policy gates them automatically.
alter table public.pending_account_tiers enable row level security;

drop policy if exists "pending_account_tiers_dev_select" on public.pending_account_tiers;
create policy "pending_account_tiers_dev_select"
  on public.pending_account_tiers
  for select
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.account_type = 'dev'
    )
  );

drop policy if exists "pending_account_tiers_dev_insert" on public.pending_account_tiers;
create policy "pending_account_tiers_dev_insert"
  on public.pending_account_tiers
  for insert
  with check (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.account_type = 'dev'
    )
  );

drop policy if exists "pending_account_tiers_dev_delete" on public.pending_account_tiers;
create policy "pending_account_tiers_dev_delete"
  on public.pending_account_tiers
  for delete
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.account_type = 'dev'
    )
  );

-- The onboarding action runs server-side using the user's anon-key
-- session, so it must be allowed to delete its own row when the
-- email matches the authenticated user. Add a self-consumption
-- policy keyed on auth.email() so the cleanup at signup works
-- regardless of the dev-tier policy above.
drop policy if exists "pending_account_tiers_self_consume" on public.pending_account_tiers;
create policy "pending_account_tiers_self_consume"
  on public.pending_account_tiers
  for delete
  using (
    auth.email() is not null
    and lower(trim(auth.email())) = email
  );

drop policy if exists "pending_account_tiers_self_select" on public.pending_account_tiers;
create policy "pending_account_tiers_self_select"
  on public.pending_account_tiers
  for select
  using (
    auth.email() is not null
    and lower(trim(auth.email())) = email
  );
