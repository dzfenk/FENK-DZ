
-- FENK V91: structured Marketplace classified ads
alter table public.advertisements
  add column if not exists details jsonb not null default '{}'::jsonb,
  add column if not exists wilaya text,
  add column if not exists municipality text;

create table if not exists public.ad_payment_settings (
  id uuid primary key default gen_random_uuid(),
  method text not null default 'baridimob',
  account_name text,
  account_number text,
  instructions text,
  is_active boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.ad_payment_settings enable row level security;
drop policy if exists ad_payment_settings_public_read on public.ad_payment_settings;
create policy ad_payment_settings_public_read on public.ad_payment_settings
for select to anon, authenticated using (is_active = true or (select public.is_admin()));
drop policy if exists ad_payment_settings_admin_insert on public.ad_payment_settings;
create policy ad_payment_settings_admin_insert on public.ad_payment_settings
for insert to authenticated with check ((select public.is_admin()));
drop policy if exists ad_payment_settings_admin_update on public.ad_payment_settings;
create policy ad_payment_settings_admin_update on public.ad_payment_settings
for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
drop policy if exists ad_payment_settings_admin_delete on public.ad_payment_settings;
create policy ad_payment_settings_admin_delete on public.ad_payment_settings
for delete to authenticated using ((select public.is_admin()));

insert into public.ad_payment_settings(method, account_name, account_number, instructions)
select 'baridimob', null, null, 'اعرض حساب بريد موب هنا من لوحة Admin ثم أخبر المعلن أن الدفع يتم خارج الموقع.'
where not exists (select 1 from public.ad_payment_settings);

-- Category aliases used by the classified flow.
-- Existing ad_type values remain valid.
