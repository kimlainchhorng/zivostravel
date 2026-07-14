const idempotencyKeyPattern = /^[A-Za-z0-9_-]{16,160}$/;
const randomUuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type BookingDraftRequestInput = {
  url: string;
  accessToken: string;
  idempotencyKey: string;
  body: Record<string, unknown>;
};

/**
 * Generate an opaque retry token. A timestamp fallback would be predictable,
 * so booking persistence fails closed when Web Crypto is unavailable.
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

  const uuid = randomUUID();

  if (!randomUuidPattern.test(uuid)) {
    throw new Error("Could not create a secure idempotency key");
  }

  const entropy = uuid.replace(/-/g, "");
  const key = `zivo_travel_${entropy}`;

  if (!idempotencyKeyPattern.test(key)) {
    throw new Error("Could not create a valid booking idempotency key");
  }

  return key;
}

/**
 * The only client path for a persisted booking draft. It carries the central
 * identity bearer proof and the stable retry token, neither of which appears
 * in the URL or the booking payload.
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
