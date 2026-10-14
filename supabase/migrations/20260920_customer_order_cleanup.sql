-- FENK V60: customer-only order archive. Orders stay in admin/history.
alter table public.orders
  add column if not exists hidden_from_customer boolean not null default false;

create index if not exists idx_orders_user_visible_created
  on public.orders(user_id, hidden_from_customer, created_at desc);

create or replace function public.hide_my_order(p_order_id uuid)
returns boolean
language plpgsql
security definer
set search_path=public
as $$
declare
  affected integer;
begin
  if auth.uid() is null then return false; end if;
  update public.orders
  set hidden_from_customer=true, updated_at=now()
  where id=p_order_id
    and user_id=auth.uid()
    and status in ('cancelled','delivered','completed','rejected');
  get diagnostics affected = row_count;
  return affected > 0;
end $$;

revoke all on function public.hide_my_order(uuid) from public, anon;
grant execute on function public.hide_my_order(uuid) to authenticated;

drop policy if exists orders_self_read on public.orders;
create policy orders_self_read on public.orders
for select to public
using (
  (user_id=auth.uid() and coalesce(hidden_from_customer,false)=false)
  or exists (select 1 from public.admin_users a where a.user_id=auth.uid())
);
