const idempotencyKeyPattern = /^[A-Za-z0-9_-]{16,160}$/;

export type BookingDraftRequestInput = {
  url: string;
  accessToken: string;
  idempotencyKey: string;
  body: Record<string, unknown>;
};

/**
 * Generate an opaque, server-valid idempotency key.  A timestamp fallback would
 * make keys predictable, so callers fail closed when Web Crypto is unavailable.
 */
export function createBookingIdempotencyKey(
  randomUUID: (() => string) | undefined =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? () => crypto.randomUUID()
      : undefined,
): string {
  if (!randomUUID) {
    throw new Error("Secure random idempotency keys are unavailable");
  }

  const entropy = randomUUID().replace(/-/g, "");
  const key = `zivo_travel_${entropy}`;

  if (!idempotencyKeyPattern.test(key)) {
    throw new Error("Could not create a valid booking idempotency key");
  }

  return key;
}

/**
 * This is the only browser-side construction path for a persisted booking
 * draft.  The Worker verifies the bearer token with the central authority and
 * rejects missing or malformed idempotency keys before it can touch Travel
 * persistence.
 */
export function createAuthenticatedBookingRequest({
  url,
  accessToken,
  idempotencyKey,
  body,
}: BookingDraftRequestInput): Request {
  const token = accessToken.trim();

  if (!token || /\s/.test(token)) {
    throw new Error("An authenticated Zivos Media session is required");
  }

  if (!idempotencyKeyPattern.test(idempotencyKey)) {
    throw new Error("A valid booking idempotency key is required");
  }

  return new Request(url, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
      "idempotency-key": idempotencyKey,
    },
    body: JSON.stringify(body),
  });
}
