-- FENK V20260926 Telegram + Admin + notification hardening
-- Safe migration: no existing rows are deleted and RLS stays enabled.

create table if not exists public.telegram_event_dedup (
  event_key text primary key,
  status text not null default 'pending' check (status in ('pending','sent','failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  sent_at timestamptz null
);
alter table public.telegram_event_dedup enable row level security;

create or replace function public.claim_telegram_event(p_event_key text, p_ttl_seconds integer default 600)
returns boolean language plpgsql security definer set search_path=public as $$
declare r public.telegram_event_dedup;
begin
  if nullif(trim(p_event_key),'') is null then return false; end if;
  insert into public.telegram_event_dedup(event_key,status)
  values(trim(p_event_key),'pending')
  on conflict (event_key) do nothing
  returning * into r;
  if r.event_key is not null then return true; end if;

  update public.telegram_event_dedup
  set status='pending',updated_at=now(),sent_at=null
  where event_key=trim(p_event_key) and status='failed';
  if found then return true; end if;

  update public.telegram_event_dedup
  set status='pending',updated_at=now(),sent_at=null
  where event_key=trim(p_event_key)
    and status='pending'
    and updated_at < now()-make_interval(secs=>greatest(p_ttl_seconds,60));
  if found then return true; end if;
  return false;
end $$;

create or replace function public.mark_telegram_event_sent(p_event_key text)
returns boolean language plpgsql security definer set search_path=public as $$
begin
  update public.telegram_event_dedup set status='sent',sent_at=now(),updated_at=now()
  where event_key=trim(p_event_key);
  return found;
end $$;

create or replace function public.mark_telegram_event_failed(p_event_key text)
returns boolean language plpgsql security definer set search_path=public as $$
begin
  update public.telegram_event_dedup set status='failed',updated_at=now()
  where event_key=trim(p_event_key);
  return found;
end $$;

revoke all on function public.claim_telegram_event(text,integer) from public,anon,authenticated;
revoke all on function public.mark_telegram_event_sent(text) from public,anon,authenticated;
revoke all on function public.mark_telegram_event_failed(text) from public,anon,authenticated;
grant execute on function public.claim_telegram_event(text,integer) to service_role;
grant execute on function public.mark_telegram_event_sent(text) to service_role;
grant execute on function public.mark_telegram_event_failed(text) to service_role;
create index if not exists telegram_event_dedup_updated_idx on public.telegram_event_dedup(updated_at desc);

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.admin_users a where a.user_id=auth.uid());
$$;
revoke all on function public.is_admin() from public,anon;
grant execute on function public.is_admin() to authenticated;

alter table if exists public.admin_users enable row level security;
drop policy if exists admin_users_self_select on public.admin_users;
create policy admin_users_self_select on public.admin_users
for select to authenticated using (user_id=auth.uid());

alter table public.order_notifications add column if not exists event_key text;
create unique index if not exists order_notifications_event_key_uidx
on public.order_notifications(event_key) where event_key is not null;
create index if not exists order_notifications_recipient_unread_idx
on public.order_notifications(recipient_user_id,is_read,created_at desc);
