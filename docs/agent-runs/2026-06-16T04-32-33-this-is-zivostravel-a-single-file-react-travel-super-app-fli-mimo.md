# MiMo advisor — This is zivostravel: a single-file React travel super-app (flights/hotels/cars/bus, deals, wallet, support, admin queue, driver handoff) with MANUAL window.location routing (no router lib). Find REAL correctness bugs only — currency/money conversion math, URL/param building, date math, localStorage JSON parsing, manual route matching, React state/effect/cleanup, stale closures, and any disconnected/unwired handlers. Tag P0/P1/P2 with a file:line and a one-line fix each. Ignore styling. Be terse; max ~12 findings, most severe first.

Files: /Users/kimlain/Documents/GitHub/zivostravel/src/main.tsx

[no final text — stop_reason=max_tokens; reasoning excerpt:]
Let me analyze this massive single-file React app for real correctness bugs.

Let me go through systematically:

1. **Currency conversion math** - The `money()` function converts by multiplying by the rate. For USD (rate=1), "$48" → "USD $48.00". For KHR (rate=4100), 48 * 4100 = 196800 → "KHR 196,800៛". For THB (rate=36), 48 * 36 = 1728 → "THB 1,728฿". This seems correct.

   BUT - `dealSaveLabel` extracts `deal.saveAmount` which is in USD, then passes it to `money(currency, amount)`. That converts correctly since all base amounts are in USD.

   Wait, but `formatAmountText` is used in the ops page for `row.amount` which is already a formatted string like "USD 126.00". It tries to extract the number and re-format it. Let me check... it matches `USD` or `$` followed by a number, extracts the number, then calls `money(currency, ...)`. This should work if the amount string starts with "USD" or "$".

   Actually looking at `fallbackAdminQueue`, amounts are formatted as `${trip.currency} ${trip.total.toFixed(2)}` which for USD trips would be "USD 126.00". The regex `(?:USD|\$)\s*\$?([0-9]+(?:\.[0-9]+)?)` would match "USD 126.00" and extract "126.00". That seems fine.

   Wait - for deal preview rows: `` `USD ${deal.price.toFixed(2)}` `` → "USD 168.00". The regex matches. OK.

2. **localStorage JSON parsing** - `readSavedTrips()` and `readSupportTickets()` both wrap in try/catch. `normalizeSavedTrip` does validation. Looks OK.

3. **Manual route matching** - `currentRouteKind()` checks `pathname.replace(/^\/+/, "").split("/")[0]`. For `/flights?...`, this gives "flights". For `/booking/review`, this gives "booking" which isn't matched. `currentReviewKind()` checks `pathname === "/booking/review"`. `isTripsRoute()` checks `pathname === "/trips" || pathname === "/my-trips"`. These seem correct.

   But wait - the route matching in `App` is:
   ```
   dealsRoute ? <DealsPage> : tripsRoute ? <TripsPage> : walletRoute ? ... : supportRoute ? ... : opsRoute ? ... : reviewKind ? ... : routeKind ? ... : <Home>
   ```
   
   `isOpsRoute()` checks for `/ops` or `/travel/ops`. But `currentRouteKind()` would match "ops" if it's a SearchKind... wait, no - it only matches "flights", "hotels", "cars", "bus". So `/ops` wouldn't be caught by `routeKind`. Good.

   But what about `/booking/review?type=ops`? `currentReviewKind()` only returns "hotels", "cars", "bus", or defaults to "flights". So "ops" would default to "flights" in the review. That's not a real issue since nobody would pass type=ops.

4. **Stale closures** - Let me look at effects. The `BookingReview` component has `createBookingDraft` which uses `activeSession`, `kind`, `searchContext`, `traveler`. These are all from the component scope. Since it's called from a click handler, they should be current at call time. OK.

5. **`readSearchContext` called on every render** - In `ResultsPage`, `searchContext` is `useMemo(() => readSearchContext(kind), [kind])`. But `readSearchContext` reads from `window.location.search`. If the URL changes without a re-render of the component (unlikely with manual routing but possible), the memoized value would be stale. However, since `kind` is derived from the URL path, if the path changes the component would remount. The search params could change though... but this is an edge case, not a bug per se.

   Wait, actually - in `ResultsPage`, the `useEffect` depends on `searchContext.count`, `searchContext.end`, etc. But `searchContext` is memoized with only `[kind]` as dependency. So if you navigate to `/flights?from=Phnom+Penh&to=Siem+Reap&travelers=3` without changing `kind`, the `searchContext` would still have the old `count`. But since this is manual `window.location` routing, navigating to a different URL would unmount/remount the component anyway.

   Actually wait - the search panel has links built with `resultHref` that changes as you type. When you click the link, it navigates via `<a href=...>` which does a full page navigation (no SPA router). So the component remounts on every navigation. OK.

6. **`formatAmountText` regex bug** - Looking at the regex: `/(?:USD|\$)\s*\$?([0-9]+(?:\.[0-9]+)?)/i`. The amount strings from `fallbackAdminQueue` are like `"USD 126.00"`. The regex matches "USD 126.00" and captures "126.00". But wait, it also has `\s*\$?` between the USD/$ and the number. So for "USD 126.00" it would match "USD 126" (not "126.00") because the `\s*` matches the space, then `\$?` tries to match optional `$`, then `[0-9]+` matches "126". Wait, `\$?` is optional so it wouldn't consume anything, and `[0-9]+` would match "126", then `(?:\.[0-9]+)?` would match ".00". So the capture is "126.00". OK that's correct.

   Hmm wait, but for "KHR 196,800៛" - the regex only matches strings starting with "USD" or "$". So non-USD amounts wouldn't match and would return the original string unchanged. That's actually a bug if the user has KHR selected and the admin queue shows amounts. But actually, the admin queue stores amounts as "USD 126.00" regardless of the selected currency, and `formatAmountText` tries to extract the USD amount and convert it. So this is correct behavior.

   But wait - what about the format "KHR 196,800៛" if that were stored? The regex wouldn't match, and the original KHR amount would be returned. But this format is only produced by `money()` for display; the stored amounts in admin queue are always "USD X.XX". So this is fine.

7. **`readSearchContext` for `hotels` reads `params.get("to") || params.get("city")`** - For hotels, the URL uses `city` param. But then `readSearchContext` would set `to = "Siem Reap"` (from the `city` param). And `from` would be `params.get("from") || defaultRoute.from` = "Phnom Penh". But for hotels, the URL doesn't have a `from` param. So `from` = "Phnom Penh" (default). This is fine - the `readSearchContext` handles this.

8. **`ResultsPage` effect dependency** - The `useEffect` has `searchContext.count, searchContext.end, searchContext.from, searchContext.rooms, searchContext.start, searchContext.to, searchContext.tripType` as deps. But `searchContext` is from `useMemo(..., [kind])`. These values won't change for the same `kind`. So the effect deps are effectively `[kind]`. This is technically fine since the URL determines both the kind and the params, and navigation remounts the component.

   Actually wait - there's a subtlety. `searchContext` is memoized on `[kind]`. But the `useEffect` deps reference `searchContext.count` etc. Since `searchContext` is a new object every time `kind` changes (useMemo returns a new object), and the individual properties are primitives, React will do shallow comparison on each. When `kind` changes, all values change (new object). When `kind` stays the same, the object reference is the same, so all values are the same. So the effect re-runs exactly when `kind` changes. OK.

9. **`BookingReview` effect** - Same pattern. The effect deps include `searchContext.count` etc., but `searchContext` is memoized on `[kind]`. The effect also depends on `resultId` and `dealId` which come from `window.location.search`. Since these are read at render time (not memoized), they could potentially differ from the URL at effect execution time. But since there's no router, the URL doesn't change between render and effect. OK.

10. **`MyTrips` component** - It subscribes to `savedTripsEvent` and `storage` events. But the parent `App` also subscribes to the same events. This is fine - both will update independently.

11. **`currentReviewKind()`** - Returns `null` if pathname isn't `/booking/review`. If it is, reads `type` param. If type is "hotels", "cars", or "bus", returns that. Otherwise defaults to "flights". This means if `type` is missing or invalid, it defaults to flights. This is a reasonable default.

    But what if the URL is `/booking/review?type=hotels&result=hotel-riverside-suite`? The function returns "hotels". Then `BookingReview` is rendered with `kind="hotels"`. Inside, `fallbackReviewSession("hotels", "hotel-riverside-suite", null)` is called. `selectedResult("hotels", "hotel-riverside-suite")` finds the hotel result. OK.

12. **`selectedResult` returns a result with `checkoutUrl` and `reviewUrl` built using the `kind` parameter, but the result's original `id`** - This is fine.

13. **`fallbackReviewSession` uses `kind` to look up the result, but if there's a `deal`, it uses `deal.reviewKind`** - So `sessionKind = deal?.reviewKind || kind`. Then `baseResult = selectedResult(sessionKind, deal?.resultId || resultId)`. This is correct.

14. **`contextualizeReviewSession` builds SSO URL** - It creates `checkoutTarget = new URL(checkoutHref)`. Since `checkoutHref` is from `contextualCheckoutUrl` which returns an absolute URL (via `engineUrl`), `new URL(checkoutHref)` should work. OK.

15. **`withBookingReference`** - Creates a URL from `rawUrl` which could be a relative path or absolute URL. `new URL(rawUrl, base)` handles both. If `rawUrl` starts with `/`, returns `${url.pathname}${url.search}`. Otherwise returns full URL. OK.

    But wait - what if `rawUrl` is something like `https://zivosmedia.com/travel/checkout?...`? Then `new URL(rawUrl, base)` uses the absolute URL as-is. Then it returns `url.toString()` which is the full URL. OK.

16. **`handleCheckout` in `BookingReview`** - Calls `createBookingDraft()` which returns a promise. If `bookingSaving` is true, it returns `bookingIntent || localBookingIntent(...)`. But `bookingSaving` is a React state variable - it's captured in the closure. If the user clicks twice quickly, the second click might see `bookingSaving` as false (stale closure) and start a second draft. But this is a minor UX issue, not a correctness bug.

    Actually, looking more carefully: `createBookingDraft` checks `if (bookingSaving)` at the top. If it's already saving, it returns the existing intent or creates a local one. But `bookingSaving` is a state variable, so in the closure it would be the value at the time of render. If two renders haven't happened yet, both calls could see `bookingSaving = false`. This is a potential race condition. P2.

17. **`handleCheckout`** - `event.preventDefault()` then `window.location.href = intent.booking.checkoutUrl`. This navigates away. But if `createBookingDraft` throws, the error isn't caught. Let me check... `createBookingDraft` has a try/catch that always sets `bookingIntent` and returns it. So it shouldn't throw. OK.

18. **`checkoutUrl` function** always uses `defaultRoute.from`, `defaultRoute.to`, `defaultDates.depart`, `defaultDates.return`. So checkout URLs from `selectedResult` don't reflect user's actual search context. But `contextualCheckoutUrl` does. And `BookingReview` uses `activeSession.checkoutUrl` which is from `contextualizeReviewSession` which uses `contextualCheckoutUrl`. So the checkout link in the review page is contextual. But `selectedResult` builds non-contextual URLs - however, these are only used as fallbacks and are overwritten by contextualization. OK.

    Wait - in `fallbackReviewSession`, the result's `checkoutUrl` is from `checkoutUrl(kind, result.id, deal.id)` which is non-contextual. Then `contextualizeReviewSession` overwrites it. So the final value is contextual. OK.

19. **`reviewUrl` in `contextualizeReviewSession`** - The `session.result.reviewUrl` gets overwritten with `reviewHref` which is from `contextualReviewUrl`. And the `session.reviewUrl` also gets overwritten. OK.

20. **`resultListUrl`** - Returns a local URL like `/flights?from=...`. This is used as the "Back to results" link in `BookingReview`. But when you click this link, you navigate to `/flights?...` which loads `ResultsPage`. The `ResultsPage` reads the search context from the URL. So the back link should work. OK.

21. **Let me check for any React key issues or missing keys**... All `.map()` calls seem to have keys. OK.

22. **`readSearchContext` for cars** - The URL uses `pickup_date` and `return_date`. `readSearchContext` reads: `start = params.get("start") || params.get("date") || params.get("ci") || params.get("pickup_date") || defaultDates.depart`. So for cars, it would pick up `pickup_date`. OK.

23. **What about the `buildSearchPath` for "One way" flights?** - It only sets `end` if tripType !== "One way". But `resultRequestParams` always sets `end: context.end`. And `readSearchContext` always reads `end` from the URL or uses the default. So for one-way flights, `end` would still have a value (the default or whatever was in the URL). This means the "return" date is still sent for one-way flights. This could be confusing but isn't strictly a bug since the backend would handle it.

24. **The `SectionHeader` component has `onPrevious` and `Next` buttons that are always rendered, even when there's nothing to paginate.** In `MyTrips`, they're wired up. In `BuildTrip` and `PopularRoutes`, they're not passed, so they're `undefined`. The `onClick={onPrevious}` would be `onClick={undefined}` which does nothing. Not a bug.

25. **`isPrimaryNavActive` for non-Deals links** - It checks `path === hrefPath`. `hrefPath` is the path part of the href. For flights, `hrefPath` = "/flights". If the current path is "/flights", this is active. But what if the path is "/flights/" (trailing slash)? `currentPath()` returns `window.location.pathname` which preserves trailing slashes. So "/flights/" !== "/flights" and the nav wouldn't show as active. Minor but not really a bug in practice.

26. **`readSearchContext` constructs chips, and the `routeChip` for hotels/cars uses just `to`** - This is intentional behavior.

27. **`handleCheckout` does `event.preventDefault()` but the link is `<a>`** - This prevents navigation, then does it programmatically after saving the draft. OK.

Let me look for more substantial bugs...

28. **`money()` function** - For non-USD currencies, it returns `"CODE formattedCODE"` wait no: `${option.code} ${formatted}${option.symbol}`. So for KHR with amount 48: 48 * 4100 = 196800. `formatted` = "196,800". Result = "KHR 196,800៛". The symbol is appended directly after the number with no space. For THB with amount 48: 48 * 36 = 1728. Result = "THB 1,728฿". This might look odd but is functionally correct for Thai and Khmer currency formatting conventions.

29. **`formatAmountText`** - Used in OpsPage. For amounts that don't match the regex (e.g., already in KHR format), it returns the original string unchanged. Since the admin queue stores amounts in "USD X.XX" format, this works. But if the admin queue were to store amounts in other formats, it would break. This is acceptable for the current implementation.

30. **Let me look for real bugs more carefully...**

In `ResultsPage`, the `useEffect`:
```js
useEffect(() => {
    ...
    const params = resultRequestParams(kind, searchContext);
    fetch(`/api/travel/results?${params.toString()}`, ...);
    ...
}, [kind, searchContext.count, searchContext.end, searchContext.from, searchContext.rooms, searchContext.start, searchContext.to, searchContext.tripType]);
```

But `searchContext` is from `useMemo(() => readSearchContext(kind), [kind])`. This means if the URL search params change without changing the route kind (which can't happen with full-page navigation, but could happen with history.pushState if that were used), the search context wouldn't update. Since this app uses full-page navigation via `<a href=...>`, this is fine.

31. **`BookingReview` effect** depends on `searchContext.count` etc., but also on `kind`, `resultId`, `dealId`. The `searchContext` memo depends only on `kind`. The `resultId` and `dealId` are read from `window.location.search` at render time. If these change (via full navigation), the component remounts. OK.

32. **Let me check `selectedResult` more carefully:**
```ts
function selectedResult(kind: SearchKind, resultId?: string | null): ResultItem {
  const result = resultCatalog[kind].find((item) => item.id === resultId) || resultCatalog[kind][0];
  return {
    ...result,
    checkoutUrl: checkoutUrl(kind, result.id),
    reviewUrl: reviewUrl(kind, result.id)
  };
}
```
If `resultId` is `null` or `undefined`, it defaults to the first result. If `resultId` doesn't match any result, it also defaults to the first result. This is intentional fallback behavior.

33. **`fallbackReviewSession` uses `deal.reviewKind` for the session kind, but `kind` (the URL parameter) is used for the review URL fallback:** `reviewUrl: result.reviewUrl || reviewUrl(kind, result.id)`. If the deal specifies a different `reviewKind` than the URL `kind`, and `result.reviewUrl` is falsy, the fallback `reviewUrl` would use the wrong `kind`. But `result.reviewUrl` is set in the deal handling above: `reviewUrl: reviewUrl(sessionKind, baseResult.id, deal.id)`. So it's always set when there's a deal. OK.

34. **`handleCheckout` returns early in the `if (bookingSaving)` branch:** Actually it doesn't return early - it returns the intent. But in `handleCheckout`, `createBookingDraft` is awaited, and then `window.location.href` is set. If `bookingSaving` is true, `createBookingDraft` returns a value (either `bookingIntent` or a new local intent), and `handleCheckout` uses it. But `bookingIntent` from state might be null if this is the first call and `bookingSaving` just became true in another concurrent call. In that case, it falls through to `localBookingIntent(activeSession, kind, traveler)`. This should work.

35. **Let me look at the actual real bugs...**

**BUG 1: `readSearchContext` doesn't account for URL params from the booking review page.** The `BookingReview` component calls `readSearchContext(kind)` which reads from the current URL. The booking review URL has `type`, `from`, `to`, `start`, `end`, `travelers`, `result`, `deal` params. `readSearchContext` reads `from`, `to`, `start`, `end`, `travelers`/`adults`/etc. So it should pick up the right values from the review URL too. OK, not a bug.

**BUG 2: `contextualizeReviewSession` creates `checkoutTarget = new URL(checkoutHref)`** - `checkoutHref` is from `contextualCheckoutUrl` which returns `engineUrl(...)` - an absolute URL like `https://zivosmedia.com/travel/checkout?...`. `new URL(checkoutHref)` should work. OK.

But wait - what about `ssoUrl`? It uses `checkoutTarget.pathname + checkoutTarget.search`. If `engineOrigin` is `https://zivosmedia.com`, then `checkoutTarget.pathname` = `/travel/checkout` and `checkoutTarget.search` = `?product=flights&...`. The SSO URL becomes `engineUrl(bridge.routing.authHandoff + '?app=zivo-travel&redirect=' + encodeURIComponent('/travel/checkout?...'))`. This is correct - the redirect is a relative path + query.

**BUG 3: `reviewUrl` function doesn't include `end` for one-way flights in `buildSearchPath`** - Wait, `reviewUrl` is different from `buildSearchPath`. `reviewUrl` always includes `end` via `defaultDates.return`. `buildSearchPath` conditionally includes `end` for one-way flights. This is intentional.

OK, I think I need to look more carefully for actual bugs...

**BUG: `currentReviewKind` defaults to "flights" when type is missing** - If you visit `/booking/review` without a `type` param, `currentReviewKind` returns "flights". Then `BookingReview` renders with `kind="flights"`. `fallbackReviewSession("flights", null, null)` creates a review session for the default flight result. This seems intentional but could be surprising.

**BUG: `isPrimaryNavActive` for "Deals" link** - Checks `path === "/deals"`. But the Deals link href is `/deals`. So when on `/deals`, `isPrimaryNavActive("Deals", "/deals")` checks `path === "/deals"` which is true. OK.

**BUG: Route matching order** - In `App`, the ternary chain:
```
dealsRoute ? ... : tripsRoute ? ... : walletRoute ? ... : supportRoute ? ... : opsRoute ? ... : reviewKind ? ... : routeKind ? ... : ...
```

If path is `/trips`, `dealsRoute` is false, `tripsRoute` is true. OK.
If path is `/booking/review?type=flights`, `dealsRoute` is false, `tripsRoute` is false, `walletRoute` is false, `supportRoute` is false, `opsRoute` is false, `reviewKind` is "flights" (truthy). OK.

But what about `/wallet`? `walletRoute` checks `pathname === "/wallet" || pathname === "/travel/wallet"`. If it's `/wallet`, `dealsRoute` false, `tripsRoute` false, `walletRoute` true. OK.

What about `/deals`? `dealsRoute` true. OK.

What about path `/`? All route checks are false, falls through to home page. OK.

What about `/flights`? `dealsRoute` false, `tripsRoute` false, `walletRoute` false, `supportRoute` false, `opsRoute` false, `reviewKind` null (pathname !== "/booking/review"), `routeKind` = "flights" (truthy). OK.

Looks correct.

**BUG: `SavedTrip` and `BookingRecord` type mismatch** - `SavedTrip` extends `BookingRecord` with `mode`, `persisted`, `reason`, `savedAt`. In `saveBookingIntent`, `saved` is `{ ...intent.booking, traveler: ..., mode: ..., persisted: ..., reason: ..., savedAt: ... }`. `intent.booking` is a `BookingRecord`. This spread should produce a valid `SavedTrip`. OK.

**BUG: `normalizeSavedTrip` doesn't validate numeric fields** - It does `Number(trip.subtotal || 0)` which could produce NaN if `trip.subtotal` is something like "abc". `Number("abc" || 0)` = `Number("abc")` = NaN. Wait no, `"abc" || 0` = "abc" (truthy string), so `Number("abc")` = NaN. But the `|| 0` only kicks in if the value is falsy. So if `trip.subtotal` is `undefined`, `Number(undefined || 0)` = `Number(0)` = 0. If it's `"abc"`, `Number("abc")` = NaN. This could produce NaN values in saved trips. **P2**.

Actually, `Number(trip.subtotal || 0)` - if `trip.subtotal` is `NaN`, `NaN || 0` = 0 (because NaN is falsy). So if the stored value was already NaN, it would be fixed. But if it's a non-numeric string, it would produce NaN. In practice, localStorage stores JSON, and the values are written by `saveBookingIntent` which spreads `intent.booking` which has `subtotal: session.subtotal` which is a number. So the stored value should always be a number. But if someone manually edits localStorage, this could break. P2.

**BUG: `ResultsPage` useEffect has stale closure potential** - The `searchContext` is from `useMemo` that depends only on `[kind]`. But the effect depends on individual properties of `searchContext`. Since these properties are derived from URL params and don't change for the same `kind`, this is fine.

Wait, but `readSearchContext` reads from `window.location.search` at the time the memo runs. If the component re-renders (e.g., due to `currency` change from context), the memo doesn't re-run (deps haven't changed), so `searchContext` stays the same. The `useEffect` also doesn't re
