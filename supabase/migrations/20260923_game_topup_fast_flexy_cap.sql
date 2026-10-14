-- FENK V179 — faster public game catalog + hard Flexy 600 DZD cap.
-- Safe/additive: does not delete games, packages, orders or existing functions.

create or replace function public.get_public_game_catalog_fast()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare result jsonb;
begin
  select jsonb_build_object(
    'games', coalesce((
      select jsonb_agg(to_jsonb(g) order by g.sort_order nulls last, g.name)
      from (
        select id,name,slug,logo_url,banner_url,description,category,is_active,sort_order
        from public.games
        where is_active=true
      ) g
    ), '[]'::jsonb),
    'packages', coalesce((
      select jsonb_agg(to_jsonb(p) order by p.game_id, p.sort_order nulls last, p.name)
      from (
        select id,game_id,name,amount,image_url,price_dzd,payment_price_dzd,
               flexy_price_dzd,original_price_dzd,is_active,sort_order
        from public.game_packages
        where is_active=true
      ) p
    ), '[]'::jsonb)
  ) into result;
  return result;
end;
$$;

grant execute on function public.get_public_game_catalog_fast() to anon, authenticated;

-- Enforce the business rule at database level too:
-- a Flexy game-topup order can never exceed 600 DZD.
create or replace function public.guard_game_flexy_600()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
begin
  if coalesce(new.payment_method,'') = 'flexy'
     and coalesce(new.amount_dzd,0) > 600 then
    raise exception 'فلكسي متاح حتى 600 دج فقط';
  end if;
  return new;
end;
$$;

drop trigger if exists z_guard_game_flexy_600 on public.orders;
create trigger z_guard_game_flexy_600
after insert or update on public.orders
for each row execute function public.guard_game_flexy_600();

-- Admin-entered Flexy prices above 600 remain stored if needed for reference,
-- but they are never accepted as a Flexy order price.


-- Keep the existing order-preparation workflow, but allow a missing dedicated Flexy price
-- to fall back to the normal package price when that price is within the 600 DZD cap.
create or replace function public.prepare_order()
returns trigger language plpgsql security definer set search_path=public as $$
declare pkg public.game_packages%rowtype; game_name text; pay public.payment_settings%rowtype; op public.game_flexy_operators%rowtype; v_flexy_price numeric;
begin
  if new.game_id is null and new.package_id is null then
    new.confirmation_message := 'تم استلام طلب المنتج بنجاح. سيتحقق فريق FENK من الرابط أو الصورة ثم يرسل لك السعر ومعلومات الدفع.';
    return new;
  end if;
  select * into pkg from public.game_packages where id=new.package_id and game_id=new.game_id and is_active=true;
  if not found then raise exception 'الباقة غير متاحة لهذه اللعبة'; end if;
  select name into game_name from public.games where id=new.game_id;
  if new.payment_method='barid_mob' then
    if pkg.payment_price_dzd is null then raise exception 'سعر بريد موب غير محدد لهذه الباقة'; end if;
    new.amount_dzd := pkg.payment_price_dzd;
    if coalesce(new.total_price,0)<=0 then new.product_price:=pkg.payment_price_dzd; new.shipping_fee:=0; new.service_fee:=0; new.total_price:=pkg.payment_price_dzd; end if;
    select * into pay from public.payment_settings where method='barid_mob' and is_active=true limit 1;
    if found then
      new.payment_destination := coalesce(pay.account_number,pay.phone_number);
      new.payment_info := concat('طريقة الدفع: ',coalesce(pay.display_name,'بريد موب'),case when pay.account_number is not null then E'\nRIP: '||pay.account_number else '' end,case when pay.phone_number is not null then E'\nالهاتف: '||pay.phone_number else '' end,case when pay.instructions is not null and trim(pay.instructions)<>'' then E'\n'||pay.instructions else '' end);
    end if;
  elsif new.payment_method='flexy' then
    v_flexy_price := coalesce(pkg.flexy_price_dzd, pkg.payment_price_dzd, pkg.price_dzd); if v_flexy_price is null then raise exception 'سعر فليكسي غير محدد لهذه الباقة'; end if; if v_flexy_price > 600 then raise exception 'فلكسي متاح حتى 600 دج فقط'; end if;
    if new.flexy_operator is null then raise exception 'اختر متعامل فلكسي'; end if;
    select * into op from public.game_flexy_operators where operator=new.flexy_operator and is_active=true limit 1;
    if not found then raise exception 'متعامل فلكسي غير متاح'; end if;
    new.flexy_phone_snapshot := op.phone_number;
    new.payment_destination := op.phone_number;
    new.amount_dzd := v_flexy_price;
    new.product_price := v_flexy_price; new.shipping_fee:=0; new.service_fee:=0; new.total_price:=v_flexy_price;
    new.payment_info := concat('طريقة الدفع: فلكسي',E'\nالمتعامل: ',op.display_name,E'\nالرقم: ',op.phone_number,E'\nالمبلغ: ',v_flexy_price,' دج');
    new.status := 'processing';
  end if;
  new.confirmation_message := 'تم إرسال طلبك بنجاح إلى الجهة المختصة. شكراً لثقتك بنا. سيتم تنفيذ شحن '||coalesce(pkg.amount,pkg.name)||' في '||coalesce(game_name,'اللعبة')||' قريباً.';
  return new;
end;
$$;
