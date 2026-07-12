// @ts-check
/**
 * ZIVO Travel — deterministic QA fixtures (v1).
 * No live provider inventory, no live Supabase, no live payments. Pure data used
 * by the offline booking/wallet-handoff/refund tests. Amounts are integer cents.
 *
 * Mirrors the Travel Supabase project (xbllvmpomorawkcrtbcq) shape at the
 * CONTRACT level only — it does NOT touch the live project. RLS on the real
 * tables is preserved (this file writes nothing).
 */

/** QA customer sourced from the Run 7 account set (id only; no secrets). */
export const QA_TRAVELER = Object.freeze({
  zivo_user_id: 'zivo_qa_travel_1',
  travel_user_id: 'trv_qa_1',
  display: 'QA Traveler',
});

/** A second, unrelated user for cross-user isolation tests. */
export const OTHER_USER = Object.freeze({
  zivo_user_id: 'zivo_other_2',
  travel_user_id: 'trv_other_2',
});

/** One deterministic property + rate plan + inventory. */
export const PROPERTY = Object.freeze({
  id: 'prop_snowbell',
  name: 'Snowbell Hotel',
  city: 'Phnom Penh',
  rating: 4,
  refundable: true,
});

export const RATE_PLAN = Object.freeze({
  id: 'rate_std',
  property_id: 'prop_snowbell',
  currency: 'USD',
  nightly_cents: 4500,
  refundable: true,
  // full refund if cancelled >= 48h before check-in; else partial 50%.
  cancel_policy: { full_before_hours: 48, partial_pct: 50 },
});

/**
 * Availability: date (YYYY-MM-DD) -> rooms left. Deterministic small window.
 * @type {Record<string, number>}
 */
export const INVENTORY = Object.freeze({
  '2026-08-01': 3,
  '2026-08-02': 3,
  '2026-08-03': 0, // sold out — used by the empty-results test
  '2026-08-04': 2,
});

/** A second property in a different city, to exercise city/price filters. */
export const PROPERTY_2 = Object.freeze({
  id: 'prop_riverside',
  name: 'Riverside Inn',
  city: 'Siem Reap',
  rating: 3,
  refundable: false,
});

export const RATE_PLAN_2 = Object.freeze({
  id: 'rate_nonref',
  property_id: 'prop_riverside',
  currency: 'USD',
  nightly_cents: 2800,
  refundable: false,
  cancel_policy: { full_before_hours: 0, partial_pct: 0 },
});

export const CATALOG = Object.freeze({
  properties: [PROPERTY, PROPERTY_2],
  ratePlans: { [RATE_PLAN.id]: RATE_PLAN, [RATE_PLAN_2.id]: RATE_PLAN_2 },
  ratePlanByProperty: { prop_snowbell: RATE_PLAN, prop_riverside: RATE_PLAN_2 },
  inventory: INVENTORY,
});

/** Fixed clock anchor (ms). Tests derive relative times from this. */
export const T0 = 1_754_000_000_000; // ~2025-08-01, arbitrary fixed epoch
export const HOUR = 3_600_000;
export const DAY = 24 * HOUR;
