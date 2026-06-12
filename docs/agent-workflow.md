# Multi-agent workflow — Claude + Codex + DeepSeek + MiMo

Shared rulebook so the AI tools can work on this repo **together** without
overwriting each other. This is the connected ZIVO workflow — the same setup
lives in every ZIVO repo (media, travel, driver, chat, software, admin).

The live to-do list is [`AGENT_TASKS.md`](../AGENT_TASKS.md).

---

## The agents (who does what)

| Agent | Best at | Owns |
|-------|---------|------|
| **Claude Code** | Big features, cross-cutting changes, reviewing, running the verify gate | Whatever it claims in `AGENT_TASKS.md` |
| **Codex** | Page-level work, backend readiness | Whatever it claims in `AGENT_TASKS.md` |
| **DeepSeek** | Planning, second-opinion review, focused single-task diffs | No files directly — runs via `npm run agent:deepseek` and **proposes** |
| **MiMo** (Xiaomi) | Deeper reasoning, audits, second-opinion review | No files directly — runs via `npm run agent:mimo` and **proposes** |

> DeepSeek and MiMo are **advisors**. The runner gives the model the repo's
> rulebook + a task, and it returns a plan or a diff. They do **not** edit the
> repo — a human, Claude, or Codex reviews and applies the change.

---

## The 6 coordination rules

1. **One rulebook.** Every agent reads `AGENTS.md` (if present) + this file before starting. DeepSeek/MiMo get them injected by the runner.
2. **Claim before you build.** Add your task to `AGENT_TASKS.md` under **In progress** with your name + date.
3. **One agent per file/page.** If two tasks touch the same file, do them one at a time.
4. **Verify before you finish.** Run the repo's build/type gate (e.g. `npm run build` / `npm run update`) before moving a task to **Done**.
5. **Owner commits & deploys.** Don't `git commit`/`push`/deploy unless the owner asks. Build changes **ready to deploy** and hand over the exact command.
6. **Keep changes additive.** Don't break working features while improving others.

---

## How to run DeepSeek / MiMo

Both use the **same runner CLI and flags** — swap `agent:deepseek` for `agent:mimo`.

1. Put your key(s) in `.env.local` (git-ignored):

   ```
   DEEPSEEK_API_KEY=sk-...
   MIMO_API_KEY=sk-...
   # MIMO_BASE_URL=https://api.xiaomimimo.com/anthropic   # optional override
   # MIMO_MODEL=mimo-v2.5-pro                              # optional override
   ```

2. Ask it to plan or review a task:

   ```bash
   npm run agent:deepseek -- --task "Plan X"
   npm run agent:mimo -- --task "Review this for bugs" --file src/path/to/File.tsx
   ```

Useful flags: `--task "..."` (required), `--file <path>` (repeatable context),
`--model <name>`, `--out <path>`, `--no-save`, `--max-tokens <n>`, `--dry-run`.

Every run is also saved under `docs/agent-runs/` so the other agents (and you)
can read what was proposed.

> The runners are **self-contained** (no `dotenv` dependency) — they read
> `.env.local`/`.env` with a built-in parser, so they work in any ZIVO repo.
