-- V104: restore PostgREST table grants for Marketplace while keeping RLS as the security boundary.
grant select on public.marketplace_ads to anon;
grant select, insert, update, delete on public.marketplace_ads to authenticated;
grant select on public.marketplace_categories to anon, authenticated;
grant select on public.marketplace_packages to anon, authenticated;
