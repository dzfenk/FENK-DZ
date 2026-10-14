-- FENK Marketplace page/admin visual control.
-- Reuses existing site_settings and its admin-only write RLS.
alter table public.site_settings
  add column if not exists marketplace_config jsonb not null default '{}'::jsonb;
