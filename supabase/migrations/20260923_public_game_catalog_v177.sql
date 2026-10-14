-- FENK V177 — Restore the public game catalog RPC used by game-topup.html.
create or replace function public.get_public_game_catalog_v2()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare result jsonb;
begin
  select jsonb_build_object(
    'games', coalesce((select jsonb_agg(to_jsonb(g) order by g.sort_order nulls last, g.name) from (select id,name,slug,logo_url,banner_url,description,category,is_active,sort_order from public.games where is_active=true) g),'[]'::jsonb),
    'packages', coalesce((select jsonb_agg(to_jsonb(p) order by p.game_id, p.sort_order nulls last, p.name) from (select id,game_id,name,description,amount,image_url,price_dzd,payment_price_dzd,flexy_price_dzd,original_price_dzd,is_active,sort_order from public.game_packages where is_active=true) p),'[]'::jsonb),
    'checkout_fields', coalesce((select jsonb_agg(to_jsonb(f) order by f.game_id, f.sort_order nulls last, f.field_label) from (select id,game_id,field_key,field_label,field_type,placeholder,is_required,options,sort_order,is_active from public.game_checkout_fields where is_active=true) f),'[]'::jsonb)
  ) into result;
  return result;
end;
$$;
grant execute on function public.get_public_game_catalog_v2() to anon, authenticated;
