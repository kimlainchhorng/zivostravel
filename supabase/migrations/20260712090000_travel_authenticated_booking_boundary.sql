-- Travel booking boundary hardening.
--
-- The Cloudflare Worker verifies a ZivosMedia authority JWT before it uses its
-- service role. Browser clients never insert a booking directly. This migration
-- removes the old anonymous draft-insert escape hatch and supplies the database
-- race backstop for per-user idempotency.

alter table public.zivo_travel_booking_intents enable row level security;

revoke all on table public.zivo_travel_booking_intents from anon, authenticated;
grant select, insert, update on table public.zivo_travel_booking_intents to service_role;

drop policy if exists zivo_travel_booking_intents_public_insert
  on public.zivo_travel_booking_intents;

-- Historical bridge rows may have a NULL user_id. New worker-created rows are
-- always non-null and use this pair as their idempotency boundary.
create unique index if not exists zivo_travel_booking_intents_user_idempotency_unique
  on public.zivo_travel_booking_intents (user_id, idempotency_key)
  where user_id is not null and idempotency_key is not null;
