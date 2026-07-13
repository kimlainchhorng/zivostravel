# ZIVO Travel — Accessibility & Responsive Evidence (Run 5, task 10)

**Method:** the Travel SPA was booted **locally** (Vite v6.4.3 dev server on `:5175`, from
commit on branch `integration/zivo-ecosystem-user-flow-v1`) and inspected in a headless
browser — accessibility tree, computed a11y signals, and responsive layout across viewports.
This is a **local dev-server inspection**, not the stable public Preview (which remains
BLOCKED — no `vercel`/`wrangler` in the build environment). No live backend, payments, or
accounts were used; the app rendered its shell + home surface.

## Accessibility (home surface) — PASS
| Signal | Result |
|--------|--------|
| Skip-to-content link | ✅ present (`#travel-main`) |
| Landmarks | ✅ `banner` 1, `navigation` 1, `main` 1, `region` 4 (labeled) |
| Headings (h1–h3) | ✅ 7, hierarchical ("Where will you go next?", "Popular routes", "Build your trip", "My trips") |
| Images with `alt` | ✅ 6/6 (0 missing) |
| Buttons with accessible name | ✅ 0 missing (e.g. "Decrease travelers", "Swap route", "Switch ZIVO app") |
| Inputs with a label | ✅ 4/4 labeled (From/To/Depart/Return) |
| ARIA roles | ✅ `tablist`/`tab` for the travel-type selector |
| `<html lang>` | ✅ `en` |
| Console errors | ✅ none |

## Responsive — PASS
| Viewport | Horizontal overflow | Notes |
|----------|--------------------|-------|
| Mobile 375×812 | ✅ none (`scrollWidth == clientWidth == 375`) | search card, tabs, travelers stepper, date pickers, trust badges all reflow cleanly |
| Desktop (native) | ✅ none | multi-column layout intact |

No element exceeded the viewport width at mobile — the most common responsive defect is absent.

## Still BLOCKED / PENDING
- **Stable public Preview** (Vercel/Cloudflare) — no deploy tooling.
- **Automated a11y/responsive suite in CI** — zivostravel has a Playwright dependency but no
  `test:e2e` / a11y / responsive script; add one (e.g. `@axe-core/playwright`) to gate this in CI.
- **Authenticated live journey** — needs a deployed app + authenticated Supabase + QA accounts
  on a non-production env.
