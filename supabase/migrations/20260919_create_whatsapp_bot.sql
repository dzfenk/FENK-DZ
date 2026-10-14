create table if not exists public.whatsapp_messages (
  id uuid primary key default gen_random_uuid(),
  wa_message_id text,
  phone text not null,
  direction text not null check (direction in ('inbound','outbound')),
  message_type text not null default 'text',
  body text,
  raw_payload jsonb,
  created_at timestamptz not null default now()
);

create unique index if not exists whatsapp_messages_wa_message_id_idx
  on public.whatsapp_messages(wa_message_id)
  where wa_message_id is not null;

create index if not exists whatsapp_messages_phone_created_idx
  on public.whatsapp_messages(phone, created_at desc);

alter table public.whatsapp_messages enable row level security;

-- Customers do not need direct access. The Edge Function uses the Supabase secret key.
-- Admin reporting can be added later with an explicit admin-only policy.
