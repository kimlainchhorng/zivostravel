# Zivo Travel Dedicated Backend Cutover

Date: 2026-06-06

Target domain: `zivostravel.com`

Target Supabase project: `xbllvmpomorawkcrtbcq`

## Current Live State

The Travel project is active, but it is not yet the live booking authority.

Live Travel Supabase state:

- Migration: `zivo_travel_backend_foundation`
- Tables: `zivo_travel_backend_links`, `zivo_travel_service_catalog`, `zivo_travel_search_events`, `zivo_travel_support_tickets`, `zivo_travel_partner_workflows`, `zivo_travel_sync_runs`
- ZivosMedia aggregation RPC: `public.zivo_travel_share_summary(p_user_id uuid, p_limit integer)`
- Edge Functions: none
- Storage buckets: none

Current mode:

- `zivostravel.com` can host the standalone customer travel shell.
- `zivosmedia.com` remains the live authority for auth, checkout, wallet, payment, and booking records.
- Travel Supabase currently owns telemetry, support ticket drafts, config, and staged migration data.

## Product Ownership

Move these customer workflows into Travel:

- Flights
- Hotels and resorts customer search/booking
- Rental car customer search/booking
- Bus booking
- Travel customer support/self-service
- Travel booking summaries that can be shared back to ZivosMedia

Keep these outside Travel for now:

- Platform staff admin: move to `Zivo-Admin`.
- Payment/refund/payout staff operations: keep central until `Zivo-Admin` payment audit is ready.
- Hotel, rental fleet, and business owner operating consoles: likely `zivosoftware.com` owner consoles unless they are pure customer booking screens.
- ZivosMedia feed/share surfaces: keep only public or share-safe summaries.

## Migration Order

1. Bus booking
   - Lowest-risk first candidate.
   - Needed objects include `bus_bookings`, `bus_promos`, `bus_reviews`, payment-intent/capture functions, operator console split.
   - Keep payment capture on ZivosMedia until a Travel payment webhook is staged.

2. Rental car customer booking
   - Move public search, vehicles, locations, add-ons, promotions, reviews, and reservation records.
   - Keep fleet owner management in Software/owner console unless it is needed for public booking.
   - Key objects include `car_rental_reservations`, `car_rental_vehicles`, `car_rental_locations`, `car_rental_addons`, `car_rental_promotions`, `car_rental_customers`.

3. Hotels and resorts customer booking
   - Move public hotel search, room availability, reservation, change request, receipt, and customer trip pages.
   - Keep property operations in owner console.
   - Key objects include `lodge_reservations`, `lodge_rooms`, `lodge_room_blocks`, `lodge_reservation_change_requests`, `lodge_reservation_audit`, `lodge_reservation_charges`, `lodge_reservation_receipts`, `lodging_reviews`.

4. Flights
   - Highest-risk core workflow.
   - Move only after provider secrets, usage limits, search logs, booking drafts, passengers, payment intents, confirmation, cancellations, and webhooks are staged.
   - Key objects include `flight_bookings`, `flight_passengers`, `flight_price_alerts`, `flight_search_logs`, `flight_api_limits`, `flight_api_usage`, `flights_launch_settings`.

5. Checkout, wallet, refunds, payouts
   - Move last.
   - Requires Stripe secrets, webhook idempotency, refund/cancel flows, audit logs, support tooling, rollback, and reconciliation.

## Edge Function Plan

Create Travel-owned functions only when matching tables and RLS exist in `xbllvmpomorawkcrtbcq`.

Early candidates:

- `travel-search-event-create`
- `bus-search`
- `bus-booking-draft`
- `bus-payment-intent`
- `bus-booking-confirm`
- `travel-support-submit`

Hold until later:

- Flight provider functions
- Stripe webhook/payment capture functions
- Refund functions
- Hotel provider/webhook functions
- Staff monitoring/admin functions

## Required Secrets

Do not add secrets until functions are ready to deploy.

Likely future Travel secrets:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- Flight provider secrets, such as Duffel or selected provider keys
- Hotel provider secrets, such as Hotelbeds or selected provider keys
- Bus operator/provider credentials if external
- Email/SMS support notification secrets

## RLS Rule

Every Travel table exposed to the browser must have RLS enabled before frontend code reads it.

Recommended policy shape:

- Public read only for public catalog/search metadata.
- User-owned read/write for booking drafts and customer trip records.
- Partner-owned read/write for operator or hotel/rental owner records.
- Service-role only for payment status, provider payloads, webhook logs, risk/audit rows, and staff actions.

## ZivosMedia Sharing

ZivosMedia may receive share-safe travel summaries through `zivo_travel_share_summary`:

- Booking status
- Public hotel/rental/operator name
- Destination/city
- Non-sensitive itinerary dates
- Public image/share card

Never share these through browser-readable ZivosMedia records:

- Full payment records
- Provider payloads
- Passenger identity documents
- Private booking PII
- Refund evidence
- Staff support notes
- Service-role secrets

## Verification Before Backend Flag

Keep this disabled until all checks pass:

```env
VITE_ZIVO_TRAVEL_USE_DEDICATED_BACKEND=false
```

Before enabling the dedicated backend:

1. Run schema/RLS review for the workflow being moved.
2. Deploy only the workflow's required Edge Functions.
3. Smoke test search, draft, checkout handoff, confirmation, cancel/refund, support, and share summary.
4. Verify no duplicate live booking/payment rows are created across projects.
5. Verify rollback can route the customer back to ZivosMedia authority.

## Inventory

Regenerate the source inventory with:

```sh
node scripts/travel-backend-inventory.mjs
```

Current inventory snapshot:

- Flight candidate files: 102
- Hotel candidate files: 162
- Rental car candidate files: 85
- Bus candidate files: 58
- Checkout/payment candidate files: 244
- Support/admin candidate files: 12

Full report: `docs/travel-backend-inventory.md`
