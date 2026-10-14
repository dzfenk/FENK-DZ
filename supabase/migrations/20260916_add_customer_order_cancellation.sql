create or replace function public.cancel_customer_order(p_order_id uuid)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare r public.orders;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  select * into r from public.orders where id=p_order_id and user_id=auth.uid() for update;
  if not found then raise exception 'ORDER_NOT_FOUND'; end if;
  if r.status not in ('received','pricing','awaiting_payment','payment_submitted') then
    raise exception 'CANCEL_NOT_ALLOWED';
  end if;
  update public.orders set status='cancelled', updated_at=now() where id=p_order_id and user_id=auth.uid() returning * into r;
  return r;
end;
$$;
create or replace function public.protect_customer_order_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    if old.user_id = auth.uid()
       and old.status in ('received','pricing','awaiting_payment','payment_submitted')
       and new.status = 'cancelled'
       and new.user_id = old.user_id
       and new.order_number is not distinct from old.order_number
       and new.product_url is not distinct from old.product_url
       and new.product_name is not distinct from old.product_name
       and new.product_info is not distinct from old.product_info
       and new.product_description is not distinct from old.product_description
       and new.product_image_url is not distinct from old.product_image_url
       and new.source_site is not distinct from old.source_site
       and new.quantity is not distinct from old.quantity
       and new.product_price is not distinct from old.product_price
       and new.shipping_fee is not distinct from old.shipping_fee
       and new.service_fee is not distinct from old.service_fee
       and new.total_price is not distinct from old.total_price
       and new.currency is not distinct from old.currency
       and new.admin_note is not distinct from old.admin_note
       and new.customer_first_name is not distinct from old.customer_first_name
       and new.customer_last_name is not distinct from old.customer_last_name
       and new.customer_phone is not distinct from old.customer_phone
       and new.wilaya is not distinct from old.wilaya
       and new.commune is not distinct from old.commune
       and new.address is not distinct from old.address
       and new.postal_code is not distinct from old.postal_code
       and new.payment_info is not distinct from old.payment_info
       and new.tracking_number is not distinct from old.tracking_number
       and new.carrier_name is not distinct from old.carrier_name
       and new.tracking_url is not distinct from old.tracking_url
    then return new; end if;

    if old.user_id = auth.uid()
       and old.status = 'awaiting_payment'
       and new.status = 'payment_submitted'
       and new.user_id = old.user_id
       and new.payment_info is distinct from old.payment_info
       and new.payment_info like 'PROOF_PATH:' || auth.uid()::text || '/%'
       and new.order_number is not distinct from old.order_number
       and new.product_url is not distinct from old.product_url
       and new.product_name is not distinct from old.product_name
       and new.product_info is not distinct from old.product_info
       and new.product_description is not distinct from old.product_description
       and new.product_image_url is not distinct from old.product_image_url
       and new.source_site is not distinct from old.source_site
       and new.quantity is not distinct from old.quantity
       and new.product_price is not distinct from old.product_price
       and new.shipping_fee is not distinct from old.shipping_fee
       and new.service_fee is not distinct from old.service_fee
       and new.total_price is not distinct from old.total_price
       and new.currency is not distinct from old.currency
       and new.admin_note is not distinct from old.admin_note
       and new.customer_first_name is not distinct from old.customer_first_name
       and new.customer_last_name is not distinct from old.customer_last_name
       and new.customer_phone is not distinct from old.customer_phone
       and new.wilaya is not distinct from old.wilaya
       and new.commune is not distinct from old.commune
       and new.address is not distinct from old.address
       and new.postal_code is not distinct from old.postal_code
       and new.tracking_number is not distinct from old.tracking_number
       and new.carrier_name is not distinct from old.carrier_name
       and new.tracking_url is not distinct from old.tracking_url
    then return new; end if;

    if new.user_id is distinct from old.user_id
      or new.order_number is distinct from old.order_number
      or new.product_url is distinct from old.product_url
      or new.product_name is distinct from old.product_name
      or new.product_info is distinct from old.product_info
      or new.product_description is distinct from old.product_description
      or new.product_image_url is distinct from old.product_image_url
      or new.source_site is distinct from old.source_site
      or new.quantity is distinct from old.quantity
      or new.product_price is distinct from old.product_price
      or new.shipping_fee is distinct from old.shipping_fee
      or new.service_fee is distinct from old.service_fee
      or new.total_price is distinct from old.total_price
      or new.currency is distinct from old.currency
      or new.status is distinct from old.status
      or new.admin_note is distinct from old.admin_note
      or new.customer_first_name is distinct from old.customer_first_name
      or new.customer_last_name is distinct from old.customer_last_name
      or new.customer_phone is distinct from old.customer_phone
      or new.wilaya is distinct from old.wilaya
      or new.commune is distinct from old.commune
      or new.address is distinct from old.address
      or new.postal_code is distinct from old.postal_code
      or new.payment_info is distinct from old.payment_info
      or new.tracking_number is distinct from old.tracking_number
      or new.carrier_name is distinct from old.carrier_name
      or new.tracking_url is distinct from old.tracking_url
    then raise exception 'CUSTOMER_ORDER_UPDATE_NOT_ALLOWED'; end if;
  end if;
  return new;
end;
$$;
