import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import worker, { type Env } from "../cloudflare/worker";
import {
  createAuthenticatedBookingRequest,
  createBookingIdempotencyKey,
} from "../src/bookingRequest";

const authorityUserId = "11111111-1111-4111-8111-111111111111";
const secondAuthorityUserId = "22222222-2222-4222-8222-222222222222";
const idempotencyKey = "zivo_travel_1234567890abcdef";

const persistedRow = {
  id: "33333333-3333-4333-8333-333333333333",
  booking_reference: "ztb_1234567890ab",
  status: "pending_checkout",
  service_type: "flight",
  result_id: "flight-angkor-direct",
  result_title: "Morning direct",
  provider: "Zivo Air",
  currency: "USD",
  subtotal: 48,
  service_fee: 4,
  total: 52,
  review_url: "https://travel.example/booking/review",
  checkout_url: "https://zivosmedia.com/travel/checkout",
  sso_url: "https://zivosmedia.com/auth/handoff",
  created_at: "2026-07-13T00:00:00.000Z",
};

function travelEnv(): Env {
  return {
    ASSETS: {
      fetch: async () => new Response("not found", { status: 404 }),
    } as Fetcher,
    ZIVO_PLATFORM_ORIGIN: "https://zivosmedia.com",
    ZIVO_TRAVEL_SUPABASE_URL: "https://travel.example",
    ZIVO_TRAVEL_SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
    ZIVO_AUTHORITY_SUPABASE_URL: "https://authority.example",
    ZIVO_AUTHORITY_SUPABASE_PUBLISHABLE_KEY: "publishable-key",
  };
}

function bookingRequest(userToken = "valid-authority-token") {
  return new Request("https://travel.example/api/travel/bookings?type=flights&result=flight-angkor-direct", {
    method: "POST",
    headers: {
      authorization: `Bearer ${userToken}`,
      "idempotency-key": idempotencyKey,
      "content-type": "application/json",
    },
    body: JSON.stringify({ type: "flights", resultId: "flight-angkor-direct" }),
  });
}

async function withFetchStub<T>(
  fetchStub: typeof fetch,
  action: () => Promise<T>,
): Promise<T> {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = fetchStub;

  try {
    return await action();
  } finally {
    globalThis.fetch = originalFetch;
  }
}

test("client booking requests keep authority proof and idempotency key out of the URL", () => {
  const request = createAuthenticatedBookingRequest({
    url: "https://travel.example/api/travel/bookings?type=flights",
    accessToken: "authority-access-token",
    idempotencyKey,
    body: { type: "flights" },
  });

  assert.equal(request.headers.get("authorization"), "Bearer authority-access-token");
  assert.equal(request.headers.get("idempotency-key"), idempotencyKey);
  assert.equal(new URL(request.url).searchParams.has("accessToken"), false);
  assert.equal(new URL(request.url).searchParams.has("idempotencyKey"), false);
});

test("idempotency keys require cryptographic UUID entropy", () => {
  const key = createBookingIdempotencyKey(() => "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee");

  assert.match(key, /^zivo_travel_[A-Za-z0-9_-]{16,160}$/);
  assert.throws(() => createBookingIdempotencyKey(() => "not-a-uuid"), /secure idempotency key/);
});

test("the browser preflight permits the idempotency header without widening origins", async () => {
  const response = await worker.fetch(
    new Request("https://travel.example/api/travel/bookings", {
      method: "OPTIONS",
      headers: { origin: "https://zivostravel.com" },
    }),
    travelEnv(),
  );

  assert.equal(response.status, 204);
  assert.equal(response.headers.get("access-control-allow-origin"), "https://zivostravel.com");
  assert.match(response.headers.get("access-control-allow-headers") || "", /idempotency-key/i);
});

test("booking creation fails before any Travel datastore request without authority authentication", async () => {
  await withFetchStub(
    async () => {
      throw new Error("Travel datastore must not be called without authority authentication");
    },
    async () => {
      const response = await worker.fetch(
        new Request("https://travel.example/api/travel/bookings", { method: "POST" }),
        travelEnv(),
      );

      assert.equal(response.status, 401);
      assert.deepEqual(await response.json(), { error: "authentication_required" });
    },
  );
});

test("an invalid authority session fails before any Travel datastore request", async () => {
  await withFetchStub(
    async (input, init) => {
      const request = input instanceof Request ? input : new Request(input, init);

      if (new URL(request.url).origin === "https://authority.example") {
        return Response.json({ error: "invalid token" }, { status: 401 });
      }

      throw new Error("Travel datastore must not be called for an invalid authority session");
    },
    async () => {
      const response = await worker.fetch(bookingRequest("expired-authority-token"), travelEnv());

      assert.equal(response.status, 401);
      assert.deepEqual(await response.json(), { error: "invalid_authority_session" });
    },
  );
});

test("booking creation requires an opaque idempotency key after authentication", async () => {
  await withFetchStub(
    async (input, init) => {
      const request = input instanceof Request ? input : new Request(input, init);

      if (new URL(request.url).origin === "https://authority.example") {
        return Response.json({ id: authorityUserId });
      }

      throw new Error("Travel datastore must not be called without a valid idempotency key");
    },
    async () => {
      const response = await worker.fetch(
        new Request("https://travel.example/api/travel/bookings", {
          method: "POST",
          headers: { authorization: "Bearer valid-authority-token" },
        }),
        travelEnv(),
      );

      assert.equal(response.status, 400);
      assert.deepEqual(await response.json(), { error: "valid_idempotency_key_required" });
    },
  );
});

test("booking creation fails closed when server-only Travel persistence is absent", async () => {
  const env = travelEnv();
  delete env.ZIVO_TRAVEL_SUPABASE_SERVICE_ROLE_KEY;

  await withFetchStub(
    async (input, init) => {
      const request = input instanceof Request ? input : new Request(input, init);

      if (new URL(request.url).origin === "https://authority.example") {
        return Response.json({ id: authorityUserId });
      }

      throw new Error("Travel datastore must not be called without its service-role credential");
    },
    async () => {
      const response = await worker.fetch(bookingRequest(), env);

      assert.equal(response.status, 503);
      assert.deepEqual(await response.json(), { error: "booking_authority_not_configured" });
    },
  );
});

test("the Worker rejects a misconfigured authority service key", async () => {
  const env = travelEnv();
  env.ZIVO_AUTHORITY_SUPABASE_PUBLISHABLE_KEY = "sb_secret_not-a-public-key";

  await withFetchStub(
    async () => {
      throw new Error("No authority or Travel request should use a service-role authority key");
    },
    async () => {
      const response = await worker.fetch(bookingRequest(), env);

      assert.equal(response.status, 503);
      assert.deepEqual(await response.json(), { error: "identity_authority_not_configured" });
    },
  );
});

test("a valid authority user replays their canonical draft without another insert", async () => {
  const seenTravelQueries: URL[] = [];

  await withFetchStub(
    async (input, init) => {
      const request = input instanceof Request ? input : new Request(input, init);
      const url = new URL(request.url);

      if (url.origin === "https://authority.example") {
        assert.equal(request.headers.get("authorization"), "Bearer valid-authority-token");
        return Response.json({ id: authorityUserId });
      }

      seenTravelQueries.push(url);
      assert.equal(request.method, "GET");
      assert.equal(request.headers.get("apikey"), "service-role-key");
      return Response.json([persistedRow]);
    },
    async () => {
      const response = await worker.fetch(bookingRequest(), travelEnv());
      const payload = await response.json() as { mode: string; booking: { bookingReference: string } };

      assert.equal(response.status, 200);
      assert.equal(payload.mode, "supabase_booking_idempotent_replay");
      assert.equal(payload.booking.bookingReference, persistedRow.booking_reference);
    },
  );

  assert.equal(seenTravelQueries.length, 1);
  assert.equal(seenTravelQueries[0].searchParams.get("user_id"), `eq.${authorityUserId}`);
  assert.equal(seenTravelQueries[0].searchParams.get("idempotency_key"), `eq.${idempotencyKey}`);
});

test("a concurrent duplicate returns the durable owner-scoped draft rather than creating another one", async () => {
  let travelReadCount = 0;
  let insertCount = 0;

  await withFetchStub(
    async (input, init) => {
      const request = input instanceof Request ? input : new Request(input, init);
      const url = new URL(request.url);

      if (url.origin === "https://authority.example") {
        return Response.json({ id: authorityUserId });
      }

      if (request.method === "GET") {
        travelReadCount += 1;
        assert.equal(url.searchParams.get("user_id"), `eq.${authorityUserId}`);
        assert.equal(url.searchParams.get("idempotency_key"), `eq.${idempotencyKey}`);
        return Response.json(travelReadCount === 1 ? [] : [persistedRow]);
      }

      insertCount += 1;
      assert.equal(url.searchParams.get("on_conflict"), "user_id,idempotency_key");
      assert.equal(request.headers.get("prefer"), "resolution=ignore-duplicates,return=representation");
      const body = await request.json() as { user_id: string; idempotency_key: string };
      assert.equal(body.user_id, authorityUserId);
      assert.equal(body.idempotency_key, idempotencyKey);
      return Response.json([]);
    },
    async () => {
      const response = await worker.fetch(bookingRequest(), travelEnv());
      const payload = await response.json() as { mode: string; booking: { bookingReference: string } };

      assert.equal(response.status, 200);
      assert.equal(payload.mode, "supabase_booking_idempotent_replay");
      assert.equal(payload.booking.bookingReference, persistedRow.booking_reference);
    },
  );

  assert.equal(insertCount, 1);
  assert.equal(travelReadCount, 2);
});

test("owner-scoped booking reads pass only the verified authority user to Travel", async () => {
  let travelQuery: URL | undefined;

  await withFetchStub(
    async (input, init) => {
      const request = input instanceof Request ? input : new Request(input, init);
      const url = new URL(request.url);

      if (url.origin === "https://authority.example") {
        return Response.json({ id: secondAuthorityUserId });
      }

      travelQuery = url;
      return Response.json([]);
    },
    async () => {
      const response = await worker.fetch(
        new Request(`https://travel.example/api/travel/bookings?reference=${persistedRow.booking_reference}`, {
          headers: { authorization: "Bearer second-user-token" },
        }),
        travelEnv(),
      );

      assert.equal(response.status, 200);
      const payload = await response.json() as { persisted: boolean; bookings: unknown[] };
      assert.equal(payload.persisted, false);
      assert.deepEqual(payload.bookings, []);
    },
  );

  assert.ok(travelQuery);
  assert.equal(travelQuery.searchParams.get("booking_reference"), `eq.${persistedRow.booking_reference}`);
  assert.equal(travelQuery.searchParams.get("user_id"), `eq.${secondAuthorityUserId}`);
});

test("local trip history cannot bypass the confirmed draft gate", async () => {
  const client = await readFile(new URL("../src/main.tsx", import.meta.url), "utf8");

  assert.doesNotMatch(client, /href=\{trip\.checkoutUrl\}/);
  assert.match(client, /if \(!intent\?\.persisted\) \{/);
});

test("the migration accepts centralized identities without a local auth foreign key", async () => {
  const migration = await readFile(
    new URL("../supabase/migrations/20260713213159_travel_authenticated_booking_idempotency.sql", import.meta.url),
    "utf8",
  );

  assert.match(migration, /drop constraint if exists zivo_travel_booking_intents_user_id_fkey/i);
  assert.match(migration, /unique \(user_id, idempotency_key\)/i);
  assert.match(migration, /check \(user_id is not null\) not valid/i);
  assert.match(migration, /check \(idempotency_key is not null and idempotency_key ~ '\^\[A-Za-z0-9_-\]\{16,160\}\$'\) not valid/i);
  assert.match(migration, /revoke all on table public\.zivo_travel_booking_intents from anon, authenticated/i);
  assert.match(migration, /drop policy if exists zivo_travel_booking_intents_public_insert/i);
});
