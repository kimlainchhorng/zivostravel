-- Allow the Cloudflare bridge to persist public booking draft inserts with a
-- Supabase publishable key when a service/secret key is not configured.
-- Reads and updates stay restricted to authenticated owners and service_role.

grant insert on table public.zivo_travel_booking_intents to anon;

drop policy if exists zivo_travel_booking_intents_public_insert
  on public.zivo_travel_booking_intents;

create policy zivo_travel_booking_intents_public_insert
  on public.zivo_travel_booking_intents
  for insert
  to anon
  with check (
    user_id is null
    and status = 'pending_checkout'
    and booking_reference ~ '^ztb_[a-f0-9]{12}$'
    and idempotency_key = booking_reference
    and source_host = any (array[
      'zivostravel.com',
      'www.zivostravel.com',
      'zivo-travel.myzivo.workers.dev'
    ])
    and service_type = any (array[
      'flight',
      'hotel',
      'rental_car',
      'bus'
    ])
    and metadata->>'app' = 'zivo-travel'
    and metadata->>'bridge' = 'cloudflare'
    and metadata->>'authority' = 'zivosmedia'
    and jsonb_typeof(request_payload) = 'object'
    and jsonb_typeof(checkout_payload) = 'object'
    and jsonb_typeof(metadata) = 'object'
  );
