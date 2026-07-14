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

`/api/travel/bookings` creates payment-adjacent state only after the central Zivos Media authority has verified the
customer's Bearer session. The Worker binds every stored draft to that verified user and requires a client-generated,
stable `Idempotency-Key`; a retry returns the same canonical draft instead of adding another booking reference.

Configure the browser with only the central authority's public credentials:

```bash
VITE_ZIVO_AUTHORITY_SUPABASE_URL=https://<authority-project>.supabase.co
VITE_ZIVO_AUTHORITY_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Configure the Worker with the Travel server credential and the authority public key:

```bash
npx wrangler secret put ZIVO_TRAVEL_SUPABASE_SERVICE_ROLE_KEY
npx wrangler secret put ZIVO_AUTHORITY_SUPABASE_PUBLISHABLE_KEY
```

`ZIVO_TRAVEL_SUPABASE_SERVICE_ROLE_KEY` is server-only and must never appear in Vite env vars or source. The authority
publishable key is intentionally public, but must be rejected if it is accidentally replaced by a service/secret key.
Without the verified authority session or either required Worker value, the endpoint returns `401` or `503`; it never
returns a synthetic saved draft or opens checkout.

The `/trips` page may retain a local review preview, but checkout requires a confirmed persisted draft. `GET
/api/travel/bookings?reference=ztb_...` requires the same central authority session and scopes the lookup to its verified
owner, so a guessed reference cannot reveal another customer's booking.

## Search Telemetry

`/api/travel/results` writes each live flight, hotel, rental car, and bus search to
`public.zivo_travel_search_events` in the dedicated Travel project. The table uses RLS so anonymous customers can insert
search telemetry, while customer reads stay owner-scoped.

## Support Ticket Persistence

`/api/travel/support` creates a `zts_...` support reference and writes customer support drafts to
`public.zivo_travel_support_tickets` before the Zivos Media chat handoff. Public customers can insert constrained ticket
drafts through the Cloudflare bridge; reads stay owner-scoped for authenticated customers and service-role only for future
admin queues.
