// @ts-check
/**
 * ZIVO Travel — offline booking / wallet-handoff / refund tests (v1).
 * Dependency-free node:test. Run:  node --test zivo-ecosystem/travel/*.test.mjs
 * No live inventory, no live payments, no Supabase. Proves the money-critical
 * booking state machine only. Live real-user journeys remain BLOCKED/PENDING.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  CATALOG, RATE_PLAN, QA_TRAVELER, OTHER_USER, T0, HOUR,
} from './fixtures.mjs';
import {
  searchProperties, quote, createHold, isHoldExpired, recalculatePrice,
  buildWalletHandoff, openBooking, applyPaymentConfirmed, applyProviderConfirmation,
  handleCallback, failBookingAfterPayment, cancelBooking, assertOwner, bookingEvent,
} from './booking.mjs';
import { validateEvent, isFinancialEvent } from '../events.mjs';
import { UX_STATES, UX_STATE_COPY } from '../ux-terms.mjs';

const DATES = ['2026-08-01', '2026-08-02']; // 2 nights, both available

function freshHold(now = T0) {
  const q = quote(CATALOG, { propertyId: 'prop_snowbell', dates: DATES });
  return createHold(q, { travelerId: QA_TRAVELER.zivo_user_id, now, ttlMs: 15 * 60_000 });
}
function confirmedBooking(now = T0) {
  const hold = freshHold(now);
  const handoff = buildWalletHandoff(hold, { now });
  let b = openBooking(hold, handoff);
  b = applyPaymentConfirmed(b);
  b = applyProviderConfirmation(b, 'PRV1');
  return b;
}

// ---------------------------------------------------------------- search
test('search: city + refundable + price + availability filters', () => {
  assert.deepEqual(searchProperties(CATALOG, { city: 'Phnom Penh', dates: DATES }).map((p) => p.id), ['prop_snowbell']);
  assert.deepEqual(searchProperties(CATALOG, { dates: DATES, refundableOnly: true }).map((p) => p.id), ['prop_snowbell']);
  assert.deepEqual(searchProperties(CATALOG, { dates: DATES, maxNightlyCents: 3000 }).map((p) => p.id), ['prop_riverside']);
  // sold-out date 2026-08-03 => no results (empty state)
  assert.equal(searchProperties(CATALOG, { dates: ['2026-08-03'] }).length, 0);
});

// ----------------------------------------------------------------- quote
test('quote: amount is server-calculated (nights × nightly), never client', () => {
  const q = quote(CATALOG, { propertyId: 'prop_snowbell', dates: DATES });
  assert.equal(q.amount_cents, RATE_PLAN.nightly_cents * 2);
  assert.equal(q.currency, 'USD');
  assert.equal(q.nights, 2);
});

// ------------------------------------------------------------------ hold
test('hold: created held, then expires after its TTL', () => {
  const hold = freshHold(T0);
  assert.equal(hold.state, 'held');
  assert.equal(isHoldExpired(hold, T0 + 10 * 60_000), false);
  assert.equal(isHoldExpired(hold, T0 + 16 * 60_000), true);
});

// ------------------------------------------------------ price recalculation
test('price recalculation: summary always reflects the current server amount', () => {
  const hold = freshHold(T0);
  const stale = { ...hold, amount_cents: hold.amount_cents + 1000 }; // simulate a stale higher held price
  const r = recalculatePrice(CATALOG, stale);
  assert.equal(r.changed, true);
  assert.equal(r.summary_amount_cents, RATE_PLAN.nightly_cents * 2, 'summary uses current server price');
  const same = recalculatePrice(CATALOG, hold);
  assert.equal(same.changed, false);
});

// ------------------------------------------------------- wallet handoff
test('wallet handoff: server amount, obligation id, deterministic idempotency, safe return link', () => {
  const hold = freshHold(T0);
  const h1 = buildWalletHandoff(hold, { now: T0 });
  const h2 = buildWalletHandoff(hold, { now: T0 });
  assert.ok(h1.obligation_id.startsWith('obl_'));
  assert.equal(h1.amount_cents, hold.amount_cents, 'amount comes from the server hold');
  assert.equal(h1.currency, 'USD');
  assert.equal(h1.idempotency_key, h2.idempotency_key, 'idempotency key is deterministic/stable');
  assert.ok(h1.correlation_id.startsWith('flow_travel_'));
  assert.equal(h1.auto_submit, false, 'wallet must not auto-submit');
  assert.match(h1.return_link, /^travel:\/bookings\//, 'safe read-only return link');
});

// -------------------------------------------- payment / booking separation
test('separation: payment confirmed does NOT confirm the booking', () => {
  const hold = freshHold(T0);
  let b = openBooking(hold, buildWalletHandoff(hold, { now: T0 }));
  assert.equal(b.payment_state, 'pending');
  assert.equal(b.booking_state, 'pending');
  b = applyPaymentConfirmed(b);
  assert.equal(b.payment_state, 'confirmed');
  assert.equal(b.booking_state, 'pending', 'booking stays pending until provider confirms');
});

test('separation: booking cannot confirm before payment; confirms only via provider', () => {
  const hold = freshHold(T0);
  const b0 = openBooking(hold, buildWalletHandoff(hold, { now: T0 }));
  assert.throws(() => applyProviderConfirmation(b0, 'PRV'), /before payment/);
  const paid = applyPaymentConfirmed(b0);
  const confirmed = applyProviderConfirmation(paid, 'PRV');
  assert.equal(confirmed.booking_state, 'confirmed');
  assert.ok(confirmed.reservation_id);
});

// ------------------------------------------------------- duplicate callback
test('duplicate callback: same callback id never creates a second reservation', () => {
  const hold = freshHold(T0);
  let b = applyPaymentConfirmed(openBooking(hold, buildWalletHandoff(hold, { now: T0 })));
  const first = handleCallback(b, { callback_id: 'cb1', kind: 'provider_confirmed', providerRef: 'PRV' });
  assert.equal(first.applied, true);
  const rsv = first.booking.reservation_id;
  const dup = handleCallback(first.booking, { callback_id: 'cb1', kind: 'provider_confirmed', providerRef: 'PRV' });
  assert.equal(dup.applied, false, 'duplicate ignored');
  assert.equal(dup.booking.reservation_id, rsv, 'no new reservation');
  // even a DIFFERENT callback id is idempotent at the state level (already confirmed)
  const other = handleCallback(first.booking, { callback_id: 'cb2', kind: 'provider_confirmed', providerRef: 'PRV' });
  assert.equal(other.booking.reservation_id, rsv, 'still one reservation');
});

// ---------------------------------------- failed booking after payment
test('failed booking after payment creates a full refund obligation', () => {
  const hold = freshHold(T0);
  const paid = applyPaymentConfirmed(openBooking(hold, buildWalletHandoff(hold, { now: T0 })));
  const failed = failBookingAfterPayment(paid, 'inventory_gone');
  assert.equal(failed.booking_state, 'failed');
  assert.ok(failed.refund_obligation);
  assert.equal(failed.refund_obligation.amount_cents, paid.amount_cents, 'full refund');
  assert.throws(() => failBookingAfterPayment(openBooking(hold, buildWalletHandoff(hold, { now: T0 })), 'x'), /no payment/);
});

// ------------------------------------------------------- cancellation/refund
test('cancellation: full refund >= policy window, partial (50%) inside it', () => {
  const b = confirmedBooking(T0);
  const full = cancelBooking(b, RATE_PLAN, { hoursBeforeCheckIn: 72 });
  assert.equal(full.refund.type, 'full');
  assert.equal(full.refund.amount_cents, b.amount_cents);
  assert.equal(full.booking.booking_state, 'cancelled');
  assert.equal(full.booking.payment_state, 'refunded');

  const partial = cancelBooking(b, RATE_PLAN, { hoursBeforeCheckIn: 12 });
  assert.equal(partial.refund.type, 'partial');
  assert.equal(partial.refund.amount_cents, Math.round(b.amount_cents * 0.5));
});

// ------------------------------------------------------------ cross-user
test('cross-user: only the owning traveler may act on a booking', () => {
  const b = confirmedBooking(T0);
  assert.equal(assertOwner(b, QA_TRAVELER.zivo_user_id), true);
  assert.throws(() => assertOwner(b, OTHER_USER.zivo_user_id), /cross-user access denied/);
});

// -------------------------------------------------------------- events
test('events: refund obligation emits a valid, correlated financial event', () => {
  const paid = applyPaymentConfirmed(openBooking(freshHold(T0), buildWalletHandoff(freshHold(T0), { now: T0 })));
  const failed = failBookingAfterPayment(paid, 'inventory_gone');
  const ev = bookingEvent(failed, 'refund.obligation.created', '2026-08-01T00:00:00Z');
  assert.ok(isFinancialEvent(ev.event_type));
  assert.equal(validateEvent(ev).length, 0, 'financial event carries correlation_id + event_id');
});

// ------------------------------------------------------------ UX states
test('ux: loading/empty/error/offline states exist with EN/KM copy', () => {
  for (const s of ['loading', 'empty', 'error', 'offline']) {
    assert.ok(UX_STATES.includes(s), `UX_STATES includes ${s}`);
    assert.ok(UX_STATE_COPY[s].en && UX_STATE_COPY[s].km, `${s} has EN + KM`);
  }
});
