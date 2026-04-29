-- Round 2 — extra state fields on public.users for post-signup UX flows.
-- welcome_seen_at:      set when the user dismisses the dashboard welcome card
-- push_prompted_at:     reserved for the push-permission prompt (Round 3+)
-- ai_eval_prompted_at:  reserved for the GDPR AI-eval consent prompt (Round 3+)
--
-- RLS: existing users_update_own / users_select_own policies cover these
-- columns transparently — no policy change needed.

alter table public.users add column if not exists welcome_seen_at      timestamptz;
alter table public.users add column if not exists push_prompted_at     timestamptz;
alter table public.users add column if not exists ai_eval_prompted_at  timestamptz;
