-- FENK core schema reconciliation: keep the existing project/data and align
-- the frontend/admin contract with the current orders/profiles structure.
alter table public.profiles
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists avatar_url text;

update public.profiles
set first_name = coalesce(first_name, split_part(trim(full_name), ' ', 1)),
    last_name = coalesce(last_name, nullif(trim(regexp_replace(trim(full_name), '^\S+\s*', '')), ''))
where first_name is null or last_name is null;

alter table public.orders
  add column if not exists product_url text,
  add column if not exists product_name text,
  add column if not exists product_info text,
  add column if not exists product_image_url text,
  add column if not exists quantity integer not null default 1,
  add column if not exists customer_first_name text,
  add column if not exists customer_last_name text,
  add column if not exists wilaya text,
  add column if not exists commune text,
  add column if not exists address text,
  add column if not exists postal_code text,
  add column if not exists product_price numeric,
  add column if not exists shipping_fee numeric,
  add column if not exists service_fee numeric,
  add column if not exists total_price numeric,
  add column if not exists currency text not null default 'DZD',
  add column if not exists carrier_name text,
  add column if not exists tracking_number text,
  add column if not exists tracking_url text,
  add column if not exists payment_info text,
  add column if not exists admin_note text;

alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders add constraint orders_status_check check (
  status = any (array[
    'received','pricing','awaiting_payment','payment_submitted',
    'payment_confirmed','purchasing','shipped','arrived_algeria',
    'out_for_delivery','delivered','pending','paid','processing',
    'completed','rejected','cancelled'
  ])
);

create index if not exists idx_orders_user_created on public.orders(user_id, created_at desc);
create index if not exists idx_orders_status_created on public.orders(status, created_at desc);

create table if not exists public.customer_addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null default 'العنوان الرئيسي',
  first_name text,
  last_name text,
  full_name text,
  phone text,
  wilaya text,
  commune text,
  address text,
  postal_code text,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.customer_addresses enable row level security;
drop policy if exists customer_addresses_self_select on public.customer_addresses;
drop policy if exists customer_addresses_self_insert on public.customer_addresses;
drop policy if exists customer_addresses_self_update on public.customer_addresses;
drop policy if exists customer_addresses_self_delete on public.customer_addresses;
create policy customer_addresses_self_select on public.customer_addresses for select to authenticated using (user_id=(select auth.uid()));
create policy customer_addresses_self_insert on public.customer_addresses for insert to authenticated with check (user_id=(select auth.uid()));
create policy customer_addresses_self_update on public.customer_addresses for update to authenticated using (user_id=(select auth.uid())) with check (user_id=(select auth.uid()));
create policy customer_addresses_self_delete on public.customer_addresses for delete to authenticated using (user_id=(select auth.uid()));
create index if not exists customer_addresses_user_created_idx on public.customer_addresses(user_id, created_at desc);

create or replace function public.cancel_customer_order(p_order_id uuid)
returns boolean language plpgsql security definer set search_path=public as $$
declare affected integer;
begin
  update public.orders set status='cancelled', updated_at=now()
  where id=p_order_id and user_id=(select auth.uid())
    and status in ('received','pricing','awaiting_payment','payment_submitted');
  get diagnostics affected = row_count;
  return affected > 0;
end $$;
revoke execute on function public.cancel_customer_order(uuid) from anon;
grant execute on function public.cancel_customer_order(uuid) to authenticated;

create or replace function public.submit_payment_proof(p_order_id uuid, p_proof_path text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare oid uuid;
begin
  if p_proof_path is null or length(trim(p_proof_path))=0 then raise exception 'proof_path_required'; end if;
  select id into oid from public.orders where id=p_order_id and user_id=(select auth.uid())
    and status in ('awaiting_payment','pricing','received') for update;
  if oid is null then raise exception 'order_not_found_or_not_payable'; end if;
  insert into public.payment_proofs(order_id,storage_path,uploaded_by)
  values (oid,p_proof_path,(select auth.uid()))
  on conflict (order_id) do update set storage_path=excluded.storage_path, uploaded_by=excluded.uploaded_by;
  update public.orders set status='payment_submitted', payment_reference=p_proof_path, payment_info='PROOF_PATH:'||p_proof_path, updated_at=now() where id=oid;
  return jsonb_build_object('order_id',oid,'status','payment_submitted');
end $$;
revoke execute on function public.submit_payment_proof(uuid,text) from anon;
grant execute on function public.submit_payment_proof(uuid,text) to authenticated;

create or replace function public.delete_my_notification(p_notification_id uuid)
returns boolean language plpgsql security definer set search_path=public as $$
declare affected integer;
begin
  delete from public.order_notifications where id=p_notification_id and recipient_user_id=(select auth.uid());
  get diagnostics affected = row_count;
  return affected > 0;
end $$;
revoke execute on function public.delete_my_notification(uuid) from anon;
grant execute on function public.delete_my_notification(uuid) to authenticated;

create or replace function public.delete_my_read_notifications()
returns integer language plpgsql security definer set search_path=public as $$
declare affected integer;
begin
  delete from public.order_notifications where recipient_user_id=(select auth.uid()) and is_read=true;
  get diagnostics affected = row_count;
  return affected;
end $$;
revoke execute on function public.delete_my_read_notifications() from anon;
grant execute on function public.delete_my_read_notifications() to authenticated;

create index if not exists idx_order_notifications_recipient_created
on public.order_notifications(recipient_user_id, created_at desc);

-- Customer support: one INSERT policy instead of two overlapping policies.
drop policy if exists support_messages_customer_insert on public.support_messages;
drop policy if exists support_messages_admin_insert on public.support_messages;
create policy support_messages_insert on public.support_messages for insert to authenticated
with check ((sender_role='customer' and user_id=(select auth.uid())) or (sender_role='admin' and public.is_admin()));

revoke execute on function public.create_order_admin_notifications() from anon, authenticated;
revoke execute on function public.handle_new_user() from anon, authenticated;
revoke execute on function public.log_order_created() from anon, authenticated;
revoke execute on function public.log_order_status_change() from anon, authenticated;
revoke execute on function public.notify_customer_payment_info() from anon, authenticated;
revoke execute on function public.prepare_order() from anon, authenticated;
revoke execute on function public.record_order_status_change() from anon, authenticated;
revoke execute on function public.set_order_payment_destination() from anon, authenticated;
revoke execute on function public.claim_login_reward() from anon, authenticated;
revoke execute on function public.complete_reward_game_request(uuid,integer,text) from anon, authenticated;
revoke execute on function public.request_game_topup_with_rewards(uuid,uuid,text,text,text,text,text) from anon, authenticated;
revoke execute on function public.request_game_with_rewards(text,text,text,text,text) from anon, authenticated;
revoke execute on function public.is_admin() from anon;
grant execute on function public.is_admin() to authenticated;

-- General product orders have no game/package reference.
alter table public.orders alter column game_id drop not null;
alter table public.orders alter column package_id drop not null;

-- Correct Algerian phone validation: +213 followed by 5/6/7 and 8 digits.
alter table public.orders drop constraint if exists orders_phone_format;
alter table public.orders add constraint orders_phone_format check (
  customer_phone is null or customer_phone ~ '^\+213(5|6|7)[0-9]{8}$'
);

-- Product orders are accepted by the existing prepare trigger; game orders still
-- require a real active package.
create or replace function public.prepare_order()
returns trigger language plpgsql security definer set search_path=public as $$
declare pkg public.game_packages%rowtype; game_name text;
begin
  if new.game_id is null and new.package_id is null then
    new.confirmation_message := 'تم استلام طلب المنتج بنجاح. سيتحقق فريق FENK من الرابط أو الصورة ثم يرسل لك السعر ومعلومات الدفع.';
    return new;
  end if;
  select * into pkg from public.game_packages
  where id=new.package_id and game_id=new.game_id and is_active=true;
  if not found then raise exception 'الباقة غير متاحة لهذه اللعبة'; end if;
  if new.payment_method='barid_mob' then
    if pkg.payment_price_dzd is null then raise exception 'سعر بريد موب غير محدد لهذه الباقة'; end if;
    new.amount_dzd := pkg.payment_price_dzd;
  elsif new.payment_method='flexy' then
    if pkg.flexy_price_dzd is null then raise exception 'سعر فليكسي غير محدد لهذه الباقة'; end if;
    new.amount_dzd := pkg.flexy_price_dzd;
  end if;
  select name into game_name from public.games where id=new.game_id;
  new.confirmation_message := 'تم إرسال طلبك بنجاح إلى الجهة المختصة. شكراً لثقتك بنا. سيتم تنفيذ شحن ' || coalesce(pkg.amount,pkg.name) || ' في ' || coalesce(game_name,'اللعبة') || ' قريباً.';
  return new;
end $$;

-- Private bucket used for customer product images and payment proofs.
insert into storage.buckets (id,name,public)
values ('product-images','product-images',false)
on conflict (id) do nothing;
drop policy if exists product_images_customer_insert on storage.objects;
drop policy if exists product_images_customer_read on storage.objects;
drop policy if exists product_images_customer_delete on storage.objects;
create policy product_images_customer_insert on storage.objects for insert to authenticated
with check (bucket_id='product-images' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy product_images_customer_read on storage.objects for select to authenticated
using (bucket_id='product-images' and ((storage.foldername(name))[1]=(select auth.uid())::text or public.is_admin()));
create policy product_images_customer_delete on storage.objects for delete to authenticated
using (bucket_id='product-images' and (storage.foldername(name))[1]=(select auth.uid())::text);

-- Remove default PUBLIC EXECUTE from security-sensitive functions.
revoke execute on function public.create_order_admin_notifications() from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.log_order_created() from public, anon, authenticated;
revoke execute on function public.log_order_status_change() from public, anon, authenticated;
revoke execute on function public.notify_customer_payment_info() from public, anon, authenticated;
revoke execute on function public.prepare_order() from public, anon, authenticated;
revoke execute on function public.record_order_status_change() from public, anon, authenticated;
revoke execute on function public.set_order_payment_destination() from public, anon, authenticated;
revoke execute on function public.claim_login_reward() from public, anon, authenticated;
revoke execute on function public.complete_reward_game_request(uuid,integer,text) from public, anon, authenticated;
revoke execute on function public.request_game_topup_with_rewards(uuid,uuid,text,text,text,text,text) from public, anon, authenticated;
revoke execute on function public.request_game_with_rewards(text,text,text,text,text) from public, anon, authenticated;
revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;
revoke execute on function public.get_my_support_messages() from public, anon;
grant execute on function public.get_my_support_messages() to authenticated;
revoke execute on function public.send_my_support_message(text,uuid) from public, anon;
grant execute on function public.send_my_support_message(text,uuid) to authenticated;
revoke execute on function public.cancel_customer_order(uuid) from public, anon;
grant execute on function public.cancel_customer_order(uuid) to authenticated;
revoke execute on function public.submit_payment_proof(uuid,text) from public, anon;
grant execute on function public.submit_payment_proof(uuid,text) to authenticated;
revoke execute on function public.delete_my_notification(uuid) from public, anon;
grant execute on function public.delete_my_notification(uuid) to authenticated;
revoke execute on function public.delete_my_read_notifications() from public, anon;
grant execute on function public.delete_my_read_notifications() to authenticated;

-- Remove known duplicate/redundant indexes; keep the original indexes already used by the schema.
drop index if exists public.uq_game_checkout_fields_game_key;
drop index if exists public.idx_order_notifications_recipient_created;
