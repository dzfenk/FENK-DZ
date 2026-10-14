create table if not exists public.support_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  sender_role text not null default 'customer' check (sender_role in ('customer','admin')),
  message text not null check (length(trim(message)) between 1 and 4000),
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists support_messages_user_created_idx on public.support_messages(user_id, created_at desc);
alter table public.support_messages enable row level security;
drop policy if exists support_messages_customer_select on public.support_messages;
create policy support_messages_customer_select on public.support_messages for select to authenticated using (user_id=auth.uid() or public.is_admin());
drop policy if exists support_messages_customer_insert on public.support_messages;
create policy support_messages_customer_insert on public.support_messages for insert to authenticated with check (user_id=auth.uid() and sender_role='customer');
drop policy if exists support_messages_admin_insert on public.support_messages;
create policy support_messages_admin_insert on public.support_messages for insert to authenticated with check (public.is_admin() and sender_role='admin');
drop policy if exists support_messages_customer_update on public.support_messages;
create policy support_messages_customer_update on public.support_messages for update to authenticated using (user_id=auth.uid() or public.is_admin()) with check (user_id=auth.uid() or public.is_admin());
create or replace function public.get_my_support_messages()
returns table(id uuid, message text, sender_role text, is_read boolean, created_at timestamptz, order_id uuid)
language sql security definer set search_path=public as $$
  select sm.id,sm.message,sm.sender_role,sm.is_read,sm.created_at,sm.order_id
  from public.support_messages sm where sm.user_id=auth.uid() order by sm.created_at asc limit 100;
$$;
create or replace function public.send_my_support_message(p_message text,p_order_id uuid default null)
returns public.support_messages language plpgsql security definer set search_path=public as $$
declare r public.support_messages;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  if nullif(trim(p_message),'') is null then raise exception 'MESSAGE_REQUIRED'; end if;
  if length(trim(p_message))>4000 then raise exception 'MESSAGE_TOO_LONG'; end if;
  insert into public.support_messages(user_id,order_id,sender_role,message) values(auth.uid(),p_order_id,'customer',trim(p_message)) returning * into r;
  return r;
end; $$;
revoke all on function public.get_my_support_messages() from public;
grant execute on function public.get_my_support_messages() to authenticated;
revoke all on function public.send_my_support_message(text,uuid) from public;
grant execute on function public.send_my_support_message(text,uuid) to authenticated;
