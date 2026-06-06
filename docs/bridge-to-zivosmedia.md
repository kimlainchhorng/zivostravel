# Zivo Travel bridge to Zivos Media

Date: 2026-06-06

## Decision

`zivostravel.com` is the dedicated customer travel product, but `zivosmedia.com` remains the all-in-one platform. The two should work together instead of competing:

- Zivo Travel owns the standalone travel customer experience.
- Zivos Media remains the identity, payment, checkout, wallet, payout, and live booking authority until a safe backend cutover is complete.
- Zivos Media can still show Travel inside the bigger platform through shared route links or API-backed panels.

## Current backend split

| Area | Current authority | Target |
| --- | --- | --- |
| Auth and SSO | Zivos Media Supabase `slirphzzwcogdbkeicff` | Stay central unless multi-project auth cutover is reviewed |
| Live checkout/payments | Zivos Media | Stay central during migration |
| Wallet and payouts | Zivos Media | Stay central during migration |
| Flight/hotel/car/bus live bookings | Zivos Media engine routes | Move in small verified batches |
| Travel telemetry/config | Zivo Travel Supabase `xbllvmpomorawkcrtbcq` | Grow into dedicated backend |

## Customer routes

The bridge contract keeps the visible product stable while backend work moves safely:

- Flights: `/flights?from&to&start&end&travelers`
- Hotels: `/hotels?city&ci&co&adults`
- Rental cars: `/cars?city&pickup_date&return_date`
- Bus booking: `/bus?from&to&date`
- Checkout: `/travel/checkout`
- Wallet: `/wallet`
- Support: `/chat`

## Cloudflare routing shape

Recommended edge behavior:

- `https://zivostravel.com` opens the dedicated Travel surface.
- `https://zivosmedia.com/zivo-travel` remains available as the all-in-one platform preview.
- Shared booking engine routes can be deep-linked or proxied only after auth/session behavior is verified.
- Redirect old or retired travel marketing paths to the dedicated Travel surface with 301 redirects after launch.

## Supabase migration sequence

1. Inventory live travel tables, routines, storage buckets, Edge Functions, and secrets in `slirphzzwcogdbkeicff`.
2. Create matching staged schema in `xbllvmpomorawkcrtbcq` with RLS enabled before exposing tables.
3. Migrate one workflow at a time: bus, car, hotel, flight, wallet/payout.
4. Run sandbox smoke tests for search, booking draft, checkout, refund/cancel, wallet receipt, and payout.
5. Flip `VITE_ZIVO_TRAVEL_USE_DEDICATED_BACKEND=true` only after all required checks pass.

## Do not do yet

- Do not copy live payment records casually.
- Do not run live payment E2E tests unless explicitly approved.
- Do not enable the dedicated backend flag while the travel project is still telemetry/config only.
- Do not split auth unless both projects have matching JWT/session/RLS behavior verified.
