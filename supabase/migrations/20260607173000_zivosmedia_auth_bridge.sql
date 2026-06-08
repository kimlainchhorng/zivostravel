-- ZivosMedia identity bridge foundation for Zivo Travel.
-- This migration adds server-owned link/audit tables only. It does not change
-- Supabase Auth settings, DNS, deployment, or live payment/booking authority.

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

create table if not exists public.linked_zivosmedia_users (
  id uuid primary key default gen_random_uuid(),
  local_user_id uuid references auth.users(id) on delete set null,
  zivosmedia_user_id uuid not null,
  email text,
  phone text,
  display_name text,
  avatar_url text,
  linked_at timestamptz not null default now(),
  last_login_at timestamptz,
  status text not null default 'active' check (status = any (array[
    'active'::text,
    'pending'::text,
    'disabled'::text,
    'unlinked'::text
  ])),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (zivosmedia_user_id),
  unique (local_user_id)
);

comment on table public.linked_zivosmedia_users is
  'Server-owned account links between local Zivo Travel users and canonical ZivosMedia identities.';

create index if not exists linked_zivosmedia_users_email_idx
  on public.linked_zivosmedia_users (lower(email))
  where email is not null;
create index if not exists linked_zivosmedia_users_status_idx
  on public.linked_zivosmedia_users (status, updated_at desc);

alter table public.linked_zivosmedia_users enable row level security;

revoke all on table public.linked_zivosmedia_users from anon;
revoke all on table public.linked_zivosmedia_users from authenticated;
revoke all on table public.linked_zivosmedia_users from service_role;
grant select, insert, update on table public.linked_zivosmedia_users to service_role;

drop policy if exists linked_zivosmedia_users_owner_read
  on public.linked_zivosmedia_users;

create policy linked_zivosmedia_users_owner_read
  on public.linked_zivosmedia_users
  for select
  to authenticated
  using (local_user_id = (select auth.uid()));

drop trigger if exists set_linked_zivosmedia_users_updated_at
  on public.linked_zivosmedia_users;

create trigger set_linked_zivosmedia_users_updated_at
  before update on public.linked_zivosmedia_users
  for each row execute function public.set_zivo_travel_updated_at();

create table if not exists public.auth_audit_logs (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  local_user_id uuid,
  zivosmedia_user_id uuid,
  ip_address text,
  user_agent text,
  success boolean not null default false,
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

comment on table public.auth_audit_logs is
  'Server-owned authentication, account-linking, webhook, and admin lookup audit log for Zivo Travel.';

create index if not exists auth_audit_logs_event_created_idx
  on public.auth_audit_logs (event_type, created_at desc);
create index if not exists auth_audit_logs_zivosmedia_user_created_idx
  on public.auth_audit_logs (zivosmedia_user_id, created_at desc)
  where zivosmedia_user_id is not null;

alter table public.auth_audit_logs enable row level security;

revoke all on table public.auth_audit_logs from anon;
revoke all on table public.auth_audit_logs from authenticated;
revoke all on table public.auth_audit_logs from service_role;
grant insert, select on table public.auth_audit_logs to service_role;

create table if not exists public.platform_webhook_events (
  id uuid primary key default gen_random_uuid(),
  source_app text not null,
  target_app text not null default 'zivo-travel',
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'received' check (status = any (array[
    'received'::text,
    'processed'::text,
    'failed'::text,
    'ignored'::text
  ])),
  retry_count integer not null default 0 check (retry_count >= 0),
  created_at timestamptz not null default now(),
  processed_at timestamptz
);

comment on table public.platform_webhook_events is
  'Server-owned event log for ZivosMedia to Zivo Travel identity webhooks.';

create index if not exists platform_webhook_events_source_created_idx
  on public.platform_webhook_events (source_app, event_type, created_at desc);
create index if not exists platform_webhook_events_status_created_idx
  on public.platform_webhook_events (status, created_at desc);

alter table public.platform_webhook_events enable row level security;

revoke all on table public.platform_webhook_events from anon;
revoke all on table public.platform_webhook_events from authenticated;
revoke all on table public.platform_webhook_events from service_role;
grant insert, select, update on table public.platform_webhook_events to service_role;
