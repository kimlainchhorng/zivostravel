# ZIVO Travel — Real-User Wave Defect Register

- **Branch:** `claude/real-user-travel-wave`
- **Base commit:** `824072a` (origin/main)
- **Method:** offline, static, **adversarially-verified** defect audit. No runtime/live testing.
- **Not runnable here (BLOCKED, not fabricated):** live search/booking against providers, Stripe/Wallet payment, cross-app Wallet handoff, cloud Preview deploy. No native project (pure web SPA; deploy target is Cloudflare Workers).
- **Quality baseline @ 824072a:** `tsc --noEmit && vite build` ✓ (1.3s). No eslint config; no unit tests defined; Playwright dep present but 0 specs.

---

## ✅ Fix APPLIED on this branch (low-risk, build-verified — `tsc`+`vite` green)

### T-1. "My Trips" labeled an unpaid, unconfirmed **draft** as "Confirmed" — `src/main.tsx:3088`
The home "My Trips" carousel badge was derived from **persistence**, not booking status: `status: trip.persisted ? "Confirmed" : "Resume"`. `persisted` only means the draft row was written to Supabase — the RLS insert policy **forces** `status='pending_checkout'` (`migrations/20260606214403:16`) and no payment/provider confirmation has happened. So a user who saved a draft (never paid) saw the trip badged **"Confirmed"** — collapsing payment success ⇒ booking confirmation, the exact separation the task requires.
**Fix:** derive the badge from the real status — `/confirm/i.test(trip.status) ? "Confirmed" : trip.persisted ? "Draft" : "Resume"`. A draft now reads **"Draft"**; "Confirmed" appears only when the backend actually reports a confirmed status. `tsc`+`vite build` ✓.

---

## 🚩 Registered — persistence / integrity (CONFIRMED; patch proposed, **NOT applied**)

Needs live Supabase to verify PostgREST conflict handling and RLS — not blind-patched offline.

### T-2 [MEDIUM] `POST /api/travel/bookings` is **not idempotent** — `cloudflare/worker.ts:862, 892`
`idempotency_key` is set to a **fresh random** `bookingReference` per call (`createBookingReference()` at `:389`), and the insert (`:1064`) uses no `on_conflict`/`resolution=merge-duplicates`/pre-check. The `unique(idempotency_key)` and `unique(booking_reference)` constraints therefore can never fire for a logical retry. A client retry / double-submit ("Refresh draft" at `src/main.tsx:4828`) creates **duplicate `pending_checkout` draft rows** (admin-queue pollution, divergent checkout handoffs).
**Note:** these are pre-checkout **drafts** — no money moves and there is **no provider-callback endpoint in this worker** (confirmation happens off-platform on Zivos Media), so this is data-hygiene, not financial-integrity. **✔ Server-side amount recalc is correct** (`:884-886` derive `subtotal/total` from the server catalog `result.price`; a client cannot influence the persisted total).
**Fix:** derive `idempotency_key` deterministically from stable attributes (session + service_type + result_id + deal_id + dates + travelers) or accept a caller `Idempotency-Key`; insert with `Prefer: resolution=merge-duplicates` + `?on_conflict=idempotency_key` (or GET-by-key pre-check).

---

## 📋 Registered — other verified med/low (appendix, for independent QA)

**Payment ↔ booking / state hierarchy:**
- `src/main.tsx:1981` — workflow step "Confirm" (a not-yet-done handoff) relabeled past-tense "Trip confirmed" (marketing step label; low risk of user confusion but reads as a completed state).
- `src/main.tsx:4054` — admin queue "pending" count treats `paid` as equivalent to `confirmed`/`complete`.
- `migrations/20260606172000_travel_booking_intents.sql:21` — booking-intent model has **no provider-confirmed state**; `paid` is the terminal success status (so payment and booking confirmation are not modeled as distinct persisted states — the client should not present `paid` as `confirmed`).

**API validation / auth (worker):**
- `cloudflare/worker.ts:880` — persists **unvalidated, unbounded** `origin`/`destination` and unvalidated date fields from query params.
- `cloudflare/worker.ts:895` — the **entire raw query string** is dumped into JSONB columns, unauthenticated and unbounded.
- `cloudflare/worker.ts:1327` — `GET /api/travel/results` triggers an **unauthenticated Supabase INSERT** (write-on-read; no method restriction).
- `cloudflare/worker.ts:963` — `driver-request` `traveler_count` has no upper bound.
- `cloudflare/worker.ts:1164` — email accepted with length-only (no format) validation.
- `cloudflare/worker.ts:1121` — booking-lookup reference used in a PostgREST filter without length/format bounds.

**Loading / empty / error states:**
- `src/main.tsx:4296` — ResultsPage/BookingReview have **no loading state**; the mock fallback is shown immediately and indistinguishably while the live fetch is in flight.
- `src/main.tsx:4586` — booking-draft error path is ambiguous: a failed save still shows a prominent reference that looks like a real draft (preview vs saved blur).

**Investigated & REFUTED (not defects):** `main.tsx:4366` (ResultsPage empty state — refuted, always falls back to catalog); `main.tsx:4291` ("Live bridge" pill vs provenance — refuted).

---
_Generated by an offline static audit. The idempotency change and any RLS/validation hardening require a live Supabase environment to apply and verify._
