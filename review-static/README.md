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
- **No source-map secret exposure** — no build step, no `.map` files, no secrets.
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
- **Build command:** _(none)_ — this is pre-built static HTML. Do **not** run `vite build`
  (that would produce the production app bundle, which must NOT be published as Review).
- **Output directory:** `review-static`
- The deployed and displayed SHA can be aligned by injecting the commit at deploy time:
  `sed -i "s/__CF_PAGES_COMMIT_SHA__/$CF_PAGES_COMMIT_SHA/g" review-static/index.html`
  (the `#sha` element carries `data-cf-sha="__CF_PAGES_COMMIT_SHA__"`). The visible value is the
  source commit the demo represents.

## Verify locally
```sh
bash review-static/scan.sh          # all scans must PASS
python3 -m http.server -d review-static 8080   # or any static server; no backend needed
```
