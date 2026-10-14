-- FENK core schema reconciliation for the current frontend.
-- Applied to Supabase project wqfnzahjwlukncxlxdkp.

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
  add column if not exists admin_note text,
  add column if not exists order_number text,
  add column if not exists source_site text;

update public.orders set order_number=coalesce(order_number,order_code) where order_number is null;
alter table public.orders alter column order_number set default upper(substr(replace(gen_random_uuid()::text,'-',''),1,8));
alter table public.orders alter column source_site set default 'FENK';
create unique index if not exists orders_order_number_uidx on public.orders(order_number);

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
create policy customer_addresses_self_select on public.customer_addresses for select to authenticated using (user_id = (select auth.uid()));
create policy customer_addresses_self_insert on public.customer_addresses for insert to authenticated with check (user_id = (select auth.uid()));
create policy customer_addresses_self_update on public.customer_addresses for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy customer_addresses_self_delete on public.customer_addresses for delete to authenticated using (user_id = (select auth.uid()));
create index if not exists customer_addresses_user_created_idx on public.customer_addresses(user_id, created_at desc);

create or replace function public.cancel_customer_order(p_order_id uuid)
returns boolean
language plpgsql
security definer
set search_path=public
as $$
declare affected integer;
begin
  update public.orders
  set status='cancelled', updated_at=now()
  where id=p_order_id
    and user_id=(select auth.uid())
    and status in ('received','pricing','awaiting_payment','payment_submitted');
  get diagnostics affected = row_count;
  return affected > 0;
end $$;
revoke execute on function public.cancel_customer_order(uuid) from anon;
grant execute on function public.cancel_customer_order(uuid) to authenticated;

create or replace function public.submit_payment_proof(p_order_id uuid, p_proof_path text)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare oid uuid;
begin
  if p_proof_path is null or length(trim(p_proof_path))=0 then
    raise exception 'proof_path_required';
  end if;
  select id into oid from public.orders
  where id=p_order_id and user_id=(select auth.uid())
    and status in ('awaiting_payment','pricing','received')
  for update;
  if oid is null then raise exception 'order_not_found_or_not_payable'; end if;
  insert into public.payment_proofs(order_id,storage_path,uploaded_by)
  values (oid,p_proof_path,(select auth.uid()))
  on conflict (order_id) do update set storage_path=excluded.storage_path, uploaded_by=excluded.uploaded_by;
  update public.orders set status='payment_submitted', payment_reference=p_proof_path, updated_at=now()
  where id=oid;
  return jsonb_build_object('order_id',oid,'status','payment_submitted');
end $$;
revoke execute on function public.submit_payment_proof(uuid,text) from anon;
grant execute on function public.submit_payment_proof(uuid,text) to authenticated;

create or replace function public.delete_my_notification(p_notification_id uuid)
returns boolean
language plpgsql
security definer
set search_path=public
as $$
declare affected integer;
begin
  delete from public.order_notifications
  where id=p_notification_id and recipient_user_id=(select auth.uid());
  get diagnostics affected = row_count;
  return affected > 0;
end $$;
revoke execute on function public.delete_my_notification(uuid) from anon;
grant execute on function public.delete_my_notification(uuid) to authenticated;

create or replace function public.delete_my_read_notifications()
returns integer
language plpgsql
security definer
set search_path=public
as $$
declare affected integer;
begin
  delete from public.order_notifications
  where recipient_user_id=(select auth.uid()) and is_read=true;
  get diagnostics affected = row_count;
  return affected;
end $$;
revoke execute on function public.delete_my_read_notifications() from anon;
grant execute on function public.delete_my_read_notifications() to authenticated;

create index if not exists idx_order_notifications_recipient_created
on public.order_notifications(recipient_user_id, created_at desc);
