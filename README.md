# Zivo Travel

Dedicated travel product ownership repo for `zivostravel.com`.

Zivo Travel owns the customer travel product: flights, hotels, rental cars, bus booking, travel checkout, support, and partner workflows. The live runtime is still shared with Zivos Media until each backend workflow is safely moved.

## Backend

- Travel Supabase project: `xbllvmpomorawkcrtbcq`
- Travel Supabase URL: `https://xbllvmpomorawkcrtbcq.supabase.co`
- Current identity/payment authority: Zivos Media Supabase project `slirphzzwcogdbkeicff`
- Current platform origin: `https://zivosmedia.com`

## Product Surfaces

- Flights
- Hotels and resorts
- Rental cars
- Bus booking
- Travel checkout
- Travel support
- Travel partner workflows

## Bridge Contract

This repo includes a bridge contract for how standalone Zivo Travel should connect back to the all-in-one Zivos Media platform while migration is in progress:

- [`zivo-travel-bridge.json`](./zivo-travel-bridge.json)
- [`docs/bridge-to-zivosmedia.md`](./docs/bridge-to-zivosmedia.md)
- [`docs/travel-backend-inventory.md`](./docs/travel-backend-inventory.md)
- [`docs/travel-dedicated-backend-cutover.md`](./docs/travel-dedicated-backend-cutover.md)

`zivostravel.com` can show the dedicated customer travel experience, and `zivosmedia.com` can still show the same travel product inside the bigger all-in-one platform through deep links or API-backed surfaces.

## Local App

The standalone light-theme customer shell now runs locally with Vite:

```bash
npm install
npm run dev
```

Default local URL:

```text
http://localhost:5175/
```

The booking CTAs use `VITE_ZIVO_PLATFORM_ORIGIN` when present and otherwise link to `https://zivosmedia.com`.

## Migration Guardrail

Move travel tables, Edge Functions, storage buckets, and secrets out of the main ZivosMedia project only after each workflow has a matching table/function in this project and RLS has been verified.

Regenerate the migration inventory after ZivosMedia travel code changes:

```bash
node scripts/travel-backend-inventory.mjs
```

Current ZivosMedia app already supports the dedicated backend behind:

```env
VITE_ZIVO_TRAVEL_SUPABASE_URL=https://xbllvmpomorawkcrtbcq.supabase.co
VITE_ZIVO_TRAVEL_SUPABASE_PUBLISHABLE_KEY=...
VITE_ZIVO_TRAVEL_USE_DEDICATED_BACKEND=true
```

Keep `VITE_ZIVO_TRAVEL_USE_DEDICATED_BACKEND=false` until flight, hotel, car rental, and bus booking are fully migrated.

## Safe Current Mode

- Use Zivos Media for auth, checkout, wallet, payout, and live bookings.
- Use the travel Supabase project for telemetry, configuration, previews, and staged migration work.
- Route customer searches through the existing engine paths listed in the bridge contract.
- Do not duplicate live bookings or payment data into the travel project until there is a reviewed export/import and rollback plan.

## Booking Draft Persistence

`/api/travel/bookings` creates a Zivo Travel booking reference before checkout handoff. The endpoint writes to
`public.zivo_travel_booking_intents` when either a private service-role key or the safer insert-only publishable key exists in
Cloudflare:

```bash
npx wrangler secret put ZIVO_TRAVEL_SUPABASE_PUBLISHABLE_KEY
npx wrangler secret put ZIVO_TRAVEL_SUPABASE_SERVICE_ROLE_KEY
```

Without a write key, the live site stays safe and returns `booking_bridge_preview` with a checkout URL that still includes
`booking_reference`. Both keys must stay server-side in Cloudflare only; do not add them to Vite/client env vars.

The `/trips` page stores booking drafts in the customer's browser so they can resume review or checkout immediately. When
the Cloudflare Supabase secret is configured, `GET /api/travel/bookings?reference=ztb_...` is ready to look up the matching
persisted intent by reference.

## Search Telemetry

`/api/travel/results` writes each live flight, hotel, rental car, and bus search to
`public.zivo_travel_search_events` in the dedicated Travel project. The table uses RLS so anonymous customers can insert
search telemetry, while customer reads stay owner-scoped.
