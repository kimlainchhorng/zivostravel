# zivostravel pass 4 — persisted booking row stores an unclamped `travelers` count

**Date:** 2026-06-16
**Scope:** zivostravel only
**Class:** Input-validation / data-integrity gap — a query-param integer is persisted to a
booking row without the min/max clamp that every sibling builder applies, so
`?travelers=0`, `-5`, or `99999` flow straight into the stored record. Distinct from
pass-3 work and from this pass's flagged (NOT auto-fixed) admin-queue access-control finding.
**Status:** Done. Gate green: `npx tsc --noEmit` (exit 0). One file changed (`cloudflare/worker.ts`).
**Advisors:** DeepSeek (MCP) reviewed the Worker and ranked this the single strongest low-risk
fix ("APPLY the clamp `Math.max(1, Math.min(99, travelers))` … no downside"), and confirmed the
admin-queue endpoint is genuine Broken Access Control that should be FLAGGED to the owner rather
than auto-patched (auth model is a semantic decision and likely touches the peer-modified
`src/main.tsx`). Manual file verification against the two sibling builders was the primary basis.

## Baseline
`npx tsc --noEmit` = exit 0 before any change. zivostravel's app is a single peer-modified file
(`src/main.tsx`, actively under concurrent edit), so the only viable non-peer target was the
Cloudflare Worker bridge (`cloudflare/worker.ts`, 1399 lines) — picked a finding there and left
`src/main.tsx` untouched.

## Scan — verified clean / deliberately NOT churned
- `readBoundedInteger` (line 294) already clamps `Math.max(1, Math.min(maxValue, parsed))` and is
  used for the search path (`buildSearchEventRow`, line 539). Correct — left alone.
- `buildDriverRequestPreview` (line 890) clamps via `Number.isFinite(travelers) ? Math.max(1,
  travelers) : 1` (line 927). Correct — left alone.
- `fetchAdminQueue` / `GET /api/travel/admin/queue` (lines 689, ~1333) — **FLAGGED, not fixed.**
  When `ZIVO_TRAVEL_SUPABASE_SERVICE_ROLE_KEY` is configured it returns service-role booking data
  (RLS bypassed) with no auth check; the Worker's CORS (`allowedApiOrigins`) only restricts
  browsers, so `curl` / server requests read it freely. Fixing it requires choosing an auth model
  and likely wiring a credential in the peer-modified `src/main.tsx`, so it was raised to the
  owner as a separate task rather than auto-patched (changing auth semantics blind is exactly the
  kind of churn to avoid). The unconfigured-key path falls back to a synthetic preview and is
  harmless — risk is strictly the configured-key case.

## Finding — `buildBookingRow` persists `travelers` without clamping
`buildBookingRow` (lines 803-888) builds the booking record that is returned (and, when Supabase is
configured, persisted). It reads:
```ts
const travelers = Number.parseInt(requestUrl.searchParams.get("travelers") || "1", 10);  // line 830
```
and writes it back essentially raw:
```ts
travelers: Number.isFinite(travelers) ? travelers : 1,   // line 846 (before)
```
The `Number.isFinite` check only rejects `NaN` (non-numeric input). Any finite integer passes
unclamped, so `?travelers=0`, `?travelers=-5`, or `?travelers=99999` are stored verbatim — unlike
the search and driver-request builders, which both clamp to a sane range. Because the booking
`total` is `result.price + serviceFee` (NOT multiplied by `travelers`), this is a data-integrity
issue, not a pricing/financial one — the bad value lands in the stored record and downstream admin
views, not in the charge.

## Fix (minimal, additive — net 0 lines, one expression)
Apply the same 1-99 clamp the sibling builders use:
```ts
travelers: Number.isFinite(travelers) ? Math.max(1, Math.min(99, travelers)) : 1,   // line 846 (after)
```
Matches `readBoundedInteger`'s `Math.max(1, Math.min(99, parsed))` and `buildDriverRequestPreview`'s
`Math.max(1, travelers)`. Preserves the existing `NaN → 1` fallback. No behavior change for valid
inputs (1-99).

## Files changed
- `cloudflare/worker.ts` — clamp the persisted `travelers` to 1-99 in `buildBookingRow` so
  out-of-range query params can't be stored, matching the search/driver builders (line 846).

## Verification
- `npx tsc --noEmit` = exit 0.
- `git status --short` shows `cloudflare/worker.ts` as the only file I changed. `src/main.tsx`
  remains modified by concurrent peer-agent work — not touched here.

## Notes
- No commit/push/deploy (owner deploys). Local change only.
- The unauthenticated admin-queue endpoint was flagged to the owner as a separate task (see Scan
  above) — that is the higher-severity finding but needs an owner-level auth decision.
