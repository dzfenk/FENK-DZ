-- FENK V149: public read path for active Barid Mob payment settings.
create or replace function public.get_public_barid_mob_payment_settings()
returns table (display_name text, account_number text, phone_number text, instructions text)
language sql security definer set search_path = public as $$
  select ps.display_name, ps.account_number, ps.phone_number, ps.instructions
  from public.payment_settings ps
  where ps.method = 'barid_mob' and ps.is_active = true
  order by ps.updated_at desc nulls last limit 1;
$$;
revoke all on function public.get_public_barid_mob_payment_settings() from public;
grant execute on function public.get_public_barid_mob_payment_settings() to anon, authenticated;
