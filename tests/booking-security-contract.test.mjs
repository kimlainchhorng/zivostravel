import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const worker = readFileSync(new URL("../cloudflare/worker.ts", import.meta.url), "utf8");
const migration = readFileSync(new URL("../supabase/migrations/20260712090000_travel_authenticated_booking_boundary.sql", import.meta.url), "utf8");

test("booking API fails closed on missing central identity and idempotency proof", () => {
  assert.match(worker, /ZIVO_AUTHORITY_SUPABASE_PUBLISHABLE_KEY/);
  assert.match(worker, /async function requireAuthorityUser/);
  assert.match(worker, /identity_authority_not_configured/);
  assert.match(worker, /const idempotencyKey = bookingIdempotencyKey\(request\)/);
  assert.match(worker, /valid_idempotency_key_required/);
  assert.doesNotMatch(worker, /booking_bridge_preview/);
  assert.doesNotMatch(worker, /supabase_public_booking_intent/);
});

test("booking persistence is bound to the verified owner and an atomic unique key", () => {
  assert.match(worker, /user_id: userId/);
  assert.match(worker, /on_conflict=user_id,idempotency_key/);
  assert.match(worker, /endpoint\.searchParams\.set\("user_id", `eq\.\$\{authority\.userId\}`\)/);
  assert.match(migration, /revoke all on table public\.zivo_travel_booking_intents from anon, authenticated/);
  assert.match(migration, /drop policy if exists zivo_travel_booking_intents_public_insert/);
  assert.match(migration, /unique index if not exists zivo_travel_booking_intents_user_idempotency_unique/);
});
