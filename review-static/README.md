# ZIVO Travel — Cloudflare-Safe Review Build

A **dedicated Review-only static build**. It is intentionally **not** the production
application bundle. It exists so the existing Cloudflare Pages project can serve a safe,
demo-only preview that cannot touch any real system.

## Safety guarantees (all enforced, not just intended)
- **Deterministic fictional fixtures only** — inlined in `index.html`; no external data.
- **No real authentication** — nothing to log into; no auth code.
- **No production user data, no Supabase calls, no provider object creation, no DB mutation,
  no message send, no booking creation, no location update, no Admin mutation** — verified by
  `scan.sh` (mutation + network-target + secret scans, all PASS).
- **Every action control is disabled** (`<button disabled aria-disabled>` + inert click guard).
- **No network egress possible** — `_headers` sets `connect-src 'none'` and `form-action 'none'`
  via CSP, so even injected code cannot reach a host or submit a form.
- **Safe 404** — `404.html` (Cloudflare Pages serves it for unknown paths) + an in-page
  hash-router 404 for unknown demo routes.
- **No source-map secret exposure** — the dedicated static build emits no `.map` files and no secrets.
- **Shows** the full 40-char source SHA, the build timestamp, and `Environment: Review /
  Demo data only / Actions disabled` in a persistent banner.

## Payment vs. booking separation
Three distinct demo states make the invariant visible:
- `#payment-pending` — payment PENDING, booking PENDING.
- `#booking-pending` — payment **CONFIRMED**, booking **PENDING** ("Payment confirmed ≠ Booking confirmed").
- `#confirmed` — payment CONFIRMED **and** booking CONFIRMED (independent).

## Screens
`search · results · property · room · summary · traveler · payment-pending · booking-pending ·
confirmed · cancellation · refund · offline · error` (+ safe 404).

## Deploy on Cloudflare Pages (safe)
- **Branch:** `review/cloudflare-safe-travel`
- **Build command:** `npm run review:build`. This copies only the dedicated static snapshot into
  `dist-review`, injects the verified 40-character commit SHA and build timestamp, and does not
  invoke the production application build.
- **Output directory:** `dist-review`
- Pass `CF_PAGES_COMMIT_SHA` to bind the displayed SHA to the deployed commit. The build refuses
  malformed SHAs and `npm run review:scan` rejects placeholders or a mismatched rendered SHA.

## Verify locally
```sh
npm run review:verify               # build + scans; all checks must PASS
python3 -m http.server -d dist-review 8080   # or any static server; no backend needed
```
