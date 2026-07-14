-- Persisted Travel booking drafts are authenticated, owner-bound state.
--
-- This migration deliberately leaves historical anonymous rows readable only by
-- service-role operations. New rows must have an authority user id and are
-- deduplicated by the (user_id, idempotency_key) pair. It is safe to stage in a
-- non-production QA project; do not apply it to a production project as part
-- of this branch.

alter table public.zivo_travel_booking_intents enable row level security;

revoke all on table public.zivo_travel_booking_intents from anon, authenticated;
grant select, insert, update on table public.zivo_travel_booking_intents to service_role;

drop policy if exists zivo_travel_booking_intents_public_insert
  on public.zivo_travel_booking_intents;

-- `user_id` is verified against the centralized Zivos Media authority by the
-- Cloudflare Worker. That UUID belongs to a different Supabase project, so a
-- foreign key to this Travel project's auth.users would reject every real
-- authority user before the owner-bound idempotency constraint can apply.
alter table public.zivo_travel_booking_intents
  drop constraint if exists zivo_travel_booking_intents_user_id_fkey;

comment on column public.zivo_travel_booking_intents.user_id is
  'Verified Zivos Media authority user UUID. It is intentionally not a foreign key to the separate Travel Auth project.';

-- The original global unique key made an opaque client key global rather than
-- owner-scoped. Replace it with the exact conflict target used by the Worker.
alter table public.zivo_travel_booking_intents
  drop constraint if exists zivo_travel_booking_intents_idempotency_key_key;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.zivo_travel_booking_intents'::regclass
      and conname = 'zivo_travel_booking_intents_user_idempotency_key_unique'
  ) then
    alter table public.zivo_travel_booking_intents
      add constraint zivo_travel_booking_intents_user_idempotency_key_unique
      unique (user_id, idempotency_key);
  end if;

  -- NOT VALID preserves historical bridge rows while enforcing an owner for
  -- every newly written booking intent.
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.zivo_travel_booking_intents'::regclass
      and conname = 'zivo_travel_booking_intents_authenticated_owner_check'
  ) then
    alter table public.zivo_travel_booking_intents
      add constraint zivo_travel_booking_intents_authenticated_owner_check
      check (user_id is not null) not valid;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.zivo_travel_booking_intents'::regclass
      and conname = 'zivo_travel_booking_intents_idempotency_key_check'
  ) then
    alter table public.zivo_travel_booking_intents
      add constraint zivo_travel_booking_intents_idempotency_key_check
      check (idempotency_key is not null and idempotency_key ~ '^[A-Za-z0-9_-]{16,160}$') not valid;
  end if;
end;
$$;
