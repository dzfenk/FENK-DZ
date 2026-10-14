-- FENK V40: customer payment information notification fix.
-- This migration targets the legacy FENK schema used by admin.js/app-v26.js.
-- It deliberately does not touch orders or payment data.

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

create or replace function public.fenk_notify_customer_payment_v40()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  payment_changed boolean := false;
  status_changed boolean := false;
  msg text;
  ttl text;
begin
  if tg_op <> 'UPDATE' or new.user_id is null then
    return new;
  end if;

  status_changed := new.status is distinct from old.status;
  payment_changed := new.payment_info is distinct from old.payment_info;

  if new.status = 'payment_confirmed' and (status_changed or payment_changed) then
    ttl := 'تم قبول طلبك وتأكيد الدفع ✓';
    msg := 'تم قبول طلبك وتأكيد الدفع ✓';
    if coalesce(trim(new.payment_info),'') <> '' then
      msg := msg || E'\n\n💳 معلومات الدفع: ' || trim(new.payment_info);
    end if;
    if coalesce(trim(new.admin_note),'') <> '' then
      msg := msg || E'\n📝 ملاحظة الإدارة: ' || trim(new.admin_note);
    end if;
    if new.total_price is not null then
      msg := msg || E'\n💰 المبلغ الإجمالي: ' || to_char(new.total_price,'FM999G999G999D00') || ' دج';
    end if;
    insert into public.notifications(user_id,order_id,title,message,is_read)
    values(new.user_id,new.id,ttl,msg,false);
  end if;
  return new;
end;
$$;

revoke all on function public.fenk_notify_customer_payment_v40() from public;

 drop trigger if exists trg_fenk_customer_payment_notification_v40 on public.orders;
create trigger trg_fenk_customer_payment_notification_v40
after update of status, payment_info, admin_note, total_price
on public.orders
for each row execute function public.fenk_notify_customer_payment_v40();

-- Realtime is optional; add the table only when the publication exists.
do $$
begin
  if exists (select 1 from pg_publication where pubname='supabase_realtime')
     and not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='notifications') then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;
