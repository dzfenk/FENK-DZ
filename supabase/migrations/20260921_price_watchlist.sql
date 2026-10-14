create table if not exists public.price_watchlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_url text not null,
  target_price_dzd numeric(12,2) not null check (target_price_dzd > 0),
  is_active boolean not null default true,
  last_checked_at timestamptz,
  last_price_dzd numeric(12,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists price_watchlist_user_active_idx on public.price_watchlist(user_id,is_active,created_at desc);
alter table public.price_watchlist enable row level security;
drop policy if exists price_watchlist_self on public.price_watchlist;
create policy price_watchlist_self on public.price_watchlist for all to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
