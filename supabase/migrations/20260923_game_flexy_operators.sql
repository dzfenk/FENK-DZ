-- FENK V176 — Game top-up Flexy operators, per-package Flexy pricing and guarded statuses.
alter table public.orders
  add column if not exists flexy_operator text,
  add column if not exists flexy_phone_snapshot text,
  add column if not exists flexy_failure_action text;

alter table public.game_packages
  add column if not exists flexy_price_dzd numeric;

create table if not exists public.game_flexy_operators (
  id uuid primary key default gen_random_uuid(),
  operator text not null check (operator in ('mobilis','djezzy','ooredoo')),
  display_name text not null,
  phone_number text not null,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(operator)
);

alter table public.game_flexy_operators enable row level security;
drop policy if exists game_flexy_public_select on public.game_flexy_operators;
create policy game_flexy_public_select on public.game_flexy_operators
  for select to anon, authenticated using (is_active = true or public.is_admin());
drop policy if exists game_flexy_admin_insert on public.game_flexy_operators;
create policy game_flexy_admin_insert on public.game_flexy_operators
  for insert to authenticated with check (public.is_admin());
drop policy if exists game_flexy_admin_update on public.game_flexy_operators;
create policy game_flexy_admin_update on public.game_flexy_operators
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists game_flexy_admin_delete on public.game_flexy_operators;
create policy game_flexy_admin_delete on public.game_flexy_operators
  for delete to authenticated using (public.is_admin());

insert into public.game_flexy_operators(operator,display_name,phone_number,sort_order)
values
 ('mobilis','موبيليس','',1),
 ('djezzy','جازي','',2),
 ('ooredoo','أوريدو','',3)
on conflict (operator) do nothing;

alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders add constraint orders_status_check check (
  status = any (array[
    'received','pricing','awaiting_payment','payment_submitted','payment_confirmed',
    'purchasing','shipped','arrived_algeria','out_for_delivery','delivered','cancelled',
    'pending','paid','processing','completed','rejected','failed'
  ])
);

create or replace function public.guard_game_flexy_order()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if coalesce(new.payment_method,'') = 'flexy' then
    if new.flexy_operator is null or btrim(new.flexy_operator)='' then
      raise exception 'يجب اختيار متعامل فلكسي';
    end if;
    if tg_op='UPDATE' and (new.flexy_phone_snapshot is null or btrim(new.flexy_phone_snapshot)='') then
      raise exception 'رقم فلكسي غير محدد لهذا المتعامل';
    end if;
    if new.payment_proof_path is not null and btrim(new.payment_proof_path)<>'' then
      raise exception 'لا يسمح بإثبات دفع لطلبات فلكسي';
    end if;
    if tg_op='INSERT' then
      new.status := 'processing';
    elsif tg_op='UPDATE' and new.status is distinct from old.status then
      if not public.is_admin() then
        raise exception 'لا يمكن للمستخدم تغيير حالة طلب فلكسي';
      end if;
      if new.status not in ('processing','shipped','failed','cancelled') then
        raise exception 'حالة فلكسي غير مسموحة';
      end if;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_guard_game_flexy_order on public.orders;
create trigger trg_guard_game_flexy_order
before insert or update on public.orders
for each row execute function public.guard_game_flexy_order();

create or replace function public.prepare_order()
returns trigger language plpgsql security definer set search_path=public as $$
declare pkg public.game_packages%rowtype; game_name text; pay public.payment_settings%rowtype; op public.game_flexy_operators%rowtype;
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
    if pkg.flexy_price_dzd is null then raise exception 'سعر فليكسي غير محدد لهذه الباقة'; end if;
    if new.flexy_operator is null then raise exception 'اختر متعامل فلكسي'; end if;
    select * into op from public.game_flexy_operators where operator=new.flexy_operator and is_active=true limit 1;
    if not found then raise exception 'متعامل فلكسي غير متاح'; end if;
    new.flexy_phone_snapshot := op.phone_number;
    new.payment_destination := op.phone_number;
    new.amount_dzd := pkg.flexy_price_dzd;
    new.product_price := pkg.flexy_price_dzd; new.shipping_fee:=0; new.service_fee:=0; new.total_price:=pkg.flexy_price_dzd;
    new.payment_info := concat('طريقة الدفع: فلكسي',E'\nالمتعامل: ',op.display_name,E'\nالرقم: ',op.phone_number,E'\nالمبلغ: ',pkg.flexy_price_dzd,' دج');
    new.status := 'processing';
  end if;
  new.confirmation_message := 'تم إرسال طلبك بنجاح إلى الجهة المختصة. شكراً لثقتك بنا. سيتم تنفيذ شحن '||coalesce(pkg.amount,pkg.name)||' في '||coalesce(game_name,'اللعبة')||' قريباً.';
  return new;
end;
$$;
