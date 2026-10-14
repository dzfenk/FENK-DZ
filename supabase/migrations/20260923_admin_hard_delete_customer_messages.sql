-- FENK V191 — Admin-only permanent deletion of a customer's support conversation.
-- Deletes the customer's support thread only; the auth account, profile, orders,
-- marketplace ads and other business data are intentionally preserved.
-- RLS remains enabled; no public/anonymous delete permission is added.

create or replace function public.admin_hard_delete_customer_messages(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  uid uuid := auth.uid();
  deleted_count integer := 0;
  rec record;
begin
  if uid is null or not public.is_admin() then
    raise exception 'admin_required' using errcode='42501';
  end if;

  if p_user_id is null then
    raise exception 'user_id_required';
  end if;

  -- Remove dependent rows first for any FK that points to support_messages(id)
  -- and is not configured with ON DELETE CASCADE.
  for rec in
    select n.nspname as child_schema,
           c.relname as child_table,
           a.attname as child_column
    from pg_constraint con
    join pg_class c on c.oid=con.conrelid
    join pg_namespace n on n.oid=c.relnamespace
    join pg_class parent on parent.oid=con.confrelid
    join pg_namespace pn on pn.oid=parent.relnamespace
    join pg_attribute a on a.attrelid=c.oid and a.attnum=con.conkey[1]
    where con.contype='f'
      and pn.nspname='public'
      and parent.relname='support_messages'
      and array_length(con.conkey,1)=1
      and array_length(con.confkey,1)=1
      and c.oid <> 'public.support_messages'::regclass
      and not a.attisdropped
      and con.confdeltype <> 'c'
  loop
    execute format(
      'delete from %I.%I where %I in (select id from public.support_messages where user_id=$1)',
      rec.child_schema, rec.child_table, rec.child_column
    ) using p_user_id;
  end loop;

  delete from public.support_messages where user_id=p_user_id;
  get diagnostics deleted_count=row_count;

  return jsonb_build_object('deleted_count',deleted_count,'user_id',p_user_id);
end;
$$;

revoke all on function public.admin_hard_delete_customer_messages(uuid) from public, anon;
grant execute on function public.admin_hard_delete_customer_messages(uuid) to authenticated;
