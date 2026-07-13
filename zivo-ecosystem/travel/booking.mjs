// @ts-check
/**
 * ZIVO Travel — Booking, Wallet Handoff, and Refund state machine (v1).
 *
 * Pure, deterministic, dependency-free (imports only the sibling contract
 * modules). Models the Travel↔Wallet flow at the CONTRACT level so it can be
 * proven offline. No live provider inventory, no live payments, no Supabase.
 *
 * Invariants (proven in booking.test.mjs):
 *  - Amount is ALWAYS server-calculated (nights × nightly), never client-supplied.
 *  - Payment state and booking state are SEPARATE.
 *  - Payment confirmed does NOT confirm a booking — provider confirmation does.
 *  - Duplicate provider callbacks never create a duplicate reservation.
 *  - A failed booking after a confirmed payment creates a refund obligation.
 *  - Partial vs full cancellation refunds follow the rate plan's cancel policy.
 *  - A booking is owned by one traveler; another user cannot read or cancel it.
 */

import { makeEvent } from '../events.mjs';
import { parseDeepLink, authorizeDeepLink } from '../deeplink.mjs';

/** @typedef {'pending'|'confirmed'|'failed'|'cancelled'} BookingState */
/** @typedef {'pending'|'confirmed'|'failed'|'refunded'} PaymentState */

// ------------------------------------------------------------------ search
/**
 * @param {import('./fixtures.mjs').CATALOG} catalog
 * @param {{city?: string, dates: string[], guests?: number, refundableOnly?: boolean, maxNightlyCents?: number}} q
 */
export function searchProperties(catalog, q) {
  return catalog.properties.filter((p) => {
    if (q.city && p.city.toLowerCase() !== q.city.toLowerCase()) return false;
    const plan = catalog.ratePlanByProperty[p.id];
    if (!plan) return false;
    if (q.refundableOnly && !plan.refundable) return false;
    if (q.maxNightlyCents != null && plan.nightly_cents > q.maxNightlyCents) return false;
    // availability: every requested date must have a room
    if (q.dates && q.dates.length) {
      const ok = q.dates.every((d) => (catalog.inventory[d] || 0) > 0);
      if (!ok) return false;
    }
    return true;
  });
}

// ------------------------------------------------------------------- quote
/**
 * Server-calculated quote. The amount is derived from server rate × nights and
 * can never be supplied by the client.
 * @param {import('./fixtures.mjs').CATALOG} catalog
 * @param {{propertyId: string, dates: string[], guests?: number}} req
 */
export function quote(catalog, req) {
  const plan = catalog.ratePlanByProperty[req.propertyId];
  if (!plan) throw new Error('no rate plan for property');
  const nights = req.dates.length;
  if (nights < 1) throw new Error('at least one night required');
  const amount_cents = plan.nightly_cents * nights;
  return {
    property_id: req.propertyId,
    rate_plan_id: plan.id,
    dates: req.dates.slice(),
    nights,
    currency: plan.currency,
    amount_cents,
    refundable: plan.refundable,
    cancel_policy: plan.cancel_policy,
  };
}

// -------------------------------------------------------------------- hold
/**
 * Create a temporary hold from a quote. Reserves the price for a TTL window.
 * @param {ReturnType<typeof quote>} q
 * @param {{travelerId: string, now: number, ttlMs: number}} opt
 */
export function createHold(q, opt) {
  return {
    hold_id: 'hold_' + q.property_id + '_' + opt.now,
    traveler_id: opt.travelerId,
    property_id: q.property_id,
    rate_plan_id: q.rate_plan_id,
    dates: q.dates.slice(),
    nights: q.nights,
    currency: q.currency,
    amount_cents: q.amount_cents,
    state: /** @type {'held'|'expired'} */ ('held'),
    created_at: opt.now,
    expires_at: opt.now + opt.ttlMs,
  };
}

/** @param {ReturnType<typeof createHold>} hold @param {number} now */
export function isHoldExpired(hold, now) {
  return now >= hold.expires_at;
}

/**
 * Re-price a hold against the current catalog. If the server rate changed, the
 * booking summary must reflect the NEW server amount (never the stale/held one).
 * @param {import('./fixtures.mjs').CATALOG} catalog
 * @param {ReturnType<typeof createHold>} hold
 */
export function recalculatePrice(catalog, hold) {
  const fresh = quote(catalog, { propertyId: hold.property_id, dates: hold.dates });
  return {
    changed: fresh.amount_cents !== hold.amount_cents,
    held_amount_cents: hold.amount_cents,
    current_amount_cents: fresh.amount_cents,
    // the summary amount is ALWAYS the current server amount
    summary_amount_cents: fresh.amount_cents,
    currency: fresh.currency,
  };
}

// ------------------------------------------------------- wallet handoff
/**
 * Build the Travel→Wallet payment handoff. Server amount only, obligation id,
 * deterministic idempotency key, correlation id, and a SAFE (read-only) return
 * link that cannot auto-pay. The wallet finalizes payment provider-side; this
 * only hands off an obligation for the user to confirm.
 * @param {ReturnType<typeof createHold>} hold
 * @param {{now: number}} opt
 */
export function buildWalletHandoff(hold, opt) {
  if (hold.state !== 'held') throw new Error('cannot hand off an unheld hold');
  const obligation_id = 'obl_' + hold.hold_id;
  const correlation_id = 'flow_travel_' + hold.hold_id;
  const idempotency_key = 'travel-pay:' + obligation_id; // deterministic + stable
  // Safe return link: a read-only booking view (validated against the allowlist).
  const return_path = '/bookings/' + hold.hold_id;
  const parsed = parseDeepLink('travel', return_path);
  const safe = parsed.class === 'read-entity' &&
    authorizeDeepLink(parsed, { authenticated: true, ownsEntity: true });
  if (!safe) throw new Error('return link failed the safe-link check');
  return {
    obligation_id,
    amount_cents: hold.amount_cents, // server-calculated, from the hold
    currency: hold.currency,
    idempotency_key,
    correlation_id,
    return_link: 'travel:' + return_path,
    // the wallet must NOT auto-submit; the user confirms in-wallet
    auto_submit: false,
  };
}

// ------------------------------------------------------- booking lifecycle
/**
 * Open a booking in the PENDING/PENDING state after a handoff is created.
 * @param {ReturnType<typeof createHold>} hold
 * @param {ReturnType<typeof buildWalletHandoff>} handoff
 */
export function openBooking(hold, handoff) {
  return {
    booking_id: 'bkg_' + hold.hold_id,
    traveler_id: hold.traveler_id,
    obligation_id: handoff.obligation_id,
    correlation_id: handoff.correlation_id,
    amount_cents: handoff.amount_cents,
    currency: handoff.currency,
    booking_state: /** @type {BookingState} */ ('pending'),
    payment_state: /** @type {PaymentState} */ ('pending'),
    reservation_id: /** @type {string|null} */ (null),
    refund_obligation: /** @type {null | {id: string, amount_cents: number, reason: string}} */ (null),
    processed_callbacks: /** @type {string[]} */ ([]),
  };
}

/**
 * Wallet reports payment confirmed. This ONLY moves payment_state — the booking
 * stays pending until the provider confirms it (task 6).
 * @param {ReturnType<typeof openBooking>} b
 */
export function applyPaymentConfirmed(b) {
  if (b.payment_state === 'confirmed') return b; // idempotent
  return { ...b, payment_state: /** @type {PaymentState} */ ('confirmed') };
}

/**
 * Provider (inventory) confirmation. Confirms the booking and assigns a
 * deterministic reservation id — ONLY if payment is confirmed. Idempotent.
 * @param {ReturnType<typeof openBooking>} b
 * @param {string} providerRef
 */
export function applyProviderConfirmation(b, providerRef) {
  if (b.payment_state !== 'confirmed') {
    throw new Error('cannot confirm booking before payment is confirmed');
  }
  if (b.booking_state === 'confirmed') return b; // idempotent — no new reservation
  return {
    ...b,
    booking_state: /** @type {BookingState} */ ('confirmed'),
    reservation_id: 'rsv_' + b.booking_id + '_' + providerRef,
  };
}

/**
 * Idempotent provider callback handler. A duplicate callback id is ignored, so
 * two identical callbacks can never create two reservations (task 7).
 * @param {ReturnType<typeof openBooking>} b
 * @param {{callback_id: string, kind: 'payment_confirmed'|'provider_confirmed', providerRef?: string}} cb
 */
export function handleCallback(b, cb) {
  if (b.processed_callbacks.includes(cb.callback_id)) {
    return { booking: b, applied: false, reason: 'duplicate callback ignored' };
  }
  let next = { ...b, processed_callbacks: [...b.processed_callbacks, cb.callback_id] };
  if (cb.kind === 'payment_confirmed') next = applyPaymentConfirmed(next);
  else if (cb.kind === 'provider_confirmed') next = applyProviderConfirmation(next, cb.providerRef || 'PRV');
  return { booking: next, applied: true, reason: 'applied' };
}

/**
 * Booking cannot be fulfilled after payment was taken → mark failed AND create a
 * refund obligation for the full amount (task 8).
 * @param {ReturnType<typeof openBooking>} b
 * @param {string} reason
 */
export function failBookingAfterPayment(b, reason) {
  if (b.payment_state !== 'confirmed') throw new Error('no payment to refund');
  return {
    ...b,
    booking_state: /** @type {BookingState} */ ('failed'),
    refund_obligation: { id: 'refobl_' + b.booking_id, amount_cents: b.amount_cents, reason },
  };
}

// --------------------------------------------------------- cancellation
/**
 * Cancel a confirmed booking and compute the refund per the rate plan policy.
 * Full refund if cancelling >= full_before_hours before check-in; else partial.
 * @param {ReturnType<typeof openBooking>} b
 * @param {{cancel_policy: {full_before_hours: number, partial_pct: number}}} plan
 * @param {{hoursBeforeCheckIn: number}} ctx
 */
export function cancelBooking(b, plan, ctx) {
  if (b.booking_state !== 'confirmed') throw new Error('only confirmed bookings can be cancelled');
  const full = ctx.hoursBeforeCheckIn >= plan.cancel_policy.full_before_hours;
  const refund_cents = full
    ? b.amount_cents
    : Math.round(b.amount_cents * (plan.cancel_policy.partial_pct / 100));
  return {
    booking: {
      ...b,
      booking_state: /** @type {BookingState} */ ('cancelled'),
      payment_state: /** @type {PaymentState} */ ('refunded'),
      refund_obligation: { id: 'refobl_' + b.booking_id, amount_cents: refund_cents, reason: full ? 'full_cancellation' : 'partial_cancellation' },
    },
    refund: { type: full ? 'full' : 'partial', amount_cents: refund_cents, currency: b.currency },
  };
}

// ------------------------------------------------------- auth / ownership
/**
 * Authenticate a Travel request. A request MUST carry a server-validated session
 * (e.g. Supabase getUser()) whose user is authenticated. Returns the traveler id;
 * throws 401 otherwise. Email is never treated as an identity.
 * @param {{ authenticated?: boolean, traveler_id?: string } | null | undefined} session
 * @returns {string}
 */
export function authenticateRequest(session) {
  if (!session || session.authenticated !== true || !session.traveler_id) {
    const err = new Error('authentication required');
    /** @type {any} */ (err).status = 401;
    throw err;
  }
  return session.traveler_id;
}

/**
 * Cross-user guard: only the owning traveler may read/act on a booking (task 11).
 * @param {{traveler_id: string}} b @param {string} userId
 */
export function assertOwner(b, userId) {
  if (b.traveler_id !== userId) throw new Error('cross-user access denied');
  return true;
}

/**
 * Reservation-ownership guard: a reservation exists only after the booking is
 * confirmed, and may be read/acted on only by its owning traveler.
 * @param {{traveler_id: string, reservation_id: string|null}} b @param {string} userId
 */
export function assertReservationOwner(b, userId) {
  if (!b.reservation_id) throw new Error('no reservation to own');
  return assertOwner(b, userId);
}

/**
 * Emit a SAFE, correlated ecosystem event for a booking transition.
 * @param {ReturnType<typeof openBooking>} b @param {string} type @param {string} occurred_at
 */
export function bookingEvent(b, type, occurred_at) {
  return makeEvent({
    event_id: 'evt_' + b.booking_id + '_' + type,
    event_type: type, // e.g. 'booking.confirmed' | 'refund.obligation.created'
    occurred_at,
    producer: 'travel',
    subject_type: 'travel_booking',
    subject_id: b.booking_id,
    actor_id: b.traveler_id,
    tenant_id: null,
    correlation_id: b.correlation_id,
    causation_id: null,
    safe_metadata: { booking_state: b.booking_state, payment_state: b.payment_state, currency: b.currency },
  });
}
