# MiMo run — 2026-06-16T08:54:21.872Z

- model: mimo-v2.5-pro
- task: Review this exact client-only Vite React SPA fix (no SSR). In a 'Popular routes' card, each card is a single <a href='/flights?...'> link. Inside it was a decorative circular arrow <button aria-label={`Open ${route.from} route`}><ArrowRight/></button> with NO onClick. I changed it to <span className="route-go" aria-hidden="true"><ArrowRight/></span>, and renamed the three CSS selectors '.route-card button' to '.route-card .route-go', adding margin:0; color:#07162c; pointer-events:none so the visual is identical (otherwise '.route-card span' would leak margin-top:3px and color:#61748a). Rationale: <button> is invalid as an interactive descendant of <a>; it was a dead keyboard tab stop (Enter did nothing); and its aria-label competed with the anchor's accessible name. Is this correct and complete? Any real issue? Be concise; ignore SSR/hydration (this is a client-only SPA).

---

## 1. Short plan

The fix is **correct and complete**. One minor nuance to flag (see §3).

---

## 2. Assessment of the change

| Aspect | Verdict |
|---|---|
| `<button>` inside `<a>` is invalid HTML | ✅ `<span>` is valid interactive-content-free descendant |
| Dead keyboard tab-stop (Enter did nothing) | ✅ `<span>` is not focusable; no phantom tab stop |
| `aria-label` competed with anchor's acc-name | ✅ `aria-hidden="true"` removes it from the a11y tree entirely — correct for a purely decorative arrow |
| CSS selector swap | ✅ Class-based `.route-go` is more intentional than element-based; `pointer-events:none` ensures no accidental double-targeting |
| `margin:0` / `color` overrides | ✅ Necessary to prevent style leaking if other rules target `.route-card span` generically |

No remaining bug found. The fix is clean, minimal, and forward-proof.

---

## 3. One thing to verify

Make sure `pointer-events: none` on `.route-go` does not **break the parent `<a>`'s click/hover** in the narrow gap between the text and the arrow. In theory the click should bubble up to the `<a>`, but if the span has `pointer-events: none` the browser should treat that area as "pass-through" — the `<a>` behind it receives the click. **This is correct behaviour in all modern browsers**, but worth a quick manual click-test on the arrow itself to confirm the link still navigates.

Also confirm that `.route-card button` (the old selector) appears **nowhere else** in the codebase — a quick grep for `route-card button` should return zero hits after the change.

---

**Verdict:** approve as-is. No real issue.
