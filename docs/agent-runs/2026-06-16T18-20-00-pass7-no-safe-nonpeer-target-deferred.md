# zivostravel pass 7 — deferred: no safe, reachable, non-peer app-code target

**Date:** 2026-06-16
**Scope:** zivostravel only
**Status:** Deferred (no change applied). Baseline `npm run build`
(`tsc --noEmit && vite build`) = exit 0. Consistent with pass 5 and pass 6, which
reached the same structural conclusion for the same reason.

## Why deferred
zivostravel is a single-file React super-app: the entire application lives in
`src/main.tsx` (4973 lines), and that file is **peer-modified** this pass
(`git status --short` → ` M src/main.tsx`). The marathon rule is to find a fresh-class
real bug in **non-peer files only** and never touch a peer-held file. The remaining
non-peer surface has no safe, reachable, fresh-class target:

- **`src/main.tsx`** — the whole app. Peer-modified. Off-limits.
- **`cloudflare/worker.ts`** — peer-modified. Off-limits.
- **`src/styles.css`, `AGENT_TASKS.md`** — peer-modified. Off-limits.
- **`scripts/travel-backend-inventory.mjs`** — CLEAN, but it is a one-shot developer
  inventory generator (scans the *zivosmedia* repo and writes
  `docs/travel-backend-inventory.md`). Not part of the app runtime, zero end-user
  reachability. Read in full and found no real correctness bug anyway: its module-scope
  `/g` regexes are consumed via `String.matchAll` (which is not subject to the
  `lastIndex` reuse hazard), and the domain `.test()` patterns are non-global. Nothing
  worth a production change.
- **`scripts/agents/{mimo-runner,deepseek-runner}.mjs`** — the marathon's own advisor
  tooling. Editing them risks breaking the loop; out of scope by definition.
- **`supabase/migrations/*.sql`** — CLEAN, but already-applied migrations. Editing an
  applied migration file does not change the live database (a new migration + an
  owner-only deploy would be required), and the repo gate (`tsc && vite build`) does not
  verify SQL, so the marathon's "minimal additive change verified by the gate" model
  cannot apply. Audited the security-sensitive pair anyway
  (`20260606162000_travel_share_summary_rpc.sql` +
  `20260606165000_harden_travel_share_summary_rpc.sql`) and found them sound: the RPC is
  `security invoker` with `set search_path = public`, enforces
  `auth.uid() = p_user_id`, clamps `v_limit` to `[1,25]`, uses parameterized dynamic SQL
  (`using v_limit`), and execute is revoked from `public`/`anon` and granted only to
  `authenticated`. No residual defect to flag.
- **`vite.config.ts`** — CLEAN, but build configuration, not app logic; no fresh-class
  correctness bug, and changes here are low-value / high-churn risk.

## Decision
Defer. Touching `src/main.tsx` would collide with concurrent peer edits; inventing a
change in dev-only tooling or build config would be churn with no real-bug payoff. This
is the disciplined outcome, not a miss — the repo is structurally a single peer-locked
file this pass.

## What would unblock a future zivostravel pass
- `src/main.tsx` lands clean (no peer `M`), allowing a self-contained pure-helper fix
  inside it; **or**
- the app is split so reusable logic (currency/date/booking math, redirect/host
  validation, share/serialization helpers) lives in dedicated non-peer modules; **or**
- the owner requests a SQL/RPC change to be staged as a NEW migration + deploy (out of
  band from this code-only marathon).

## Notes
- No commit/push/deploy (owner deploys). No file changed this pass.
- Pass-7 rotation: zivosmedia ✓ → ZIVO-CHAT ✓ → zivodriver ✓ → zivostravel ⏸ (deferred,
  this doc). Next is zivosoftware.
