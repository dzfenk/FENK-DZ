-- FENK V158: Admin control for game package image + description.
-- Existing game package data is preserved; columns are optional.

alter table public.game_packages
  add column if not exists image_url text,
  add column if not exists description text;

comment on column public.game_packages.image_url is 'Public image URL for the game package card, managed by Admin.';
comment on column public.game_packages.description is 'Optional short text/description shown with the game package.';

-- Keep the existing public/admin RLS model intact. This migration only adds fields.
