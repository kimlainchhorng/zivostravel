import assert from "node:assert/strict";
import { test } from "node:test";

import {
  createAuthenticatedBookingRequest,
  createBookingIdempotencyKey,
} from "../src/bookingRequest.ts";

test("booking request sends the central authority bearer proof and a server-valid idempotency key", async () => {
  const request = createAuthenticatedBookingRequest({
    url: "https://zivostravel.com/api/travel/bookings?type=flights&result=flight-angkor-direct",
    accessToken: "central-session-token",
    idempotencyKey: "zivo_travel_1234567890abcdef",
    body: {
      type: "flights",
      resultId: "flight-angkor-direct",
      traveler: { name: "Test Traveler" },
    },
  });

  assert.equal(request.method, "POST");
  assert.equal(request.headers.get("authorization"), "Bearer central-session-token");
  assert.equal(request.headers.get("idempotency-key"), "zivo_travel_1234567890abcdef");
  assert.equal(request.headers.get("content-type"), "application/json");
  assert.deepEqual(await request.json(), {
    type: "flights",
    resultId: "flight-angkor-direct",
    traveler: { name: "Test Traveler" },
  });
});

test("booking request refuses missing session proof or an invalid idempotency key", () => {
  assert.throws(
    () =>
      createAuthenticatedBookingRequest({
        url: "https://zivostravel.com/api/travel/bookings",
        accessToken: "",
        idempotencyKey: "zivo_travel_1234567890abcdef",
        body: {},
      }),
    /authenticated Zivos Media session/i,
  );

  assert.throws(
    () =>
      createAuthenticatedBookingRequest({
        url: "https://zivostravel.com/api/travel/bookings",
        accessToken: "central-session-token",
        idempotencyKey: "short",
        body: {},
      }),
    /idempotency key/i,
  );
});

test("generated booking idempotency keys are opaque and conform to the Worker contract", () => {
  const key = createBookingIdempotencyKey(() => "123e4567-e89b-12d3-a456-426614174000");
  assert.match(key, /^[A-Za-z0-9_-]{16,160}$/);
  assert.equal(key, "zivo_travel_123e4567e89b12d3a456426614174000");
});
