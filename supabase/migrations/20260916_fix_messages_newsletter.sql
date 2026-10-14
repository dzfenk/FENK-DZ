-- FENK reliability migration: customer support messages + newsletter persistence.
create or replace function public.get_my_support_messages()
returns table(id uuid, message text, sender_role text, is_read boolean, created_at timestamptz, order_id uuid)
language sql security definer set search_path = public
as $$
  select sm.id, sm.message, sm.sender_role, sm.is_read, sm.created_at, sm.order_id
  from public.support_messages sm
  where sm.user_id = auth.uid()
  order by sm.created_at asc
  limit 100;
$$;

create or replace function public.send_my_support_message(p_message text, p_order_id uuid default null)
returns public.support_messages
language plpgsql security definer set search_path = public
as $$
declare r public.support_messages;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  if nullif(trim(p_message), '') is null then raise exception 'MESSAGE_REQUIRED'; end if;
  if length(trim(p_message)) > 4000 then raise exception 'MESSAGE_TOO_LONG'; end if;
  insert into public.support_messages(user_id, order_id, sender_role, message)
  values(auth.uid(), p_order_id, 'customer', trim(p_message))
  returning * into r;
  return r;
end;
$$;

revoke all on function public.get_my_support_messages() from public;
grant execute on function public.get_my_support_messages() to authenticated;
revoke all on function public.send_my_support_message(text, uuid) from public;
grant execute on function public.send_my_support_message(text, uuid) to authenticated;

create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  created_at timestamptz not null default now()
);
create unique index if not exists newsletter_subscribers_email_key
  on public.newsletter_subscribers (lower(email));
alter table public.newsletter_subscribers enable row level security;
drop policy if exists newsletter_subscribers_insert on public.newsletter_subscribers;
create policy newsletter_subscribers_insert on public.newsletter_subscribers
  for insert to anon, authenticated
  with check (email = lower(trim(email)) and length(email) between 5 and 254);
revoke all on public.newsletter_subscribers from public;
grant insert on public.newsletter_subscribers to anon, authenticated;
