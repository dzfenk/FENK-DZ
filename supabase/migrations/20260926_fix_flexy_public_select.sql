-- FENK FIX 2026-09-26
-- Keep RLS enabled. Public customers must be able to read active Flexy
-- operators without requiring execute permission on is_admin().
-- Authenticated admins can read all rows; public/anonymous users only active rows.

alter table public.game_flexy_operators enable row level security;

drop policy if exists game_flexy_public_select on public.game_flexy_operators;
drop policy if exists game_flexy_anon_select on public.game_flexy_operators;
drop policy if exists game_flexy_authenticated_select on public.game_flexy_operators;

create policy game_flexy_anon_select
on public.game_flexy_operators
for select to anon
using (is_active = true);

create policy game_flexy_authenticated_select
on public.game_flexy_operators
for select to authenticated
using (is_active = true or public.is_admin());

-- Ensure the admin CRUD policies remain intact and RLS stays enabled.
