-- Validate pricing components directly because orders.total_price is generated.
create or replace function public.validate_order_pricing_state()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
begin
  if new.status = 'pricing' and (
    new.product_price is null or new.shipping_fee is null or new.service_fee is null or
    (coalesce(new.product_price,0) + coalesce(new.shipping_fee,0) + coalesce(new.service_fee,0)) <= 0
  ) then
    raise exception 'PRICE_NOT_READY';
  end if;
  return new;
end;
$function$;
