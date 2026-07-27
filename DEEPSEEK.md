# Zivo Travel

Travel booking platform within the ZIVO ecosystem. Connected to the ZIVO
platform via the zivo-travel-bridge integration.

## Stack

- Vite 6 + React 18 + TypeScript 5
- Tailwind CSS
- Cloudflare Workers
- Supabase
- Playwright for testing

## Key directories

| Path | Purpose |
|---|---|
| `src/` | App pages & components |
| `supabase/` | Edge Functions & migrations |
| `cloudflare/` | Cloudflare Worker configs |
| `scripts/` | Build & deploy scripts |
| `docs/` | Documentation |
| `test/` | Integration tests |

## Commands

```sh
npm run dev          # Vite dev (port 5175)
npm run build        # tsc --noEmit + vite build
npm run test         # Integration tests
agent:deepseek       # DeepSeek agent runner
agent:mimo           # MiMo agent runner
```

## Architecture

- Connected to ZIVO ecosystem via `zivo-travel-bridge.json` integration contract
- Cloudflare Workers for edge deployment
- Shared Supabase infrastructure
- Multi-agent coordination (DeepSeek, MiMo)

## Key notes

- `AGENT_TASKS.md` — shared multi-agent task board
- `zivo-travel-bridge.json` — integration contract with ZIVO platform
- Review deployment branch: `review/chatgpt-zivo-travel-v2` (pending)
