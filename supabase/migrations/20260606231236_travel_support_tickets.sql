-- Dedicated Travel support ticket drafts.
-- Cloudflare creates these before handing customers to Zivos Media chat.

create or replace function public.set_zivo_travel_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.zivo_travel_support_tickets (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique default ('zts_' || lower(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12))),
  user_id uuid references auth.users(id) on delete set null,
  status text not null default 'open' check (status = any (array[
    'open'::text,
    'waiting_customer'::text,
    'in_review'::text,
    'resolved'::text,
    'closed'::text
  ])),
  topic text not null check (topic = any (array[
    'booking'::text,
    'payment'::text,
    'wallet'::text,
    'change'::text
  ])),
  priority text not null check (priority = any (array[
    'Urgent'::text,
    'Fast'::text,
    'Normal'::text
  ])),
  customer_name text not null,
  customer_email text,
  booking_reference text,
  summary text not null,
  chat_url text not null,
  source_host text,
  request_payload jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.zivo_travel_support_tickets is
  'Customer support ticket drafts created by the Zivo Travel Cloudflare bridge before handoff to Zivos Media chat.';
comment on column public.zivo_travel_support_tickets.reference is
  'Public safe Zivo Travel support reference shown before chat handoff.';

create index if not exists zivo_travel_support_tickets_user_created_idx
  on public.zivo_travel_support_tickets (user_id, created_at desc);
create index if not exists zivo_travel_support_tickets_status_created_idx
  on public.zivo_travel_support_tickets (status, created_at desc);
create index if not exists zivo_travel_support_tickets_topic_created_idx
  on public.zivo_travel_support_tickets (topic, created_at desc);
create index if not exists zivo_travel_support_tickets_booking_reference_idx
  on public.zivo_travel_support_tickets (booking_reference)
  where booking_reference is not null;

alter table public.zivo_travel_support_tickets enable row level security;

revoke all on table public.zivo_travel_support_tickets from anon;
revoke all on table public.zivo_travel_support_tickets from authenticated;
revoke all on table public.zivo_travel_support_tickets from service_role;
grant insert on table public.zivo_travel_support_tickets to anon;
grant select, insert on table public.zivo_travel_support_tickets to authenticated;
grant select, insert, update on table public.zivo_travel_support_tickets to service_role;

drop policy if exists zivo_travel_support_tickets_owner_read
  on public.zivo_travel_support_tickets;

create policy zivo_travel_support_tickets_owner_read
  on public.zivo_travel_support_tickets
  for select
  to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists zivo_travel_support_tickets_public_insert
  on public.zivo_travel_support_tickets;

create policy zivo_travel_support_tickets_public_insert
  on public.zivo_travel_support_tickets
  for insert
  to anon, authenticated
  with check (
    (user_id is null or user_id = (select auth.uid()))
    and status = 'open'
    and reference ~ '^zts_[a-f0-9]{12}$'
    and source_host = any (array[
      'zivostravel.com',
      'www.zivostravel.com',
      'zivo-travel.myzivo.workers.dev'
    ])
    and topic = any (array[
      'booking',
      'payment',
      'wallet',
      'change'
    ])
    and priority = any (array[
      'Urgent',
      'Fast',
      'Normal'
    ])
    and jsonb_typeof(request_payload) = 'object'
    and jsonb_typeof(metadata) = 'object'
    and metadata->>'app' = 'zivo-travel'
    and metadata->>'bridge' = 'cloudflare'
    and metadata->>'authority' = 'zivosmedia'
  );

drop trigger if exists set_zivo_travel_support_tickets_updated_at
  on public.zivo_travel_support_tickets;

create trigger set_zivo_travel_support_tickets_updated_at
  before update on public.zivo_travel_support_tickets
  for each row execute function public.set_zivo_travel_updated_at();
