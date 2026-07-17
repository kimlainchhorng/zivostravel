import assert from "node:assert/strict";
import test from "node:test";
import {
  BOOKING_CONTRACT_VERSION,
  canTransitionBooking,
  canTransitionPayment,
  computeTotalCents,
  customerBookingLabel,
  isAuthorityReference,
  isChargeableAmount,
  isTravelReference,
  isValidIdempotencyKey,
  isValidSeat,
  mapToAuthorityBookingStatus,
  validateBusBookingContract,
  type BusBookingContract,
} from "../src/contract/bookingContract";

// A valid, server-consistent contract payload used as the baseline for mutation tests.
function validContract(): BusBookingContract {
  return {
    version: BOOKING_CONTRACT_VERSION,
    correlationId: "11111111-1111-4111-8111-111111111111",
    bookingReference: "ZB1A2B3C",
    userId: "22222222-2222-4222-8222-222222222222",
    productType: "bus",
    itinerary: {
      origin: "Phnom Penh",
      destination: "Siem Reap",
      departDate: "2026-08-01",
      departTime: "07:30",
      arriveTime: "13:00",
      operator: "Giant Ibis",
      seats: ["3A", "3B"],
    },
    passengers: [
      { name: "Sok Dara", phone: "+855100000000", seat: "3A" },
      { name: "Chan Nary", phone: null, seat: "3B" },
    ],
    passengerCount: 2,
    amount: { subtotalCents: 3600, feeCents: 0, taxCents: 0, discountCents: 0, totalCents: 3600 },
    currency: "usd",
    bookingStatus: "hold",
    paymentStatus: "pending",
    paymentProvider: "stripe",
    idempotencyKey: "zivo_travel_1234567890abcdef",
    checkoutSuccessUrl: "https://zivostravel.com/booking/success?reference=ZB1A2B3C",
    checkoutCancelUrl: "https://zivostravel.com/booking/cancel?reference=ZB1A2B3C",
    createdAt: "2026-07-17T00:00:00.000Z",
    updatedAt: "2026-07-17T00:00:00.000Z",
  };
}

test("reference formats distinguish authority vs travel-intent references", () => {
  assert.ok(isAuthorityReference("ZB1A2B3C"));
  assert.ok(!isAuthorityReference("ZB1a2b3c")); // lowercase not allowed
  assert.ok(!isAuthorityReference("ztb_1234567890ab"));
  assert.ok(isTravelReference("ztb_1234567890ab"));
  assert.ok(!isTravelReference("ZB1A2B3C"));
});

test("idempotency key + seat validators enforce the contract patterns", () => {
  assert.ok(isValidIdempotencyKey("zivo_travel_1234567890abcdef"));
  assert.ok(!isValidIdempotencyKey("short"));
  assert.ok(!isValidIdempotencyKey("has spaces in it 0000000000"));
  assert.ok(isValidSeat("12A"));
  assert.ok(!isValidSeat("0A")); // row cannot start at 0
  assert.ok(!isValidSeat("1E")); // column must be A-D
});

test("computeTotalCents recomputes authoritatively and clamps at zero", () => {
  assert.equal(computeTotalCents({ subtotalCents: 3600, feeCents: 200, taxCents: 100 }), 3900);
  assert.equal(
    computeTotalCents({ subtotalCents: 1000, discountCents: 1500 }),
    0,
    "discount larger than subtotal clamps to 0, never negative",
  );
  assert.equal(computeTotalCents({ subtotalCents: -1 }), null, "negative rejected");
  assert.equal(computeTotalCents({ subtotalCents: 10.5 }), null, "non-integer rejected");
  assert.equal(computeTotalCents({ subtotalCents: NaN }), null, "NaN rejected");
});

test("isChargeableAmount enforces Stripe minimum + integer + non-negative", () => {
  assert.ok(isChargeableAmount(50));
  assert.ok(!isChargeableAmount(49));
  assert.ok(!isChargeableAmount(0));
  assert.ok(!isChargeableAmount(-100));
  assert.ok(!isChargeableAmount(100.5));
  assert.ok(!isChargeableAmount(Number.POSITIVE_INFINITY));
});

test("booking state machine allows only forward/cancel transitions", () => {
  assert.ok(canTransitionBooking("hold", "confirmed"));
  assert.ok(canTransitionBooking("hold", "cancelled"));
  assert.ok(canTransitionBooking("confirmed", "cancelled"));
  assert.ok(canTransitionBooking("hold", "hold"), "idempotent self-transition allowed");
  assert.ok(!canTransitionBooking("cancelled", "confirmed"), "no resurrection");
  assert.ok(!canTransitionBooking("confirmed", "hold"), "no backward");
});

test("payment state machine allows authorize→void and capture→refund, rejects skips", () => {
  assert.ok(canTransitionPayment("pending", "authorized"));
  assert.ok(canTransitionPayment("authorized", "captured"));
  assert.ok(canTransitionPayment("authorized", "voided"));
  assert.ok(canTransitionPayment("captured", "refunded"));
  assert.ok(!canTransitionPayment("pending", "captured"), "cannot skip authorize");
  assert.ok(!canTransitionPayment("refunded", "captured"), "terminal");
  assert.ok(!canTransitionPayment("captured", "voided"), "captured refunds, not voids");
});

test("mapToAuthorityBookingStatus only confirms on an explicit success signal", () => {
  assert.equal(mapToAuthorityBookingStatus("confirmed"), "confirmed");
  assert.equal(mapToAuthorityBookingStatus("paid"), "confirmed");
  assert.equal(mapToAuthorityBookingStatus("captured"), "confirmed");
  assert.equal(mapToAuthorityBookingStatus("cancelled"), "cancelled");
  assert.equal(mapToAuthorityBookingStatus("refunded"), "cancelled");
  assert.equal(mapToAuthorityBookingStatus("voided"), "cancelled");
  // The critical cases: a mere handoff/draft must NOT read as confirmed.
  assert.equal(mapToAuthorityBookingStatus("pending_checkout"), null);
  assert.equal(mapToAuthorityBookingStatus("checkout_handoff"), null);
  assert.equal(mapToAuthorityBookingStatus("hold"), null);
  assert.equal(mapToAuthorityBookingStatus(""), null);
  assert.equal(mapToAuthorityBookingStatus(null), null);
  assert.equal(mapToAuthorityBookingStatus(undefined), null);
});

test("customerBookingLabel never shows optimistic success", () => {
  assert.equal(customerBookingLabel({ authorityStatus: "confirmed" }), "Confirmed");
  assert.equal(customerBookingLabel({ authorityStatus: "cancelled" }), "Cancelled");
  assert.equal(
    customerBookingLabel({ intentPersisted: true }),
    "Draft",
    "a merely-persisted intent is a Draft, not Confirmed",
  );
  assert.equal(customerBookingLabel({ intentPersisted: false }), "Resume");
  assert.equal(
    customerBookingLabel({ authorityStatus: null, intentPersisted: true }),
    "Draft",
    "null authority status + persisted => Draft, never Confirmed",
  );
});

test("validateBusBookingContract accepts a well-formed payload", () => {
  const res = validateBusBookingContract(validContract());
  assert.deepEqual(res.errors, []);
  assert.ok(res.ok);
});

test("validateBusBookingContract rejects a client-tampered total", () => {
  const bad = validContract();
  bad.amount.totalCents = 1; // attacker lowers the price
  const res = validateBusBookingContract(bad);
  assert.ok(!res.ok);
  assert.ok(res.errors.some((e) => e.includes("totalCents must equal 3600")));
});

test("validateBusBookingContract rejects malformed seats / passenger mismatch / bad enums", () => {
  const dupSeats = validContract();
  dupSeats.itinerary.seats = ["3A", "3A"];
  assert.ok(validateBusBookingContract(dupSeats).errors.some((e) => e.includes("duplicates")));

  const mismatch = validContract();
  mismatch.passengerCount = 3; // but only 2 passengers
  assert.ok(
    validateBusBookingContract(mismatch).errors.some((e) => e.includes("equal passengerCount")),
  );

  const badCurrency = validContract();
  (badCurrency as unknown as { currency: string }).currency = "eur";
  assert.ok(validateBusBookingContract(badCurrency).errors.some((e) => e.includes("currency")));

  const badVersion = validContract();
  (badVersion as unknown as { version: string }).version = "2";
  assert.ok(validateBusBookingContract(badVersion).errors.some((e) => e.includes("version")));

  const tooManySeats = validContract();
  tooManySeats.itinerary.seats = ["1A", "1B", "1C", "1D", "2A", "2B", "2C"];
  assert.ok(validateBusBookingContract(tooManySeats).errors.some((e) => e.includes("seats must be 1..6")));
});

test("validateBusBookingContract accepts a guest (null userId) but rejects a non-string userId", () => {
  const guest = validContract();
  guest.userId = null;
  assert.ok(validateBusBookingContract(guest).ok);

  const badUser = validContract();
  (badUser as unknown as { userId: number }).userId = 123;
  assert.ok(!validateBusBookingContract(badUser).ok);
});

test("validateBusBookingContract rejects a non-bus product and garbage input", () => {
  const flight = validContract();
  (flight as unknown as { productType: string }).productType = "flight";
  assert.ok(validateBusBookingContract(flight).errors.some((e) => e.includes('"bus"')));

  assert.ok(!validateBusBookingContract(null).ok);
  assert.ok(!validateBusBookingContract("nope").ok);
  assert.ok(!validateBusBookingContract(42).ok);
});
