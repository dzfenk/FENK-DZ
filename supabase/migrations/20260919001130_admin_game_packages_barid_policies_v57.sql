-- FENK V57: Admin CRUD for game packages and public active payment settings.
drop policy if exists game_packages_customer_select on public.game_packages;
create policy game_packages_customer_select on public.game_packages for select to anon, authenticated using (is_active = true or public.is_admin());
drop policy if exists game_packages_admin_insert on public.game_packages;
create policy game_packages_admin_insert on public.game_packages for insert to authenticated with check (public.is_admin());
drop policy if exists game_packages_admin_update on public.game_packages;
create policy game_packages_admin_update on public.game_packages for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists game_packages_admin_delete on public.game_packages;
create policy game_packages_admin_delete on public.game_packages for delete to authenticated using (public.is_admin());

drop policy if exists games_customer_select on public.games;
create policy games_customer_select on public.games for select to anon, authenticated using (is_active = true or public.is_admin());
drop policy if exists games_admin_insert on public.games;
create policy games_admin_insert on public.games for insert to authenticated with check (public.is_admin());
drop policy if exists games_admin_update on public.games;
create policy games_admin_update on public.games for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists games_admin_delete on public.games;
create policy games_admin_delete on public.games for delete to authenticated using (public.is_admin());

drop policy if exists payment_settings_customer_select on public.payment_settings;
create policy payment_settings_customer_select on public.payment_settings for select to anon, authenticated using (is_active = true or public.is_admin());
drop policy if exists payment_settings_admin_insert on public.payment_settings;
create policy payment_settings_admin_insert on public.payment_settings for insert to authenticated with check (public.is_admin());
drop policy if exists payment_settings_admin_update on public.payment_settings;
create policy payment_settings_admin_update on public.payment_settings for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists payment_settings_admin_delete on public.payment_settings;
create policy payment_settings_admin_delete on public.payment_settings for delete to authenticated using (public.is_admin());

create or replace function public.prepare_order()
returns trigger language plpgsql security definer set search_path=public as $$
declare pkg public.game_packages%rowtype; game_name text; pay public.payment_settings%rowtype;
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
    if coalesce(new.total_price,0) <= 0 then
      new.product_price := pkg.payment_price_dzd; new.shipping_fee := 0; new.service_fee := 0; new.total_price := pkg.payment_price_dzd;
    end if;
    select * into pay from public.payment_settings where method='barid_mob' and is_active=true limit 1;
    if found then
      new.payment_destination := coalesce(pay.account_number, pay.phone_number);
      new.payment_info := concat('طريقة الدفع: ', coalesce(pay.display_name,'بريد موب'),
        case when pay.account_number is not null then E'\nRIP: '||pay.account_number else '' end,
        case when pay.phone_number is not null then E'\nالهاتف: '||pay.phone_number else '' end,
        case when pay.instructions is not null and trim(pay.instructions)<>'' then E'\n'||pay.instructions else '' end);
    end if;
  elsif new.payment_method='flexy' then
    if pkg.flexy_price_dzd is null then raise exception 'سعر فليكسي غير محدد لهذه الباقة'; end if;
    new.amount_dzd := pkg.flexy_price_dzd;
  end if;
  new.confirmation_message := 'تم إرسال طلبك بنجاح إلى الجهة المختصة. شكراً لثقتك بنا. سيتم تنفيذ شحن ' || coalesce(pkg.amount,pkg.name) || ' في ' || coalesce(game_name,'اللعبة') || ' قريباً.';
  return new;
end;
$$;