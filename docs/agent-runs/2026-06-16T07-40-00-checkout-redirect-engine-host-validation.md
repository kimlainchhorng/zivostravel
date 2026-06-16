# zivostravel pass 3 — server-returned checkout-redirect host-validation

**Date:** 2026-06-16
**Scope:** zivostravel only
**Class:** Server (travel-API)-returned checkout URL handed to a navigation sink
(`window.location.href`) with no host validation — the same untrusted-redirect class
closed in the sibling repos (zivosmedia/zivodriver/zivosoftware) pass 2.
**Status:** Done. Gate green: `npx tsc --noEmit` (exit 0). One file changed.
**Advisors:** DeepSeek (MCP) confirmed the finding is real defense-in-depth (not theater
for a same-origin `/api`), found no host-validation bypass (userinfo `@`, trailing dot,
protocol-relative `//`, `zivosmedia.com.evil.com`, `evilzivosmedia.com` all correctly
rejected), and confirmed the fallback makes any over-strictness harmless (no live-checkout
breakage). Manual file verification was the primary basis.

## Baseline
`npx tsc --noEmit` = exit 0 before any change. The whole app is one file
(`src/main.tsx`, ~4970 lines; only other src file is `vite-env.d.ts`). It is already
heavily hardened (guarded localStorage reads, `finiteNumber`/`validTimestamp`/
`normalizeSavedTrip`/`sanitizeTravelerDetails`/`sanitizeSupportForm`, date-range guard on
the return picker, today-floored `min` on date inputs, IME-safe Enter-to-search). Audited
every navigation sink and URL builder rather than introducing new policy.

## Finding — the one programmatic redirect skips host validation
`grep window.location.href` → exactly one programmatic sink, in `BookingReview.handleCheckout`:
```ts
const intent = bookingIntent || await createBookingDraft();
window.location.href = intent.booking.checkoutUrl;   // before
```
`intent.booking.checkoutUrl` provenance:
- **Local/fallback mode** — built by `checkoutUrl()` → `engineUrl()` → always the platform
  origin (`engineOrigin`, default `https://zivosmedia.com`). Safe by construction.
- **API mode** (`canUseTravelApi()` is true for *any* non-localhost host, i.e. production) —
  `createBookingDraft()` does `fetch("/api/travel/bookings", {POST})` and returns the
  **server-supplied** `intent.booking.checkoutUrl` verbatim. No host check.

So a stale / tampered / backdoored travel-API response (supply-chain, compromised worker)
could redirect the paying customer to a look-alike checkout. This is the highest-value
phishing target in the flow and the exact class already closed in the sibling repos — it
was simply unguarded in this separate repo.

## Fix (minimal, additive, non-breaking)
`src/main.tsx`:
1. Add `isEngineCheckoutUrl(url)` next to `engineUrl` — `https`-only, host must equal the
   platform apex or be a subdomain of it (`host === apex || host.endsWith('.'+apex)`, apex =
   last two labels of `engineOrigin`'s host). Broad `*.zivosmedia.com` (vs. pinning one host)
   mirrors the pass-2 `*.stripe.com` decision: never false-positive on a legitimate sibling
   subdomain, still reject every off-platform host.
2. In `handleCheckout`, validate before navigating and fall back to a **locally-rebuilt
   canonical engine checkout** on reject, so the customer still reaches checkout:
```ts
const target = isEngineCheckoutUrl(intent.booking.checkoutUrl)
  ? intent.booking.checkoutUrl
  : checkoutUrl(kind, activeSession.result.id, activeSession.deal?.id);
window.location.href = target;
```
The guard only ever *upgrades* safety for the server URL; the fallback is an engine-origin
URL the app already trusts everywhere, so the fix cannot break an existing legitimate flow.

## Deliberately NOT changed (avoid churn / live false-positives)
- Visible `<a href>` links to `ssoUrl`/`paymentUrl`/`walletUrl`/`payoutUrl` and the
  `checkout-link` href (its click is `preventDefault`-ed and routed through the guarded
  `handleCheckout`; the bare href only matters for middle-click/no-JS). These are
  user-initiated, visible navigations — lower risk; pass 2 likewise scoped to the
  programmatic sink. Left as-is.
- The rest of the file: already-polished shell. No cosmetic edits.

## Files changed
- `src/main.tsx` — add `isEngineCheckoutUrl`; validate the checkout redirect in
  `handleCheckout` with a safe local fallback (+22/-1).

## Verification
- `npx tsc --noEmit` = exit 0.
- `git status` shows only `src/main.tsx` modified (plus this new doc). No peer-agent
  leftover files in this repo this pass.

## Notes
- No commit/push/deploy (owner deploys). Local change only.
