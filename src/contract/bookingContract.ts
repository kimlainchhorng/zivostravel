/**
 * Zivo Travel — Bus booking shared contract (v1), executable form.
 *
 * The canonical spec is docs/ZIVO_TRAVEL_BUS_CONTRACT_V1.md (mirrored in the zivosmedia
 * repo). This module is the pure, dependency-free validator used at every API boundary in
 * the Travel Worker and SPA. It has NO imports so it can run in the Worker, the browser,
 * and a Node/tsx test unchanged.
 *
 * Ownership reminder: the authoritative booking + payment record is owned by Zivosmedia.
 * This validator guards the SHAPE of data crossing the bridge; it never confirms a booking
 * (only a verified server/provider event does) and never trusts a client-supplied amount.
 */

export const BOOKING_CONTRACT_VERSION = "1" as const;

export type ProductType = "bus" | "flight" | "hotel" | "rental_car";

// Authoritative bus booking lifecycle (zivosmedia bus_bookings.status).
export type BookingStatus = "hold" | "confirmed" | "cancelled";
// Authoritative bus payment lifecycle (zivosmedia bus_bookings.payment_status).
export type PaymentStatus =
  | "pending"
  | "authorized"
  | "captured"
  | "failed"
  | "refunded"
  | "voided";
// Travel-side booking-intent lifecycle (zivo_travel_booking_intents.status).
export type IntentStatus =
  | "draft"
  | "pending_checkout"
  | "checkout_handoff"
  | "paid"
  | "cancelled"
  | "expired";

export type CurrencyCode = "usd" | "khr" | "thb";
export type PaymentProvider = "stripe" | "paypal" | "aba_payway";

export const BOOKING_STATUSES: readonly BookingStatus[] = [
  "hold",
  "confirmed",
  "cancelled",
];
export const PAYMENT_STATUSES: readonly PaymentStatus[] = [
  "pending",
  "authorized",
  "captured",
  "failed",
  "refunded",
  "voided",
];
export const SUPPORTED_CURRENCIES: readonly CurrencyCode[] = ["usd", "khr", "thb"];

/** Stable error codes shared by both boundaries (see contract §6). */
export const ERROR_CODES = {
  authenticationRequired: "authentication_required",
  invalidAuthoritySession: "invalid_authority_session",
  validIdempotencyKeyRequired: "valid_idempotency_key_required",
  bookingAuthorityNotConfigured: "booking_authority_not_configured",
  identityAuthorityNotConfigured: "identity_authority_not_configured",
  forbiddenNotOwner: "forbidden_not_owner",
  bookingNotFound: "booking_not_found",
  invalidBookingPayload: "invalid_booking_payload",
  invalidStateTransition: "invalid_state_transition",
  seatTaken: "seat_taken",
  invalidSeats: "invalid_seats",
  duplicateSeats: "duplicate_seats",
  amountTooLow: "amount_too_low",
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

// ── Formats ───────────────────────────────────────────────────────────────────────────
export const AUTHORITY_REFERENCE_RE = /^ZB[0-9A-F]{6}$/; // zivosmedia bus_bookings.booking_ref
export const TRAVEL_REFERENCE_RE = /^ztb_[a-f0-9]{12}$/; // travel booking-intent reference
export const IDEMPOTENCY_KEY_RE = /^[A-Za-z0-9_-]{16,160}$/;
export const SEAT_RE = /^[1-9][0-9]*[A-D]$/;
export const STRIPE_MIN_CHARGE_CENTS = 50;
export const MAX_SEATS_PER_BOOKING = 6;

export function isAuthorityReference(ref: unknown): ref is string {
  return typeof ref === "string" && AUTHORITY_REFERENCE_RE.test(ref);
}
export function isTravelReference(ref: unknown): ref is string {
  return typeof ref === "string" && TRAVEL_REFERENCE_RE.test(ref);
}
export function isBookingReference(ref: unknown): ref is string {
  return isAuthorityReference(ref) || isTravelReference(ref);
}
export function isValidIdempotencyKey(key: unknown): key is string {
  return typeof key === "string" && IDEMPOTENCY_KEY_RE.test(key);
}
export function isValidSeat(seat: unknown): seat is string {
  return typeof seat === "string" && SEAT_RE.test(seat);
}

// ── Amount integrity ──────────────────────────────────────────────────────────────────
export interface AmountBreakdown {
  subtotalCents: number;
  feeCents: number;
  taxCents: number;
  discountCents: number;
  totalCents: number;
}

function isNonNegativeInt(n: unknown): n is number {
  return typeof n === "number" && Number.isInteger(n) && n >= 0;
}

/**
 * Authoritative total = max(0, subtotal + fee + tax - discount). Never trust a
 * client-supplied total; recompute it. Returns null if any component is invalid.
 */
export function computeTotalCents(input: {
  subtotalCents: number;
  feeCents?: number;
  taxCents?: number;
  discountCents?: number;
}): number | null {
  const { subtotalCents } = input;
  const feeCents = input.feeCents ?? 0;
  const taxCents = input.taxCents ?? 0;
  const discountCents = input.discountCents ?? 0;
  if (
    !isNonNegativeInt(subtotalCents) ||
    !isNonNegativeInt(feeCents) ||
    !isNonNegativeInt(taxCents) ||
    !isNonNegativeInt(discountCents)
  ) {
    return null;
  }
  return Math.max(0, subtotalCents + feeCents + taxCents - discountCents);
}

/** A payable amount must be a finite, non-negative integer >= Stripe's minimum. */
export function isChargeableAmount(totalCents: unknown): totalCents is number {
  return (
    typeof totalCents === "number" &&
    Number.isInteger(totalCents) &&
    totalCents >= STRIPE_MIN_CHARGE_CENTS
  );
}

// ── State machines ────────────────────────────────────────────────────────────────────
const BOOKING_TRANSITIONS: Record<BookingStatus, readonly BookingStatus[]> = {
  hold: ["confirmed", "cancelled"],
  confirmed: ["cancelled"],
  cancelled: [],
};

const PAYMENT_TRANSITIONS: Record<PaymentStatus, readonly PaymentStatus[]> = {
  pending: ["authorized", "failed"],
  authorized: ["captured", "voided", "failed"],
  captured: ["refunded"],
  failed: [],
  refunded: [],
  voided: [],
};

/** Allowed booking-status transition (idempotent self-transition counts as allowed). */
export function canTransitionBooking(from: BookingStatus, to: BookingStatus): boolean {
  if (from === to) return true;
  return BOOKING_TRANSITIONS[from]?.includes(to) ?? false;
}

/** Allowed payment-status transition (idempotent self-transition counts as allowed). */
export function canTransitionPayment(from: PaymentStatus, to: PaymentStatus): boolean {
  if (from === to) return true;
  return PAYMENT_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * The customer-facing rule the SPA must obey: a booking is only "Confirmed" when the
 * authority reports status='confirmed'. A merely-persisted travel intent is a Draft, never
 * a confirmation (prevents optimistic-success mislabeling).
 */
export function customerBookingLabel(input: {
  authorityStatus?: BookingStatus | null;
  intentPersisted?: boolean;
}): "Confirmed" | "Cancelled" | "Draft" | "Resume" {
  if (input.authorityStatus === "confirmed") return "Confirmed";
  if (input.authorityStatus === "cancelled") return "Cancelled";
  if (input.intentPersisted) return "Draft";
  return "Resume";
}

// ── Contract payload validation ───────────────────────────────────────────────────────
export interface Passenger {
  name: string;
  phone?: string | null;
  seat?: string | null;
}

export interface BusBookingContract {
  version: string;
  correlationId: string;
  bookingReference: string;
  userId: string | null;
  productType: ProductType;
  itinerary: {
    origin: string;
    destination: string;
    departDate: string;
    departTime?: string;
    arriveTime?: string | null;
    operator?: string;
    seats: string[];
  };
  passengers: Passenger[];
  passengerCount: number;
  amount: AmountBreakdown;
  currency: CurrencyCode;
  bookingStatus: BookingStatus;
  paymentStatus: PaymentStatus;
  paymentProvider: PaymentProvider;
  idempotencyKey: string;
  checkoutSuccessUrl: string;
  checkoutCancelUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface ValidationResult<T> {
  ok: boolean;
  value?: T;
  errors: string[];
}

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isNonEmptyString(v: unknown, max = 10_000): v is string {
  return typeof v === "string" && v.trim().length > 0 && v.length <= max;
}

/**
 * Validate a bus booking contract payload. Returns every problem found (not just the
 * first) so a boundary can reject with a precise reason. This is intentionally strict:
 * unexpected/malformed data is rejected, per the contract.
 */
export function validateBusBookingContract(
  input: unknown,
): ValidationResult<BusBookingContract> {
  const errors: string[] = [];
  const o = (input ?? {}) as Record<string, unknown>;

  if (o.version !== BOOKING_CONTRACT_VERSION) {
    errors.push(`version must be "${BOOKING_CONTRACT_VERSION}"`);
  }
  if (!isNonEmptyString(o.correlationId, 200)) errors.push("correlationId required");
  if (!isBookingReference(o.bookingReference)) errors.push("bookingReference malformed");
  if (!(o.userId === null || isNonEmptyString(o.userId, 200))) {
    errors.push("userId must be a UUID string or null");
  }
  if (o.productType !== "bus") errors.push('productType must be "bus" for this contract');

  const itinerary = (o.itinerary ?? {}) as Record<string, unknown>;
  if (!isNonEmptyString(itinerary.origin, 120)) errors.push("itinerary.origin required");
  if (!isNonEmptyString(itinerary.destination, 120)) {
    errors.push("itinerary.destination required");
  }
  if (typeof itinerary.departDate !== "string" || !ISO_DATE_RE.test(itinerary.departDate)) {
    errors.push("itinerary.departDate must be YYYY-MM-DD");
  }
  const seats = Array.isArray(itinerary.seats) ? itinerary.seats : null;
  if (!seats || seats.length === 0 || seats.length > MAX_SEATS_PER_BOOKING) {
    errors.push(`itinerary.seats must be 1..${MAX_SEATS_PER_BOOKING}`);
  } else {
    if (!seats.every(isValidSeat)) errors.push("itinerary.seats has an invalid seat code");
    if (new Set(seats).size !== seats.length) errors.push("itinerary.seats has duplicates");
  }

  const passengers = Array.isArray(o.passengers) ? o.passengers : null;
  const passengerCount = o.passengerCount;
  if (!passengers || passengers.length === 0) {
    errors.push("passengers must have at least one entry");
  } else if (!passengers.every((p) => isNonEmptyString((p as Passenger)?.name, 120))) {
    errors.push("each passenger needs a name");
  }
  if (
    typeof passengerCount !== "number" ||
    !Number.isInteger(passengerCount) ||
    passengerCount < 1 ||
    passengerCount > MAX_SEATS_PER_BOOKING
  ) {
    errors.push(`passengerCount must be 1..${MAX_SEATS_PER_BOOKING}`);
  } else if (passengers && passengers.length !== passengerCount) {
    errors.push("passengers length must equal passengerCount");
  }

  const amount = (o.amount ?? {}) as Record<string, unknown>;
  const recomputed = computeTotalCents({
    subtotalCents: amount.subtotalCents as number,
    feeCents: amount.feeCents as number,
    taxCents: amount.taxCents as number,
    discountCents: amount.discountCents as number,
  });
  if (recomputed === null) {
    errors.push("amount components must be non-negative integers");
  } else if (amount.totalCents !== recomputed) {
    errors.push(`amount.totalCents must equal ${recomputed} (server-recomputed)`);
  }

  if (!SUPPORTED_CURRENCIES.includes(o.currency as CurrencyCode)) {
    errors.push(`currency must be one of ${SUPPORTED_CURRENCIES.join(", ")}`);
  }
  if (!BOOKING_STATUSES.includes(o.bookingStatus as BookingStatus)) {
    errors.push("bookingStatus invalid");
  }
  if (!PAYMENT_STATUSES.includes(o.paymentStatus as PaymentStatus)) {
    errors.push("paymentStatus invalid");
  }
  if (o.paymentProvider !== "stripe") {
    errors.push('paymentProvider must be "stripe" for bus (v1)');
  }
  if (!isValidIdempotencyKey(o.idempotencyKey)) errors.push("idempotencyKey malformed");
  if (!isNonEmptyString(o.checkoutSuccessUrl)) errors.push("checkoutSuccessUrl required");
  if (!isNonEmptyString(o.checkoutCancelUrl)) errors.push("checkoutCancelUrl required");

  return errors.length === 0
    ? { ok: true, value: input as BusBookingContract, errors: [] }
    : { ok: false, errors };
}
