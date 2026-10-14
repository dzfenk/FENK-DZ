-- FENK V189 — secure permanent deletion of cancelled orders.
-- Admin-only RPC. Keeps RLS enabled and removes dependent rows that would
-- otherwise block deletion because of restrictive foreign keys.
create or replace function public.admin_hard_delete_cancelled_orders(p_order_ids uuid[])
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  uid uuid := auth.uid();
  target_count integer;
  deleted_count integer := 0;
  rec record;
begin
  if uid is null or not public.is_admin() then
    raise exception 'admin_required' using errcode='42501';
  end if;

  if coalesce(array_length(p_order_ids,1),0)=0 then
    return jsonb_build_object('deleted_count',0);
  end if;

  select count(*) into target_count
  from public.orders
  where id = any(p_order_ids);

  if target_count <> array_length(p_order_ids,1) then
    raise exception 'one_or_more_orders_not_found';
  end if;

  if exists (
    select 1 from public.orders
    where id = any(p_order_ids) and status <> 'cancelled'
  ) then
    raise exception 'only_cancelled_orders_can_be_deleted';
  end if;

  -- Remove dependent rows first for foreign keys that do not cascade.
  -- Only single-column foreign keys pointing to public.orders(id) are handled.
  for rec in
    select n.nspname as child_schema,
           c.relname as child_table,
           a.attname as child_column
    from pg_constraint con
    join pg_class c on c.oid=con.conrelid
    join pg_namespace n on n.oid=c.relnamespace
    join pg_class p on p.oid=con.confrelid
    join pg_namespace pn on pn.oid=p.relnamespace
    join pg_attribute a on a.attrelid=c.oid and a.attnum=con.conkey[1]
    where con.contype='f'
      and pn.nspname='public'
      and p.relname='orders'
      and array_length(con.conkey,1)=1
      and array_length(con.confkey,1)=1
      and c.oid <> 'public.orders'::regclass
      and not a.attisdropped
  loop
    execute format(
      'delete from %I.%I where %I = any($1)',
      rec.child_schema, rec.child_table, rec.child_column
    ) using p_order_ids;
  end loop;

  delete from public.orders
  where id = any(p_order_ids) and status='cancelled';
  get diagnostics deleted_count=row_count;

  return jsonb_build_object('deleted_count',deleted_count);
end;
$$;

revoke all on function public.admin_hard_delete_cancelled_orders(uuid[]) from public, anon;
grant execute on function public.admin_hard_delete_cancelled_orders(uuid[]) to authenticated;
