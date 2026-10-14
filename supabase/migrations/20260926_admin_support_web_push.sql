-- FENK: deliver customer Support messages to logged-in admin devices via Web Push.
-- Safe additive change: no rows are deleted, no RLS is disabled, and existing
-- Telegram/support behavior remains unchanged.

alter table public.order_notifications
  add column if not exists notification_type text;

create index if not exists order_notifications_type_recipient_idx
  on public.order_notifications(recipient_user_id, notification_type, created_at desc);

create or replace function public.create_admin_support_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  admin_row record;
begin
  -- Only customer -> FENK messages create admin device notifications.
  if new.sender_role <> 'customer' then
    return new;
  end if;

  for admin_row in
    select a.user_id
    from public.admin_users a
    where a.user_id is not null
  loop
    insert into public.order_notifications(
      recipient_user_id,
      order_id,
      title,
      message,
      is_read,
      event_key,
      notification_type
    )
    values (
      admin_row.user_id,
      new.order_id,
      '💬 رسالة جديدة من عميل FENK',
      left(coalesce(new.message, 'لديك رسالة جديدة من عميل FENK.'), 500),
      false,
      'support:' || new.id::text || ':' || admin_row.user_id::text,
      'support_message'
    )
    on conflict (event_key) where event_key is not null do nothing;
  end loop;

  return new;
end;
$$;

drop trigger if exists trg_admin_support_web_push on public.support_messages;
create trigger trg_admin_support_web_push
after insert on public.support_messages
for each row
execute function public.create_admin_support_notification();

revoke all on function public.create_admin_support_notification() from public, anon, authenticated;
