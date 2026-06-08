# ZivosMedia Auth Bridge

Date: 2026-06-07

This repo now has the first server-side foundation for `Continue with Zivosmedia`.

## Flow

1. Zivo Travel sends the customer to ZivosMedia auth using the existing `/auth/handoff` bridge URL.
2. ZivosMedia issues a one-time authorization code for app key `zivo-travel`.
3. Zivo Travel receives that code and calls `POST /auth/zivosmedia/exchange` with `{ code, code_verifier }`.
4. The Cloudflare Worker validates the code and PKCE verifier server-side with ZivosMedia.
5. On success, the Worker upserts `public.linked_zivosmedia_users` in the Travel Supabase project.
6. The Worker writes `public.auth_audit_logs`.
7. Local Travel session creation remains deferred until Travel local Supabase Auth behavior is explicitly enabled and tested.

## New Worker Endpoints

- `POST /auth/zivosmedia/exchange` with `{ code, code_verifier }`
- `POST /webhooks/zivosmedia/user-updated`
- `POST /webhooks/zivosmedia/user-disabled`
- `GET /admin/users/:zivosmedia_user_id`

## Server-Only Environment

These values must be configured as Cloudflare Worker secrets or server-only vars. Do not expose them to Vite/browser code.

- `ZIVO_TRAVEL_SUPABASE_SERVICE_ROLE_KEY`
- `ZIVOSMEDIA_AUTH_CLIENT_SECRET`
- `ZIVOSMEDIA_WEBHOOK_SECRET`
- `ZIVO_TRAVEL_ADMIN_API_TOKEN`

Optional non-secret/server config:

- `ZIVOSMEDIA_AUTH_APP_KEY`, default `zivo-travel`
- `ZIVOSMEDIA_AUTH_VALIDATE_URL`, default derived from `ZIVO_AUTHORITY_SUPABASE_URL`

## Database Tables

Migration `20260607173000_zivosmedia_auth_bridge.sql` adds:

- `linked_zivosmedia_users`
- `auth_audit_logs`
- `platform_webhook_events`

All three tables have RLS enabled. Browser roles receive no write access. Service-role access stays server-side in the Worker.

## Staging Checklist

- Enable the `zivo-travel` app integration in ZivosMedia.
- Configure the client secret in ZivosMedia and Cloudflare.
- Configure webhook signing secret on both sides.
- Run code exchange with a staging authorization code.
- Confirm a linked row appears in Travel Supabase.
- Confirm failed and successful attempts appear in `auth_audit_logs`.
- Confirm Admin lookup requires the admin token.
