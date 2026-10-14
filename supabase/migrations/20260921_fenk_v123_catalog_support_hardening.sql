-- FENK V123: restore public game catalog visibility from real active packages
-- and harden Telegram session storage. No mock/demo rows are inserted.

-- Games that have at least one active package must be visible in the customer catalog.
update public.games g
set is_active = true
where coalesce(g.is_active,false) = false
  and exists (
    select 1 from public.game_packages p
    where p.game_id = g.id and p.is_active = true
  );

-- Telegram order sessions are server-side state. Keep them inaccessible to
-- anon/authenticated clients; the service_role used by Edge Functions bypasses RLS.
alter table public.telegram_order_sessions enable row level security;

drop policy if exists telegram_order_sessions_no_client_select on public.telegram_order_sessions;
drop policy if exists telegram_order_sessions_no_client_insert on public.telegram_order_sessions;
drop policy if exists telegram_order_sessions_no_client_update on public.telegram_order_sessions;
drop policy if exists telegram_order_sessions_no_client_delete on public.telegram_order_sessions;

create policy telegram_order_sessions_no_client_select
on public.telegram_order_sessions for select to anon, authenticated
using (false);

create policy telegram_order_sessions_no_client_insert
on public.telegram_order_sessions for insert to anon, authenticated
with check (false);

create policy telegram_order_sessions_no_client_update
on public.telegram_order_sessions for update to anon, authenticated
using (false) with check (false);

create policy telegram_order_sessions_no_client_delete
on public.telegram_order_sessions for delete to anon, authenticated
using (false);

-- Helpful indexes for the catalog and ownership checks.
create index if not exists marketplace_ads_category_status_created_idx
  on public.marketplace_ads(category_id, status, created_at desc);
create index if not exists marketplace_ads_user_created_idx
  on public.marketplace_ads(user_id, created_at desc);
create index if not exists game_packages_game_active_idx
  on public.game_packages(game_id, is_active);
create index if not exists game_favorites_game_id_idx
  on public.game_favorites(game_id);
create index if not exists support_messages_order_id_idx
  on public.support_messages(order_id);
