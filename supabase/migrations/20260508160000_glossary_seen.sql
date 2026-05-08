-- Glossario Vivo (Glossario_Vivo_Blueprint.md) — track which glossary
-- terms a given user has already explored, so the second occurrence of
-- a term in the lesson body renders with the attenuated "already seen"
-- style.
--
-- One column on `users`: a Postgres text[] of term ids (e.g. {'ide',
-- 'dipendenza'}). Each click on a glossary term server-action-appends
-- the id; sets stay small (12 terms in Path 1). No separate table —
-- relational join would be overkill for a flat per-user set.

alter table public.users
  add column if not exists glossary_seen text[] not null default '{}';
