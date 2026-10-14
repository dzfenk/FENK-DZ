-- FENK V72: Web Push subscriptions + admin-reply notification bridge.
create table if not exists public.web_push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, endpoint)
);

alter table public.web_push_subscriptions enable row level security;

drop policy if exists "users manage own web push subscriptions" on public.web_push_subscriptions;
create policy "users manage own web push subscriptions"
on public.web_push_subscriptions
for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create index if not exists idx_web_push_subscriptions_user
on public.web_push_subscriptions(user_id);

-- Keep push subscriptions current when the same browser re-subscribes.
drop trigger if exists trg_web_push_subscriptions_updated_at on public.web_push_subscriptions;
create or replace function public.set_web_push_subscription_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
create trigger trg_web_push_subscriptions_updated_at
before update on public.web_push_subscriptions
for each row execute function public.set_web_push_subscription_updated_at();

-- An admin support reply becomes a normal customer notification, so the same
-- notification pipeline can deliver it in-app and through Web Push.
create or replace function public.create_support_reply_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.sender_role = 'admin' then
    insert into public.order_notifications(recipient_user_id, order_id, title, message, is_read)
    values (
      new.user_id,
      new.order_id,
      'رسالة جديدة من FENK',
      left(coalesce(new.message, 'لديك رسالة جديدة من فريق FENK.'), 500),
      false
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_support_reply_notification on public.support_messages;
create trigger trg_support_reply_notification
after insert on public.support_messages
for each row execute function public.create_support_reply_notification();

-- Realtime is still used by the open site; Web Push covers the closed/background case.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname='supabase_realtime' and schemaname='public' and tablename='web_push_subscriptions'
  ) then
    -- subscriptions themselves do not need to be broadcast; leave them out of realtime.
    null;
  end if;
end $$;
