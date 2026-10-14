-- FENK V41: payment information notifications for the legacy FENK schema.
-- This matches the schema used by admin.js/app-v26.js in this package.

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  order_id uuid null references public.orders(id) on delete cascade,
  title text not null,
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.notifications enable row level security;

drop policy if exists "customers read own notifications" on public.notifications;
drop policy if exists "customers update own notifications" on public.notifications;
drop policy if exists "admins insert notifications" on public.notifications;
drop policy if exists "customers delete own notifications" on public.notifications;

create policy "customers read own notifications"
on public.notifications for select
using (user_id = auth.uid() or public.is_admin());

create policy "customers update own notifications"
on public.notifications for update
using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

create policy "admins insert notifications"
on public.notifications for insert
with check (public.is_admin());

-- The browser admin code creates the notification after a successful order update.
-- This function is intentionally not used as a trigger to avoid duplicate notifications.

-- Make notifications available to Realtime when the publication exists.
do $$
begin
  if exists (select 1 from pg_publication where pubname='supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
       where pubname='supabase_realtime'
         and schemaname='public'
         and tablename='notifications'
     ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;
