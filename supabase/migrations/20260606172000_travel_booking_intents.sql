-- Dedicated Travel booking intent drafts.
-- Cloudflare creates these before handing customers to Zivos Media checkout.

create table if not exists public.zivo_travel_booking_intents (
  id uuid primary key default gen_random_uuid(),
  booking_reference text not null unique default ('ztb_' || lower(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12))),
  user_id uuid references auth.users(id) on delete set null,
  service_type text not null check (service_type = any (array['flight'::text, 'hotel'::text, 'rental_car'::text, 'bus'::text])),
  result_id text not null,
  result_title text not null,
  provider text not null,
  origin text,
  destination text,
  date_start date,
  date_end date,
  travelers integer not null default 1 check (travelers > 0 and travelers <= 99),
  currency text not null default 'USD',
  subtotal numeric(10,2) not null check (subtotal >= 0),
  service_fee numeric(10,2) not null default 0 check (service_fee >= 0),
  total numeric(10,2) not null check (total >= 0),
  status text not null default 'draft' check (status = any (array['draft'::text, 'pending_checkout'::text, 'checkout_handoff'::text, 'paid'::text, 'cancelled'::text, 'expired'::text])),
  review_url text not null,
  checkout_url text not null,
  sso_url text,
  source_host text,
  idempotency_key text unique,
  request_payload jsonb not null default '{}'::jsonb,
  checkout_payload jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.zivo_travel_booking_intents is
  'Draft booking intents created by the Zivo Travel Cloudflare bridge before handoff to Zivos Media checkout.';
comment on column public.zivo_travel_booking_intents.booking_reference is
  'Public safe Zivo Travel booking reference shown before checkout handoff.';

create index if not exists zivo_travel_booking_intents_user_created_idx
  on public.zivo_travel_booking_intents (user_id, created_at desc);
create index if not exists zivo_travel_booking_intents_status_created_idx
  on public.zivo_travel_booking_intents (status, created_at desc);
create index if not exists zivo_travel_booking_intents_service_created_idx
  on public.zivo_travel_booking_intents (service_type, created_at desc);

alter table public.zivo_travel_booking_intents enable row level security;

revoke all on table public.zivo_travel_booking_intents from anon;
revoke all on table public.zivo_travel_booking_intents from authenticated;
revoke all on table public.zivo_travel_booking_intents from service_role;
grant select on table public.zivo_travel_booking_intents to authenticated;
grant select, insert, update on table public.zivo_travel_booking_intents to service_role;

drop policy if exists zivo_travel_booking_intents_owner_read on public.zivo_travel_booking_intents;
create policy zivo_travel_booking_intents_owner_read
  on public.zivo_travel_booking_intents
  for select
  to authenticated
  using (user_id = (select auth.uid()));

drop trigger if exists set_zivo_travel_booking_intents_updated_at on public.zivo_travel_booking_intents;
create trigger set_zivo_travel_booking_intents_updated_at
  before update on public.zivo_travel_booking_intents
  for each row execute function public.set_zivo_travel_updated_at();
