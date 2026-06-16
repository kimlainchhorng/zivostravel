# MiMo run — 2026-06-16T13:13:10.701Z

- model: mimo-v2.5-pro
- task: Double-submit / in-flight-divergence / dead-button review of a client-only Vite React+TS SPA (NO SSR). See the snippet header for full context. Focus ONLY on the FIXED prepareDriverRequest + its button. (1) Does adding '|| bookingSaving' to BOTH the re-entry guard and the button's disabled fully close the throwaway-local-intent divergence, while still letting a first-time click (no draft, nothing in flight) auto-create a real draft via createBookingDraft? (2) Any new dead-button/stuck-state risk from the added disabled condition (e.g., could the button stay disabled forever)? Only report REAL defects; if clean, say clean. Do not invent SSR/hydration issues.
- files: /tmp/zivostravel-driverrequest-34.tsx

---

## Analysis

### (1) Does `|| bookingSaving` fully close the divergence without breaking auto-create?

**Yes — fully closed, auto-create preserved.** Trace:

| Scenario | `bookingSaving` | `driverRequestSaving` | `bookingIntent` | Guard `if (driverRequestSaving \|\| bookingSaving)` | `bookingIntent \|\| await createBookingDraft()` | Outcome |
|---|---|---|---|---|---|---|
| First click, no draft, nothing in flight | `false` | `false` | `null` | passes | calls `createBookingDraft()` → `bookingSaving` is `false` inside, so it proceeds with a **real server POST**, sets `bookingIntent`, returns real intent | ✅ Real draft created, driver request bound to correct reference |
| Booking draft mid-save, user clicks driver | `true` | `false` | `null` | **returns early** | never reached | ✅ Divergence blocked |
| Draft saved, user clicks driver | `false` | `false` | `{…}` | passes | uses existing `bookingIntent` | ✅ Normal path |
| Driver request already in flight | `false/true` | `true` | any | **returns early** | never reached | ✅ No double-fire |

The `|| bookingSaving` guard fires **before** `createBookingDraft` is ever called in the dangerous window, so the throwaway-local-intent short-circuit inside `createBookingDraft` is unreachable from this callsite during a concurrent booking save.

### (2) Any new dead-button / stuck-state risk?

**No.** Both flags are unconditionally cleared:

- **`bookingSaving`**: cleared in `finally { setBookingSaving(false) }` (happy path + catch), and in the early `!canUseTravelApi()` synchronous path. Cannot get stuck.
- **`driverRequestSaving`**: cleared in `finally { setDriverRequestSaving(false) }` (happy path + catch), and in the early `!canUseTravelApi()` synchronous path. Cannot get stuck.

No code path can leave either flag `true` indefinitely, so neither condition in `disabled={driverRequestSaving || bookingSaving}` can latch. The button returns to its enabled/labelled state as soon as the in-flight operation resolves or fails.

No synchronous exception can escape before the `try` block in either function (`sanitizeTravelerDetails`, `canUseTravelApi()`, `new URLSearchParams()` are all safe sync operations), so there is no path that sets the flag but skips the `finally`.

---

## Verdict

**Clean.** The fix is correct as written — it closes the in-flight divergence (same family as the already-shipped `handleCheckout` guard) and introduces no new dead-button or stuck-state risk. The auto-create-draft convenience on first click is fully preserved.

No diff proposed. Nothing to change.

**Verify:** `npm run build` (or `npm run update`) — `tsc --noEmit` 0 errors + `vite build` 0 errors. The owner should also do a quick interactive smoke test: (a) click "Prepare driver request" with no draft → confirm a real draft is created and the driver request fires; (b) click "Create booking draft" then immediately click "Prepare driver request" → confirm the button shows "Waiting for draft" and is disabled, then re-enables after the draft completes.
