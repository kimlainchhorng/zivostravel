# MiMo run — 2026-06-16T12:11:10.596Z

- model: mimo-v2.5-pro
- task: Review this checkout double-submit fix in a client-only Vite SPA (no SSR/hydration). I added 'if (bookingSaving) return;' to handleCheckout (previously unguarded) and made the .checkout-link <a> reflect bookingSaving via aria-disabled + 'Preparing checkout' label. The sibling 'Create booking draft' button already has disabled={bookingSaving}. Confirm: (1) the guard stops a 2nd click during the in-flight POST from navigating via createBookingDraft's throwaway local-intent early-return; (2) the happy single-click path is unbroken; (3) aria-disabled on an anchor is fine here given the JS guard no-ops the click; (4) no NEW bug introduced. Flag ONLY real defects.
- files: /tmp/zivostravel-checkout-snippet.tsx

---

## Review: Checkout Double-Submit Fix

### (1) Plan

I will trace every code path through the guard, the happy path, the ARIA semantics, and the edge cases looking for real defects. The diff touches two surfaces: the `handleCheckout` guard (new) and the anchor's ARIA/label (new).

---

### (2) Findings — traced path by path

#### A. Does the guard stop a 2nd click during the in-flight POST? **Yes.** ✅

Trace the scenario:

1. User clicks the checkout `<a>`. `handleCheckout` runs → `event.preventDefault()` → `bookingSaving` is `false` → `bookingIntent` is `null` → `await createBookingDraft()`.
2. Inside `createBookingDraft`: `setBookingSaving(true)` is called. React 18 batches this and flushes it during the `await fetch(…)` pause. A re-render fires with `bookingSaving = true`, and the anchor's `onClick` now closes over the updated value.
3. User clicks the anchor again. The new `handleCheckout` (from the re-render) calls `event.preventDefault()` → checks `bookingSaving` → **`true` → returns early**. No navigation, no second `createBookingDraft` call. The in-flight POST is left alone.

The guard in `handleCheckout` intercepts the 2nd click **before** it could ever reach `createBookingDraft`'s own early-return (`return bookingIntent || localBookingIntent(…)`), so the throwaway local-intent path is never exercised from the link. ✅

#### B. Happy single-click path unbroken? **Yes.** ✅

| Sub-path | Trace | OK? |
|---|---|---|
| **`bookingIntent` already set** | `bookingIntent \|\| <short-circuit>` → uses cached intent → `window.location.href = target`. No draft call, no guard hit. | ✅ |
| **`bookingIntent` is null, API available** | `createBookingDraft` → `setBookingSaving(true)` → POST → `setBookingIntent(intent)` → `finally { setBookingSaving(false) }` → returns intent → back in `handleCheckout` → navigates. | ✅ |
| **`bookingIntent` is null, API fails** | catch block creates local intent → sets state → `finally` clears flag → returns intent → navigates. | ✅ |
| **`canUseTravelApi()` is false** | Sync local intent → sets state → clears flag → returns → navigates. | ✅ |

In every happy-path sub-case, `createBookingDraft` returns a valid intent with a `checkoutUrl`, and `handleCheckout` navigates to it. No path is broken.

#### C. `aria-disabled` on an `<a>` here? **Fine.** ✅

- `<a>` has no native `disabled` attribute; `aria-disabled="true"` is the correct ARIA mechanism.
- The link remains keyboard-focusable (correct — disabled controls should be discoverable so AT users hear the "Preparing checkout" label).
- Activation (Enter / click) is caught by React's `onClick` → `event.preventDefault()` + guard → no-op. The JS backs up the ARIA semantics.
- Some screen readers can "open link" directly by `href`, bypassing the click handler. But `bookingHref` (`bookingIntent?.booking.checkoutUrl \|\| activeSession.checkoutUrl`) always resolves to a valid URL, so worst case the user lands on the checkout page without a fresh draft — the same pre-existing behavior the anchor always had. Not a regression.

**Minor note (not a defect):** `aria-disabled={bookingSaving}` renders `aria-disabled="false"` when not saving. The ARIA spec defines this as equivalent to the attribute being absent, so it is harmless. If you prefer cleanliness, `aria-disabled={bookingSaving || undefined}` would omit the attribute entirely when `false`, but this is cosmetic only.

#### D. Any NEW bugs? **None found.** ✅

I checked for:

| Suspect | Verdict |
|---|---|
| Race between `event.preventDefault()` and the guard | Both synchronous — no gap. ✅ |
| `setBookingSaving(true)` not yet flushed when guard runs | Same render cycle on 1st click (proceeds correctly); next render on 2nd click (guard blocks). ✅ |
| Component unmount/remount during `await` | React 18 silently ignores stale `setState`; `window.location.href` still navigates. Pre-existing, not new. ✅ |
| `createBookingDraft` early-return uses unsanitized `traveler` | Pre-existing in the function's defense-in-depth path; never reached from the link (guard intercepts first) or the button (`disabled` attr). Not new. ✅ |
| Anchor `href` still live when `aria-disabled` | Client-only SPA — if JS is dead the page doesn't render at all. Not a practical concern. ✅ |

---

### (3) Verdict

**The fix is correct. All four points confirmed:**

1. ✅ Guard blocks 2nd click before it can reach `createBookingDraft`.
2. ✅ Single-click happy path (API success, API failure, local fallback) navigates correctly.
3. ✅ `aria-disabled` on the anchor is semantically correct and JS-guard-backed.
4. ✅ No new defects introduced.

**Nothing to change. Ship it.**

### What the owner must verify / deploy

- Run `npm run build` (or `npm run update`) — must pass with 0 type errors and 0 build errors.
- Manual QA: click the checkout link once → should navigate after draft creation. Rapid-click during "Preparing checkout" → second click should be a no-op, single navigation should occur.
- No commit / deploy by the agents — the owner handles that.
