-- FENK V183: install the missing game display settings table.
-- Run this ONCE in Supabase SQL Editor for the project's database.

create table if not exists public.game_display_settings (
  game_id uuid primary key references public.games(id) on delete cascade,
  image_size text not null default 'medium' check (image_size in ('small','medium','large')),
  image_fit text not null default 'contain' check (image_fit in ('contain','cover')),
  desktop_columns integer not null default 2 check (desktop_columns between 2 and 4),
  mobile_columns integer not null default 2 check (mobile_columns between 1 and 2),
  image_padding integer not null default 8 check (image_padding between 0 and 32),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.game_display_settings enable row level security;

drop policy if exists game_display_settings_public_select on public.game_display_settings;
create policy game_display_settings_public_select
on public.game_display_settings for select
using (true);

drop policy if exists game_display_settings_admin_insert on public.game_display_settings;
create policy game_display_settings_admin_insert
on public.game_display_settings for insert to authenticated
with check (public.is_admin());

drop policy if exists game_display_settings_admin_update on public.game_display_settings;
create policy game_display_settings_admin_update
on public.game_display_settings for update to authenticated
using (public.is_admin()) with check (public.is_admin());

drop policy if exists game_display_settings_admin_delete on public.game_display_settings;
create policy game_display_settings_admin_delete
on public.game_display_settings for delete to authenticated
using (public.is_admin());

-- Refresh PostgREST's schema cache immediately.
notify pgrst, 'reload schema';
