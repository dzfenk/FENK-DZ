alter table public.marketplace_ads
  alter column description drop not null,
  alter column contact drop not null,
  add column if not exists details jsonb not null default '{}'::jsonb,
  add column if not exists phone text,
  add column if not exists wilaya text,
  add column if not exists municipality text;
alter table public.marketplace_ads drop constraint if exists marketplace_ads_description_check, drop constraint if exists marketplace_ads_contact_check;
insert into public.marketplace_packages(duration_days,fee_dzd,is_active,sort_order) values (3,500,true,1),(7,1000,true,2),(15,1500,true,3),(30,2500,true,4) on conflict (duration_days) do update set fee_dzd=excluded.fee_dzd,is_active=true,sort_order=excluded.sort_order;
