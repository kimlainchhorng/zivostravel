/**
 * Support tickets can contain a customer's name, booking reference, and free
 * text. Keep them only in the current document's memory: the module is never
 * backed by browser persistence and identity transitions discard every entry.
 */
const maxSupportTickets = 12;

let activeOwnerId: string | null = null;
let sessionTickets: unknown[] = [];

function normalizeOwnerId(ownerId: string | null | undefined) {
  const normalized = ownerId?.trim() || "";
  return normalized || null;
}

/**
 * Identity changes are a hard privacy boundary. Anonymous preview drafts are
 * allowed in the current document, but are discarded as soon as an authority
 * user signs in, signs out, or changes.
 */
export function setSupportTicketSessionOwner(ownerId: string | null | undefined) {
  const nextOwnerId = normalizeOwnerId(ownerId);

  if (activeOwnerId !== nextOwnerId) {
    activeOwnerId = nextOwnerId;
    sessionTickets = [];
  }
}

/** Clear volatile ticket data on an explicit sign-out or session reset. */
export function clearSupportTicketSession() {
  activeOwnerId = null;
  sessionTickets = [];
}

export function readSessionSupportTickets<T>(): T[] {
  return sessionTickets as T[];
}

export function writeSessionSupportTickets<T>(tickets: readonly T[]) {
  sessionTickets = tickets.slice(0, maxSupportTickets) as unknown[];
}
