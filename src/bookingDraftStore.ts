/**
 * Booking draft details can include payment links, totals, booking references,
 * and traveler information. Keep those details only in this document's memory:
 * never serialise them to localStorage, sessionStorage, IndexedDB, or a URL.
 *
 * The store is deliberately scoped to the current authority user and expires
 * quickly. A user/session boundary clears all entries, so a shared device
 * cannot show one person's in-tab draft to the next signed-in person.
 */
export const bookingDraftLifetimeMs = 15 * 60 * 1000;

const maxBookingDrafts = 12;

type ScopedBookingDraft = {
  ownerId: string;
  expiresAt: number;
  value: unknown;
};

let activeOwnerId: string | null = null;
let scopedDrafts: ScopedBookingDraft[] = [];
let expiryTimer: number | undefined;

function normalizeOwnerId(ownerId: string | null | undefined) {
  const normalized = ownerId?.trim() || "";
  return normalized || null;
}

function purgeExpiredBookingDrafts(now: number) {
  scopedDrafts = scopedDrafts.filter((draft) => draft.expiresAt > now);
}

function clearExpiryTimer() {
  if (expiryTimer !== undefined && typeof window !== "undefined") {
    window.clearTimeout(expiryTimer);
  }

  expiryTimer = undefined;
}

/** Remove expired data even if no view happens to read it at the deadline. */
function scheduleExpiryPurge() {
  clearExpiryTimer();

  if (typeof window === "undefined" || !activeOwnerId || scopedDrafts.length === 0) {
    return;
  }

  const nextExpiry = Math.min(...scopedDrafts.map((draft) => draft.expiresAt));
  expiryTimer = window.setTimeout(() => {
    expiryTimer = undefined;
    purgeExpiredBookingDrafts(Date.now());
    scheduleExpiryPurge();
  }, Math.max(0, nextExpiry - Date.now()));
}

/**
 * Calling this on every authority identity transition is intentional. The
 * owner id is not a storage key: it only guards this page's in-memory records.
 */
export function setBookingDraftSessionOwner(ownerId: string | null | undefined) {
  const nextOwnerId = normalizeOwnerId(ownerId);

  if (activeOwnerId !== nextOwnerId) {
    activeOwnerId = nextOwnerId;
    scopedDrafts = [];
    clearExpiryTimer();
  }
}

/** Clear volatile draft data on explicit sign-out or any session reset. */
export function clearBookingDraftSession() {
  activeOwnerId = null;
  scopedDrafts = [];
  clearExpiryTimer();
}

export function readSessionBookingDrafts<T>(now = Date.now()): T[] {
  purgeExpiredBookingDrafts(now);
  scheduleExpiryPurge();

  if (!activeOwnerId) {
    return [];
  }

  return scopedDrafts
    .filter((draft) => draft.ownerId === activeOwnerId)
    .map((draft) => draft.value as T);
}

/**
 * Returns false when there is no authenticated authority owner. In that case
 * callers retain their React state, but no cross-route booking details exist.
 */
export function writeSessionBookingDrafts<T>(drafts: readonly T[], now = Date.now()) {
  purgeExpiredBookingDrafts(now);

  if (!activeOwnerId) {
    return false;
  }

  const expiresAt = now + bookingDraftLifetimeMs;
  scopedDrafts = drafts.slice(0, maxBookingDrafts).map((value) => ({
    ownerId: activeOwnerId as string,
    expiresAt,
    value,
  }));
  scheduleExpiryPurge();

  return true;
}
