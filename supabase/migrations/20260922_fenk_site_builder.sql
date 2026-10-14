-- FENK V156 — persistent homepage/site builder configuration.
-- Uses existing site_settings RLS: public read, admin-only write.
alter table public.site_settings
  add column if not exists homepage_config jsonb not null default '{}'::jsonb;
