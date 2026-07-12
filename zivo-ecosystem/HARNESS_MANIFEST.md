# ZIVO Ecosystem — Contract Harness Manifest

Exact branches/commits captured by the Run 5 ecosystem integration work. **URLs are
recorded only where a real, stable deployment exists — none are fabricated.** No
Preview/Review deployment exists yet (no `vercel`/`wrangler` available in the build
environment), so deploy URLs are `PENDING`.

## Run 5 — baseline audit (documentation)
| Repo | Branch | Commit(s) | URL |
|------|--------|-----------|-----|
| ZIVO-wallet | `claude/run5-zivo-ecosystem-baseline` | `5afe675` (10 baseline docs), `4bd392c` (completion) | PENDING (docs branch, not deployed) |

## Run 5 — cross-app integration contract (`zivo-ecosystem/` package)
Branch **`integration/zivo-ecosystem-user-flow-v1`** (isolated, not merged) in all 7 repos:

| Repo | Commit (contract v1) | Travel module added this run |
|------|----------------------|------------------------------|
| ZIVO-wallet | `f7bb140` | see below |
| zivodriver | `36a28d6` | — |
| zivosmedia | `33401f0` | — |
| zivosoftware | `7c98c53` | — |
| zivostravel | `84621e0` | see below |
| ZIVO-CHAT | `269107d` | — |
| Zivo-Admin | `5f9f310` | — |

## Run 5 — Travel booking / Wallet-handoff / refund (this run)
| Repo | Branch | Commit | Notes |
|------|--------|--------|-------|
| zivostravel | `integration/zivo-ecosystem-user-flow-v1` | `96015bd` | `zivo-ecosystem/travel/` module + fixtures + 13 tests |
| ZIVO-wallet | `integration/zivo-ecosystem-user-flow-v1` | `9305b8a` | handoff doc + mirrored travel module + this manifest |

_(This closeout commit updates the two rows above with the exact travel-flow commits; the closeout commit's own SHA is the current branch HEAD.)_

## Verification
- Offline contract + journey tests: `node --test zivo-ecosystem/*.test.mjs` → 17 pass.
- Offline Travel booking tests: `node --test zivo-ecosystem/travel/*.test.mjs` → 13 pass.
- Combined: 30 pass / 0 fail (Node 22).

## Prior runs (Runs 1–4)
Exact commits/URLs were **not re-verified in this run** and are intentionally left
blank rather than guessed. Known reference points from repo history/memory:
- Prior ecosystem design/glossary/migration audit: branch `claude/ecosystem-audit` (`9ce3d86`, ZIVO-wallet, not merged).
- Run 7 offline harness: worktree `ZIVO-wallet-ecosystem-harness-run7` (`tools/ecosystem` + `tests/ecosystem`, runtime PENDING).
To populate Runs 1–4 exactly, capture each run's branch tip with `git rev-parse` from its worktree.

## Live deployment / journey status
| Item | Status | Unblock |
|------|--------|---------|
| Stable Preview (Vercel/Cloudflare) | 🛑 BLOCKED | install/authorize `vercel`/`wrangler`; no Quick Tunnel |
| Review Hub URL | 🛑 BLOCKED | a Preview target; interim static `zivo-ecosystem/review-hub/index.html` |
| Live real-user journeys | 🟡 PENDING | deployed apps + authenticated Supabase (MCP unauthenticated) + Run 7 accounts on a non-production env |
