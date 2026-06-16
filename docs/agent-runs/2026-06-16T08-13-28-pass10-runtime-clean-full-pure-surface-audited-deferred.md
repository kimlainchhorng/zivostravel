# zivostravel pass 10 — deferred: runtime files CLEAN this pass; full pure-logic surface of `main.tsx` (gate-covered) + `worker.ts` audited end-to-end, uniformly hardened, no fresh-class reachable bug

**Date:** 2026-06-16
**Scope:** zivostravel only
**Status:** Deferred (no change applied). Baseline re-verified **green**:
`npm run build` = **BUILD EXIT 0** (`tsc --noEmit && vite build`; emits
`dist/assets/index-6QOIqnaa.js` 246.86 kB).
**Advisor:** none reachable (DeepSeek key dead/401; MiMo runner unreliable on the
bloated AGENT_TASKS.md). Resolved by hand-verification — a full end-to-end read of
the clean pure-logic surface this pass, each claim independently re-derived against the
file.

## What changed vs the pass 5–9 deferrals (this is a *more-complete* deferral, not a repeat)
Passes 5–9 all deferred **structurally**: zivostravel's entire runtime is two files
(`src/main.tsx`, `cloudflare/worker.ts`) and in every one of those passes **both were
peer-modified** (` M`), i.e. off-limits — so there was simply no clean runtime file to
work in. The pass-9 doc named the unblock condition explicitly: *"`src/main.tsx` lands
clean (no peer ` M`), allowing a self-contained pure-helper fix inside it."*

**This pass that condition is met.** `git status --short` shows **only `AGENT_TASKS.md`**
modified — `src/main.tsx` **and** `cloudflare/worker.ts` are both **clean**. So instead
of a structural defer, I read the **entire pure-logic surface of both files
end-to-end** and evaluated every helper for a fresh-class reachable bug. Conclusion: it
is uniformly hardened (many helpers carry explicit prior-pass CWE-style WHY comments).
The defer is now **substantive**, not structural.

## Gate scope (why `main.tsx` is the only qualifying target)
`tsconfig.json` `include: ["src", "vite.config.ts"]` → the repo gate
(`tsc --noEmit && vite build`) typechecks **`src/main.tsx`** but **not**
`cloudflare/worker.ts` (no worker build script in `package.json`). So a fix in
`worker.ts` would not be gate-verifiable by the canonical gate. The gate-covered,
clean, non-shell-churn surface is therefore `main.tsx`'s pure helpers — which I audited
in full.

## `src/main.tsx` pure-helper surface — read end-to-end, all correct/hardened
| Helper(s) | Verdict |
|---|---|
| `engineUrl` / `localUrl` | `new URL(path, engineOrigin)` → always absolute for engine links; `localUrl` deliberately relative. Correct. |
| `isEngineCheckoutUrl` | https-only + apex match (`host === apex || host.endsWith("."+apex)`) before `location.href` — the **prior-pass** checkout-redirect host-validation class. Correct. |
| `readCurrency` | localStorage read wrapped in try/catch (private-mode crash guard, WHY-commented); allowlist `KHR`/`THB`→else `USD`. Correct. |
| `money` | `amount * option.rate` (USD 1 / KHR 4100 / THB 36) + per-currency decimals/symbol. Correct conversion. |
| `formatAmountText` / `dealSaveLabel` | regex-extract USD numeric then `money()`; `Number.isFinite && >0` guards. Correct. |
| `buildSearchPath` / `readNumberParam` / `readSearchContext` | `Math.max(1,Math.min(9,Math.round()))` traveler clamp (prior booking-travelers class) + `Number.isFinite` guard; URLSearchParams encodes. Correct. |
| `travelDaySpan` | `T00:00:00` local parse, `Math.round(diff/86400000)`, `Number.isFinite && >0 ? diff : fallback`. Correct. |
| `fallbackReviewSession` | money math `serviceFee = Math.max(3, Math.round(price*0.08))`, `total = price + fee`; SSO redirect built from the **absolute** `checkoutUrl` via `new URL(...).pathname+search` + `encodeURIComponent`. Correct. |
| `checkoutUrl` (absolute) / `reviewUrl` (relative) | both URLSearchParams-built. Correct. |
| `withBookingReference` | **`new URL(rawUrl, base)`** — the `base` second-arg handles relative *and* absolute inputs (no throw on the relative `reviewUrl`); returns relative iff input was relative. Deliberately careful. Correct. |
| `localBookingReference` | `crypto.randomUUID()` with `Date.now()` fallback. Correct. |
| `finiteNumber` / `validTimestamp` | untrusted-localStorage coercion guards, both WHY-commented (no "USD NaN" / "Invalid Date" downstream). Correct. |
| `normalizeSavedTrip` / `readSavedTrips` | type-gated field validation; `JSON.parse` in try/catch + `Array.isArray` + `map(normalize).filter(Boolean)`. Correct. |
| `sanitizeTravelerDetails` / `sanitizeSupportForm` / `normalizeSupportTicket` / `readSupportTickets` | trim + `.slice(maxLen)` caps, topic allowlist, same guarded-parse pattern; `writeSupportTickets` caps to 12. Correct. |
| `formatMode` / `formatTravelDate` / `normalizedTravelDates` / `formatQueueTime` / `riskClass` | display formatters with NaN-date fallbacks. Correct. |

Negative scans (all empty / safe): no `decodeURIComponent`/`atob`/`unescape`
(no malformed-percent throw class), no `parseInt` without radix, no mutating
`.sort`/`.reverse`/`.splice` on shared arrays, both `JSON.parse` sites guarded.

## `cloudflare/worker.ts` — surveyed (clean, but **not gate-covered**); also hardened
`timingSafeEqual` (length-leak-only constant-time, WHY-commented); `isAuthorizedAdminRequest`
**fails closed** (no token ⇒ no match); `readBoundedInteger` **`Number.isFinite`-guarded**
clamp; `cleanText`/`cleanNullableText` trim+slice+fallback; CORS `access-control-allow-origin`
set only on **exact** `allowedApiOrigins.has(origin)` match; money math identical to the
client (`Math.max(3, Math.round(price*0.08))`); `travelers` parse guarded by
`Number.isFinite ? clamp : 1`. No fresh-class reachable defect — and a fix here wouldn't
be verifiable by `npm run build` regardless.

## Leads considered and why each fails the bar
1. **`new URL(result.checkoutUrl)` in `fallbackReviewSession` / `withBookingReference`
   on a relative URL would throw.** *Rejected — not a bug.* `checkoutUrl()` returns an
   **absolute** engine URL, and `withBookingReference` passes a `base` second arg to
   `new URL`, so relative `reviewUrl` resolves without throwing. Deliberately handled.
2. **`fallbackAdminQueue` formats `trip.total.toFixed(2)` regardless of currency**
   (e.g. KHR shown with 2 decimals). *Rejected:* admin-queue **display** fallback only,
   no correctness/money impact, and bound up in cross-cutting currency-display semantics
   — a "fix" risks churn for zero reachable benefit.
3. **`worker.ts` any-finding.** *Rejected as not gate-verifiable* — `worker.ts` is
   outside the `tsc` include and has no build script; the marathon requires a
   gate-verifiable change.
4. **Component render-body bugs in `main.tsx`.** *Rejected:* editing the 5k-line app
   shell is the prohibited "churn already-polished app shell" class and is
   browser-unverifiable in this environment.

## Decision
Defer. With the runtime files clean this pass, I audited the entire gate-covered
pure-logic surface (`main.tsx`) end-to-end plus the clean-but-uncovered backend
(`worker.ts`); both are uniformly hardened by prior passes, several helpers with
explicit CWE-style WHY comments. Every remaining lead is a non-bug (deliberately safe),
a display-only fallback bound to cross-cutting semantics, not gate-verifiable, or
app-shell churn. Inventing a change to clear the rotation would violate the "real,
unambiguous, reachable bug / minimal + safe / no churn" discipline. Honest deferral
with a re-verified-green gate (BUILD EXIT 0) is the correct outcome.

## What would unblock a future zivostravel pass
- A genuinely new pure helper / module lands clean with novel logic (currency/fare/date
  math, redirect/host validation, serialization) carrying a fresh-class defect; **or**
- the app is split so reusable logic lives in dedicated non-shell modules (so a
  self-contained fix isn't app-shell churn); **or**
- `cloudflare/worker.ts` is brought into a typecheck/build gate (then its backend logic
  becomes a gate-verifiable fix surface).

## Notes
- No commit/push/deploy (owner deploys). No file changed this pass.
- Honest-deferral precedent: zivostravel passes 5–9 (structural); zivosmedia & ZIVO-CHAT
  pass 10, Zivo-Admin pass 9 (substantive full-surface reads).
- Pass-10 rotation: zivosmedia ⏸ → ZIVO-CHAT ⏸ → zivodriver ⏸ → **zivostravel ⏸ (this
  doc, deferred)** → next is zivosoftware pass 10 (gate `npm run build` / `vite build`).
