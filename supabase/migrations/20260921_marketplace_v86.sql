
-- FENK V86: Marketplace categories + paid ad review security
create table if not exists public.marketplace_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  icon text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create table if not exists public.marketplace_packages (
  id uuid primary key default gen_random_uuid(),
  duration_days integer not null unique check(duration_days>0),
  fee_dzd numeric(12,2) not null check(fee_dzd>=0),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create table if not exists public.marketplace_ads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid references public.marketplace_categories(id),
  package_id uuid references public.marketplace_packages(id),
  title text not null,
  description text not null,
  price_dzd numeric(12,2),
  contact text not null,
  image_url text,
  payment_proof_path text,
  payment_method text not null default 'barid_mob',
  ad_fee_dzd numeric(12,2) not null default 0,
  payment_status text not null default 'pending' check(payment_status in ('pending','accepted','rejected')),
  approval_status text not null default 'pending' check(approval_status in ('pending','published','rejected')),
  start_at timestamptz,
  end_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.marketplace_categories enable row level security;
alter table public.marketplace_packages enable row level security;
alter table public.marketplace_ads enable row level security;

insert into public.marketplace_categories(name,slug,icon,sort_order)
values
('منتجات','products','package',1),
('متاجر','stores','store',2),
('سيارات للبيع','cars','car-front',3),
('عقارات','realestate','building-2',4),
('أراضي للبيع','land','trees',5)
on conflict(slug) do update set name=excluded.name, icon=excluded.icon, sort_order=excluded.sort_order;

insert into public.marketplace_packages(duration_days,fee_dzd,sort_order)
values (3,500,1),(7,1000,2),(15,1500,3),(30,2500,4)
on conflict(duration_days) do nothing;

drop policy if exists marketplace_categories_public_read on public.marketplace_categories;
create policy marketplace_categories_public_read on public.marketplace_categories
for select to anon,authenticated using(is_active=true or (select public.is_admin()));
drop policy if exists marketplace_packages_public_read on public.marketplace_packages;
create policy marketplace_packages_public_read on public.marketplace_packages
for select to anon,authenticated using(is_active=true or (select public.is_admin()));
drop policy if exists marketplace_packages_admin_write on public.marketplace_packages;
create policy marketplace_packages_admin_write on public.marketplace_packages
for all to authenticated using((select public.is_admin())) with check((select public.is_admin()));

drop policy if exists marketplace_ads_public_read on public.marketplace_ads;
create policy marketplace_ads_public_read on public.marketplace_ads
for select to anon,authenticated using(
  (approval_status='published' and payment_status='accepted' and start_at is not null and end_at is not null and start_at<=now() and end_at>now())
  or user_id=(select auth.uid()) or (select public.is_admin())
);
drop policy if exists marketplace_ads_self_insert on public.marketplace_ads;
create policy marketplace_ads_self_insert on public.marketplace_ads
for insert to authenticated with check(user_id=(select auth.uid()));
drop policy if exists marketplace_ads_self_update on public.marketplace_ads;
create policy marketplace_ads_self_update on public.marketplace_ads
for update to authenticated using(user_id=(select auth.uid()) and approval_status='pending')
with check(user_id=(select auth.uid()) and approval_status='pending');
drop policy if exists marketplace_ads_admin_update on public.marketplace_ads;
create policy marketplace_ads_admin_update on public.marketplace_ads
for update to authenticated using((select public.is_admin())) with check((select public.is_admin()));

insert into storage.buckets(id,name,public) values('marketplace-images','marketplace-images',true)
on conflict(id) do update set public=true;
insert into storage.buckets(id,name,public) values('marketplace-payment-proofs','marketplace-payment-proofs',false)
on conflict(id) do update set public=false;

drop policy if exists marketplace_images_public_read on storage.objects;
create policy marketplace_images_public_read on storage.objects for select to anon,authenticated using(bucket_id='marketplace-images');
drop policy if exists marketplace_images_self_insert on storage.objects;
create policy marketplace_images_self_insert on storage.objects for insert to authenticated
with check(bucket_id='marketplace-images' and (storage.foldername(name))[1]=(select auth.uid())::text);
drop policy if exists marketplace_proofs_self_insert on storage.objects;
create policy marketplace_proofs_self_insert on storage.objects for insert to authenticated
with check(bucket_id='marketplace-payment-proofs' and (storage.foldername(name))[1]=(select auth.uid())::text);
drop policy if exists marketplace_proofs_admin_or_owner_read on storage.objects;
create policy marketplace_proofs_admin_or_owner_read on storage.objects for select to authenticated
using(bucket_id='marketplace-payment-proofs' and ((storage.foldername(name))[1]=(select auth.uid())::text or (select public.is_admin())));
