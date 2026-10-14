-- FENK: optional per-game music fields.
-- Safe migration: only adds columns if the games table exists.
DO $$
BEGIN
  IF to_regclass('public.games') IS NOT NULL THEN
    ALTER TABLE public.games ADD COLUMN IF NOT EXISTS music_url text;
    ALTER TABLE public.games ADD COLUMN IF NOT EXISTS music_enabled boolean NOT NULL DEFAULT false;
    ALTER TABLE public.games ADD COLUMN IF NOT EXISTS music_autoplay boolean NOT NULL DEFAULT false;
    ALTER TABLE public.games ADD COLUMN IF NOT EXISTS music_loop boolean NOT NULL DEFAULT true;
    ALTER TABLE public.games ADD COLUMN IF NOT EXISTS music_volume numeric(3,2) NOT NULL DEFAULT 0.50;
  END IF;
END $$;
