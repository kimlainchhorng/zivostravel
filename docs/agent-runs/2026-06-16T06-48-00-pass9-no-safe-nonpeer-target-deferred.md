# zivostravel pass 9 — deferred: entire runtime is a single peer-locked file; no safe non-peer target

**Date:** 2026-06-16
**Scope:** zivostravel only
**Status:** Deferred (no change applied). Baseline `npm run build`
(`tsc --noEmit && vite build`) re-verified **exit 0**. Same structural conclusion
as passes 5, 6, 7, and 8 — for the same reason.

## Why deferred (structural, not a miss)
zivostravel is a single-file React super-app. The **entire** application runtime is
two files, and **both are peer-modified this pass** (`git status --short`):

| File | Lines | Peer-modified? | Runtime? |
|---|---|---|---|
| `src/main.tsx` | 5079 | **yes (` M`)** | the whole app — off-limits |
| `cloudflare/worker.ts` | — | **yes (` M`)** | the edge worker — off-limits |
| `src/styles.css` | — | **yes (` M`)** | styles — off-limits |
| `AGENT_TASKS.md` | — | **yes (` M`)** | marathon scratch — off-limits |

The marathon rule is to find a fresh-class, real, **imported/used** bug in
**non-peer (clean) files only**, and never touch a peer-held file. Every clean file
left is **non-runtime**, so none can carry a reachable end-user bug verifiable by the
repo gate:

- `src/vite-env.d.ts` — 1-line `/// <reference>` type declaration. No logic.
- `vite.config.ts` — CLEAN, but build configuration, not app logic. Changes here are
  high-churn / low-value and carry no fresh-class correctness bug.
- `scripts/travel-backend-inventory.mjs` — CLEAN, but a one-shot dev inventory
  generator (scans the *zivosmedia* repo, writes `docs/travel-backend-inventory.md`).
  Zero end-user reachability; already read in full in pass 7 and found correct (its
  `/g` regexes are consumed via `String.matchAll`, which is not subject to the
  `lastIndex` reuse hazard).
- `scripts/agents/{mimo-runner,deepseek-runner}.mjs` — the marathon's own advisor
  tooling. Editing risks breaking the loop; out of scope by definition.
- `supabase/migrations/*.sql` — CLEAN, but already-applied migrations. Editing an
  applied migration does not change the live DB (would need a NEW migration +
  owner-only deploy), and the gate (`tsc && vite build`) does not verify SQL — so the
  "minimal additive change verified by the gate" model cannot apply. The
  security-sensitive RPC pair was audited sound in pass 7 (security-invoker,
  `search_path=public`, `auth.uid()=p_user_id`, `v_limit` clamped `[1,25]`,
  parameterized dynamic SQL, execute revoked from `public`/`anon`).

## Decision
Defer. Touching `src/main.tsx` or `cloudflare/worker.ts` would collide with concurrent
peer edits (a hard marathon prohibition); inventing a change in dev-only tooling,
build config, or applied SQL would be churn with no real-bug payoff and is unverifiable
by the gate. Honest deferral with a re-verified-green baseline is the disciplined
outcome — the repo is structurally a single peer-locked file this pass.

## What would unblock a future zivostravel pass
- `src/main.tsx` lands clean (no peer ` M`), allowing a self-contained pure-helper fix
  inside it; **or**
- the app is split so reusable logic (currency/date/booking math, redirect/host
  validation, share/serialization helpers) lives in dedicated non-peer modules; **or**
- the owner stages a SQL/RPC change as a NEW migration + deploy (out of band from this
  code-only marathon).

## Notes
- No commit/push/deploy (owner deploys). No file changed this pass.
- Honest-deferral precedent: zivostravel passes 5–8; ZIVO-CHAT pass 9; zivosmedia
  pass 9; Zivo-Admin pass 8.
- Pass-9 rotation: zivosmedia ⏸ (deferred) → ZIVO-CHAT ⏸ (deferred) → zivodriver ✓
  (dispatch-sync transient-error trip-clear, fixed) → **zivostravel ⏸ (this doc,
  deferred)** → next is zivosoftware pass 9 (gate `vite build`), then Zivo-Admin
  (gate `tsc --noEmit && vite build`).
