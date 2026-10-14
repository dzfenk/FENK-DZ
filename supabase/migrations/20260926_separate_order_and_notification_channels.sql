-- FENK: keep order workflow out of the Notifications channel.
-- Additive/safe change: no rows are deleted, RLS stays enabled, and order history is preserved.

alter table public.order_notifications
  add column if not exists notification_type text;

create index if not exists order_notifications_type_recipient_idx
  on public.order_notifications(recipient_user_id, notification_type, created_at desc);

-- Mark legacy admin-side "new order" notifications so they can be excluded
-- without deleting the existing records.
update public.order_notifications n
set notification_type='order_admin'
where n.notification_type is null
  and n.title='طلب شحن جديد'
  and exists (
    select 1 from public.admin_users a
    where a.user_id=n.recipient_user_id
  );

-- New orders are already delivered to the dedicated FENK Orders Telegram bot
-- and are visible in the admin Orders area. Do not create another generic
-- Notifications row for admins. Keep the existing order history write intact.
create or replace function public.create_order_admin_notifications()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
begin
  insert into public.order_status_history(order_id, old_status, new_status, changed_by)
  values (new.id, null, new.status, new.user_id);
  return new;
end;
$$;

revoke execute on function public.create_order_admin_notifications() from public, anon, authenticated;

-- Customer notification functions remain unchanged. Only admin-side order rows
-- are filtered from the generic Notifications feed/count.
create or replace function public.get_my_notifications()
returns table(
  id uuid,
  title text,
  message text,
  is_read boolean,
  order_id uuid,
  created_at timestamptz
)
language sql
security definer
set search_path=public
as $$
  select n.id,n.title,n.message,n.is_read,n.order_id,n.created_at
  from public.order_notifications n
  where auth.uid() is not null
    and n.recipient_user_id=auth.uid()
    and not (
      n.notification_type='order_admin'
      and exists (select 1 from public.admin_users a where a.user_id=auth.uid())
    )
  order by n.created_at desc
  limit 50;
$$;

create or replace function public.get_my_unread_notification_count()
returns integer
language sql
security definer
set search_path=public
as $$
  select count(*)::integer
  from public.order_notifications n
  where auth.uid() is not null
    and n.recipient_user_id=auth.uid()
    and n.is_read=false
    and not (
      n.notification_type='order_admin'
      and exists (select 1 from public.admin_users a where a.user_id=auth.uid())
    );
$$;

grant execute on function public.get_my_notifications() to authenticated;
grant execute on function public.get_my_unread_notification_count() to authenticated;

comment on column public.order_notifications.notification_type is
  'FENK notification routing type. order_admin is reserved for legacy admin order rows and is excluded from the generic Notifications feed.';
