-- Round 8 — Onboarding & Profilazione Iniziale (Profilazione.md spec).
-- Extends public.users with the profiling fields collected during the new
-- 12-step onboarding flow. Spec talks about a separate `user_profiles` table
-- but we keep things in `users` because the existing flow already stores
-- onboarding data there (language, daily_goal, onboarding_completed_at,
-- archetype_key). Adding columns avoids a parallel table + a join on every
-- profile read.
--
-- All new columns are nullable so legacy users (pre-Round 8) keep working
-- until they re-run onboarding. The check constraints enforce the 4-value /
-- 3-value enums from the spec; tools_used is an array of free-form slugs
-- (catalog lives client-side, see lib/onboarding/tools.ts).
--
-- promises is jsonb so we can evolve the shape without a migration; the
-- canonical runtime shape is { promise_1: string, promise_2: string,
-- promise_3: string, generated_at: string, model: string }.
--
-- last_profile_check is reserved for the periodic re-check (Edge Function,
-- not implemented in MVP) — defaulted to NOW() so freshly profiled users
-- aren't immediately re-prompted.
--
-- RLS: existing users_select_own / users_update_own policies cover the new
-- columns transparently.

alter table public.users
  add column if not exists experience_level     text
    check (experience_level in ('beginner','tried_failed','working_on_it','advanced'));

alter table public.users
  add column if not exists project_clarity      text
    check (project_clarity in ('precise','vague','exploring'));

alter table public.users add column if not exists project_description  text;
alter table public.users add column if not exists tools_used           text[] default '{}'::text[];
alter table public.users add column if not exists tools_other          text;
alter table public.users add column if not exists preferred_tool       text;
alter table public.users add column if not exists deep_motivation      text;
alter table public.users add column if not exists promises             jsonb;
alter table public.users add column if not exists last_profile_check   timestamptz default now();
