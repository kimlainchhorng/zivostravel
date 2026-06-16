export interface Env {
  ASSETS: Fetcher;
  ZIVO_PLATFORM_ORIGIN: string;
  ZIVO_TRAVEL_SUPABASE_URL?: string;
  ZIVO_TRAVEL_SUPABASE_SERVICE_ROLE_KEY?: string;
  ZIVO_TRAVEL_SUPABASE_PUBLISHABLE_KEY?: string;
  ZIVO_AUTHORITY_SUPABASE_URL?: string;
  ZIVO_TRAVEL_ADMIN_TOKEN?: string;
}

const securityHeaders = {
  "x-content-type-options": "nosniff",
  "referrer-policy": "strict-origin-when-cross-origin",
  "permissions-policy": "camera=(), microphone=(), geolocation=()",
};

type SearchKind = "flights" | "hotels" | "cars" | "bus";
type TravelerDetails = {
  name: string;
  email: string;
  phone: string;
  preference: string;
};
type SupportTopic = "booking" | "payment" | "wallet" | "change";
type DealPackage = {
  id: string;
  title: string;
  body: string;
  price: number;
  save: string;
  highlight: string;
  services: SearchKind[];
  reviewKind: SearchKind;
  resultId: string;
};
type AdminQueueRow = {
  id: string;
  customer: string;
  product: string;
  route: string;
  status: string;
  risk: string;
  amount: string;
  lastUpdate: string;
};
type WalletSummary = {
  app: string;
  mode: string;
  persisted: boolean;
  reason?: string;
  currency: string;
  available: number;
  pending: number;
  rewards: number;
  methods: Array<{ id: string; label: string; detail: string; status: string }>;
  payouts: Array<{ id: string; label: string; amount: number; status: string; eta: string }>;
  links: {
    wallet: string;
    paymentMethods: string;
    payout: string;
    support: string;
  };
  checkedAt: string;
};
type DriverRequestPreview = {
  app: "zivo-travel";
  mode: "driver_request_preview";
  persisted: false;
  sourcePlatform: "zivo-travel";
  targetPlatform: "zivo-driver";
  travelBookingId: string;
  driverJobId: null;
  status: "pending_driver_request";
  customerStatus: "driver_request_ready";
  adminStatus: "visible_after_driver_job_creation";
  chatThreadId: null;
  paymentOrderId: null;
  payoutStatus: "not_eligible_until_completed";
  requestPayload: {
    travel_booking_id: string;
    source_platform: "zivo-travel";
    target_platform: "zivo-driver";
    pickup_address: string | null;
    dropoff_address: string | null;
    scheduled_for: string | null;
    service_type: string | null;
    traveler_count: number;
    notes: string;
  };
  nextSteps: string[];
  checkedAt: string;
};
type SupportTicketRow = Record<string, unknown> & {
  reference: string;
  status: string;
  topic: SupportTopic;
  priority: string;
  customer_name: string;
  customer_email: string | null;
  booking_reference: string | null;
  summary: string;
  chat_url: string;
  source_host: string;
  request_payload: Record<string, unknown>;
  metadata: Record<string, unknown>;
  created_at?: string;
};
type ResultTemplate = {
  id: string;
  title: string;
  provider: string;
  detail: string;
  time: string;
  duration: string;
  price: number;
  rating: string;
  tags: string[];
};

const travelServices: SearchKind[] = ["flights", "hotels", "cars", "bus"];
const routePaths: Record<SearchKind | "deals" | "review" | "checkout" | "wallet" | "paymentMethods" | "payout" | "support" | "authHandoff", string> = {
  flights: "/flights",
  hotels: "/hotels",
  cars: "/cars",
  bus: "/bus",
  deals: "/deals",
  review: "/booking/review",
  checkout: "/travel/checkout",
  wallet: "/wallet",
  paymentMethods: "/payment-methods",
  payout: "/wallet?tab=payouts",
  support: "/chat",
  authHandoff: "/auth/handoff",
};

const quoteDefaults: Record<SearchKind, { label: string; total: number }> = {
  flights: { label: "Phnom Penh to Siem Reap flight", total: 48 },
  hotels: { label: "Siem Reap hotel stay", total: 126 },
  cars: { label: "Siem Reap rental car", total: 84 },
  bus: { label: "Phnom Penh to Siem Reap bus", total: 18 },
};

const dealPackages: DealPackage[] = [
  {
    id: "angkor-flight-hotel",
    title: "Angkor weekend bundle",
    body: "Flight + hotel for a three-night Siem Reap escape with flexible change support.",
    price: 168,
    save: "Save $28",
    highlight: "Best starter trip",
    services: ["flights", "hotels"],
    reviewKind: "flights",
    resultId: "flight-angkor-direct",
  },
  {
    id: "city-stay-driver",
    title: "Stay + private driver",
    body: "Hotel, airport pickup, and a private day route for customers who want easy arrival.",
    price: 188,
    save: "Save $34",
    highlight: "Most comfortable",
    services: ["hotels", "cars"],
    reviewKind: "hotels",
    resultId: "hotel-temple-garden",
  },
  {
    id: "budget-bus-hotel",
    title: "Budget bus + hotel",
    body: "Reserved bus seat and smart hotel stay for travelers who want the lowest total.",
    price: 116,
    save: "Save $18",
    highlight: "Lowest price",
    services: ["bus", "hotels"],
    reviewKind: "bus",
    resultId: "bus-express",
  },
];

const resultCatalog: Record<SearchKind, ResultTemplate[]> = {
  flights: [
    { id: "flight-angkor-direct", title: "Morning direct", provider: "Zivo Air", detail: "PNH to REP", time: "08:15 AM", duration: "55 min", price: 48, rating: "Fastest", tags: ["Direct", "Carry-on included", "Mobile boarding"] },
    { id: "flight-flex-evening", title: "Flexible evening", provider: "Cambodia Sky", detail: "PNH to REP", time: "05:40 PM", duration: "1 hr 5 min", price: 56, rating: "Flexible", tags: ["Free change", "Seat choice", "Reward eligible"] },
    { id: "flight-value-midday", title: "Value midday", provider: "Mekong Wings", detail: "PNH to REP", time: "12:25 PM", duration: "1 hr", price: 44, rating: "Best value", tags: ["Low fare", "Light bag", "Instant confirm"] },
  ],
  hotels: [
    { id: "hotel-riverside-suite", title: "Riverside suite", provider: "Zivo Stays", detail: "Siem Reap center", time: "Jun 15 - Jun 18", duration: "3 nights", price: 126, rating: "4.8 guest score", tags: ["Breakfast", "Pool", "Pay later"] },
    { id: "hotel-temple-garden", title: "Temple garden hotel", provider: "Angkor Partner", detail: "Near night market", time: "Jun 15 - Jun 18", duration: "3 nights", price: 144, rating: "Guest favorite", tags: ["Airport pickup", "Spa", "Free cancel"] },
    { id: "hotel-city-light", title: "City light stay", provider: "Zivo Stays", detail: "Old French Quarter", time: "Jun 15 - Jun 18", duration: "3 nights", price: 98, rating: "Smart price", tags: ["Workspace", "Breakfast", "Rewards"] },
  ],
  cars: [
    { id: "car-compact", title: "Compact automatic", provider: "Zivo Rentals", detail: "Siem Reap downtown", time: "Jun 15, 10:00 AM", duration: "3 days", price: 84, rating: "Best value", tags: ["Unlimited km", "Insurance ready", "Easy pickup"] },
    { id: "car-suv", title: "Family SUV", provider: "Airport Cars", detail: "REP airport", time: "Jun 15, 11:00 AM", duration: "3 days", price: 138, rating: "Roomy", tags: ["5 seats", "Large bags", "Free cancel"] },
    { id: "car-driver", title: "Car with driver", provider: "Angkor Driver", detail: "Hotel pickup", time: "Jun 15, 09:00 AM", duration: "Full day", price: 62, rating: "Local guide", tags: ["Private", "Temple route", "Cashless"] },
  ],
  bus: [
    { id: "bus-express", title: "Express coach", provider: "Mekong Express", detail: "Phnom Penh to Siem Reap", time: "07:30 AM", duration: "5 hr 45 min", price: 18, rating: "Best seller", tags: ["AC", "Reserved seat", "Mobile ticket"] },
    { id: "bus-luxury", title: "Luxury minibus", provider: "Angkor VIP", detail: "Hotel area pickup", time: "09:00 AM", duration: "5 hr 20 min", price: 24, rating: "Comfort", tags: ["Wide seat", "Snack", "Fast route"] },
    { id: "bus-night", title: "Night sleeper", provider: "Zivo Bus", detail: "Central station", time: "11:30 PM", duration: "6 hr", price: 21, rating: "Overnight", tags: ["Sleeper", "USB", "Instant confirm"] },
  ],
};

const allowedApiOrigins = new Set([
  "https://zivostravel.com",
  "https://www.zivostravel.com",
  "https://zivosmedia.com",
  "https://www.zivosmedia.com",
]);

function platformOrigin(env: Env) {
  return (env.ZIVO_PLATFORM_ORIGIN || "https://zivosmedia.com").replace(/\/$/, "");
}

function readEnvSecret(value?: string) {
  return value?.trim() || "";
}

function travelSupabaseUrl(env: Env) {
  return readEnvSecret(env.ZIVO_TRAVEL_SUPABASE_URL).replace(/\/$/, "");
}

function privilegedSupabaseKey(env: Env) {
  return readEnvSecret(env.ZIVO_TRAVEL_SUPABASE_SERVICE_ROLE_KEY);
}

function writeSupabaseKey(env: Env) {
  return privilegedSupabaseKey(env) || readEnvSecret(env.ZIVO_TRAVEL_SUPABASE_PUBLISHABLE_KEY);
}

function adminApiToken(env: Env) {
  return readEnvSecret(env.ZIVO_TRAVEL_ADMIN_TOKEN);
}

// Constant-time compare so a wrong token can't be recovered by timing the
// response. Length is allowed to leak (token length is not the secret).
function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) {
    return false;
  }

  let mismatch = 0;
  for (let index = 0; index < a.length; index += 1) {
    mismatch |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }

  return mismatch === 0;
}

// Gate for service-role admin reads. Fails closed: if no admin token is
// configured, nothing matches, so privileged data is never served unauthenticated.
function isAuthorizedAdminRequest(request: Request, env: Env) {
  const expected = adminApiToken(env);

  if (!expected) {
    return false;
  }

  const header = (request.headers.get("authorization") || "").trim();
  const match = /^Bearer\s+(.+)$/i.exec(header);
  const presented = match ? match[1].trim() : "";

  return Boolean(presented) && timingSafeEqual(presented, expected);
}

function usesModernSupabaseKey(key: string) {
  return key.startsWith("sb_publishable_") || key.startsWith("sb_secret_");
}

function supabaseApiHeaders(key: string, headers: Record<string, string> = {}) {
  const nextHeaders: Record<string, string> = {
    apikey: key,
    ...headers,
  };

  if (!usesModernSupabaseKey(key)) {
    nextHeaders.authorization = `Bearer ${key}`;
  }

  return nextHeaders;
}

function normalizeSearchKind(value: string | null): SearchKind {
  if (value === "hotels" || value === "cars" || value === "bus") {
    return value;
  }

  return "flights";
}

function serviceType(kind: SearchKind) {
  if (kind === "flights") return "flight";
  if (kind === "hotels") return "hotel";
  if (kind === "cars") return "rental_car";
  return "bus";
}

function serviceName(kind: SearchKind) {
  if (kind === "flights") return "Flight";
  if (kind === "hotels") return "Hotel";
  if (kind === "cars") return "Rental car";
  return "Bus";
}

function normalizeSupportTopic(value: unknown): SupportTopic {
  if (value === "payment" || value === "wallet" || value === "change") {
    return value;
  }

  return "booking";
}

function supportPriority(topic: SupportTopic) {
  if (topic === "payment") return "Urgent";
  if (topic === "booking") return "Fast";
  return "Normal";
}

function findDeal(dealId?: string | null) {
  return dealPackages.find((deal) => deal.id === dealId) || null;
}

function cleanText(value: unknown, fallback = "", maxLength = 160) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) || fallback : fallback;
}

function cleanNullableText(value: unknown, maxLength = 160) {
  const textValue = cleanText(value, "", maxLength);
  return textValue || null;
}

function readBoundedInteger(requestUrl: URL, keys: string[], fallback: number, maxValue = 99) {
  const key = keys.find((candidate) => requestUrl.searchParams.has(candidate));
  const parsed = Number.parseInt(key ? requestUrl.searchParams.get(key) || "" : "", 10);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.max(1, Math.min(maxValue, parsed));
}

function readDateParam(requestUrl: URL, keys: string[]) {
  const key = keys.find((candidate) => requestUrl.searchParams.has(candidate));
  const value = key ? requestUrl.searchParams.get(key) : null;

  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

function searchParamText(requestUrl: URL, keys: string[], fallback?: string) {
  const key = keys.find((candidate) => requestUrl.searchParams.has(candidate));
  return cleanNullableText(key ? requestUrl.searchParams.get(key) : fallback);
}

function sanitizeTraveler(value: unknown): TravelerDetails | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const input = value as Record<string, unknown>;
  const name = cleanText(input.name, "Guest Traveler", 120);
  const email = cleanText(input.email, "", 180);
  const phone = cleanText(input.phone, "", 40);
  const preference = cleanText(input.preference, "Flexible timing", 180);

  return { name, email, phone, preference };
}

function travelerFromRow(row: Record<string, unknown>) {
  const payload = row.request_payload;

  if (!payload || typeof payload !== "object") {
    return undefined;
  }

  return sanitizeTraveler((payload as Record<string, unknown>).traveler);
}

function dealFromRow(row: Record<string, unknown>) {
  const payload = row.request_payload;

  if (!payload || typeof payload !== "object") {
    return undefined;
  }

  const deal = (payload as Record<string, unknown>).deal;

  return deal && typeof deal === "object" ? deal as DealPackage : undefined;
}

function createBookingReference() {
  return `ztb_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
}

function createSupportReference() {
  return `zts_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
}

function withBookingReference(rawUrl: string, bookingReference: string) {
  const url = new URL(rawUrl);
  url.searchParams.set("booking_reference", bookingReference);
  return url.toString();
}

function apiHeaders(request: Request) {
  const headers = new Headers({
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    vary: "Origin",
  });
  const origin = request.headers.get("origin");

  if (origin && allowedApiOrigins.has(origin)) {
    headers.set("access-control-allow-origin", origin);
    headers.set("access-control-allow-methods", "GET, POST, OPTIONS");
    headers.set("access-control-allow-headers", "content-type, authorization");
  }

  for (const [key, value] of Object.entries(securityHeaders)) {
    headers.set(key, value);
  }

  return headers;
}

function json(request: Request, payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: apiHeaders(request),
  });
}

function text(request: Request, body: string, contentType: string) {
  const headers = apiHeaders(request);
  headers.set("content-type", contentType);
  headers.set("cache-control", "public, max-age=3600");

  return new Response(body, { headers });
}

function buildHandoffUrl(requestUrl: URL, env: Env, kind: SearchKind) {
  const target = new URL(routePaths[kind], platformOrigin(env));

  if (kind === "hotels") {
    target.searchParams.set("city", requestUrl.searchParams.get("to") || requestUrl.searchParams.get("city") || "Siem Reap");
    target.searchParams.set("ci", requestUrl.searchParams.get("start") || requestUrl.searchParams.get("ci") || "2026-06-15");
    target.searchParams.set("co", requestUrl.searchParams.get("end") || requestUrl.searchParams.get("co") || "2026-06-18");
    target.searchParams.set("adults", requestUrl.searchParams.get("travelers") || requestUrl.searchParams.get("adults") || "1");
    return target.toString();
  }

  if (kind === "cars") {
    target.searchParams.set("city", requestUrl.searchParams.get("to") || requestUrl.searchParams.get("city") || "Siem Reap");
    target.searchParams.set("pickup_date", requestUrl.searchParams.get("start") || requestUrl.searchParams.get("pickup_date") || "2026-06-15");
    target.searchParams.set("return_date", requestUrl.searchParams.get("end") || requestUrl.searchParams.get("return_date") || "2026-06-18");
    return target.toString();
  }

  if (kind === "bus") {
    target.searchParams.set("from", requestUrl.searchParams.get("from") || "Phnom Penh");
    target.searchParams.set("to", requestUrl.searchParams.get("to") || "Siem Reap");
    target.searchParams.set("date", requestUrl.searchParams.get("start") || requestUrl.searchParams.get("date") || "2026-06-15");
    return target.toString();
  }

  target.searchParams.set("from", requestUrl.searchParams.get("from") || "Phnom Penh");
  target.searchParams.set("to", requestUrl.searchParams.get("to") || "Siem Reap");
  target.searchParams.set("start", requestUrl.searchParams.get("start") || "2026-06-15");
  target.searchParams.set("travelers", requestUrl.searchParams.get("travelers") || "1");

  const end = requestUrl.searchParams.get("end");
  if (end) {
    target.searchParams.set("end", end);
  }

  const tripType = requestUrl.searchParams.get("tripType");
  if (tripType) {
    target.searchParams.set("tripType", tripType);
  }

  return target.toString();
}

function resultLabel(kind: SearchKind) {
  if (kind === "hotels") return "Hotels in Siem Reap";
  if (kind === "cars") return "Rental cars in Siem Reap";
  if (kind === "bus") return "Buses from Phnom Penh to Siem Reap";
  return "Flights from Phnom Penh to Siem Reap";
}

function resultSummary(kind: SearchKind) {
  if (kind === "hotels") return "3 stays ready for Jun 15 - Jun 18, 2026";
  if (kind === "cars") return "3 rental options ready for pickup in Siem Reap";
  if (kind === "bus") return "3 bus departures ready for Jun 15, 2026";
  return "3 flight options ready for Jun 15, 2026";
}

function buildCheckoutUrl(requestUrl: URL, env: Env, kind: SearchKind, resultId?: string, dealId?: string) {
  const checkout = new URL(routePaths.checkout, platformOrigin(env));

  checkout.searchParams.set("product", kind);
  checkout.searchParams.set("from", requestUrl.searchParams.get("from") || "Phnom Penh");
  checkout.searchParams.set("to", requestUrl.searchParams.get("to") || "Siem Reap");
  checkout.searchParams.set("start", requestUrl.searchParams.get("start") || "2026-06-15");
  checkout.searchParams.set("end", requestUrl.searchParams.get("end") || "2026-06-18");
  checkout.searchParams.set("travelers", requestUrl.searchParams.get("travelers") || "1");

  if (resultId) {
    checkout.searchParams.set("result", resultId);
  }

  if (dealId) {
    checkout.searchParams.set("deal", dealId);
  }

  return checkout.toString();
}

function buildReviewUrl(requestUrl: URL, kind: SearchKind, resultId?: string, dealId?: string) {
  const review = new URL(routePaths.review, requestUrl.origin);

  review.searchParams.set("type", kind);
  review.searchParams.set("from", requestUrl.searchParams.get("from") || "Phnom Penh");
  review.searchParams.set("to", requestUrl.searchParams.get("to") || "Siem Reap");
  review.searchParams.set("start", requestUrl.searchParams.get("start") || "2026-06-15");
  review.searchParams.set("end", requestUrl.searchParams.get("end") || "2026-06-18");
  review.searchParams.set("travelers", requestUrl.searchParams.get("travelers") || "1");

  if (resultId) {
    review.searchParams.set("result", resultId);
  }

  if (dealId) {
    review.searchParams.set("deal", dealId);
  }

  return review.toString();
}

function buildQuote(requestUrl: URL, env: Env, kind: SearchKind) {
  const defaults = quoteDefaults[kind];
  const checkoutUrl = buildCheckoutUrl(requestUrl, env, kind);

  const auth = new URL(routePaths.authHandoff, platformOrigin(env));
  auth.searchParams.set("app", "zivo-travel");
  auth.searchParams.set("redirect", new URL(checkoutUrl).pathname + new URL(checkoutUrl).search);

  return {
    app: "zivo-travel",
    mode: "quote_bridge",
    product: kind,
    label: defaults.label,
    currency: "USD",
    total: defaults.total,
    provider: "zivosmedia",
    reviewUrl: buildReviewUrl(requestUrl, kind),
    checkoutUrl,
    paymentUrl: new URL(routePaths.paymentMethods, platformOrigin(env)).toString(),
    walletUrl: new URL(routePaths.wallet, platformOrigin(env)).toString(),
    payoutUrl: new URL(routePaths.payout, platformOrigin(env)).toString(),
    ssoUrl: auth.toString(),
    steps: [
      { label: "Search", status: "ready" },
      { label: "Review", status: "ready" },
      { label: "Sign in", status: "handoff" },
      { label: "Pay", status: "handoff" },
      { label: "Confirm", status: "handoff" },
    ],
    checkedAt: new Date().toISOString(),
  };
}

function buildSearchEventRow(requestUrl: URL, kind: SearchKind) {
  const from = searchParamText(requestUrl, ["from"], "Phnom Penh");
  const to = searchParamText(requestUrl, ["to", "city"], "Siem Reap");
  const city = searchParamText(requestUrl, ["city", "to"], to || "Siem Reap");
  const travelers = readBoundedInteger(requestUrl, ["travelers", "adults", "drivers", "passengers"], 1, 99);
  const rooms = kind === "hotels" ? readBoundedInteger(requestUrl, ["rooms"], Math.max(1, Math.ceil(travelers / 2)), 20) : null;

  return {
    session_id: searchParamText(requestUrl, ["session_id", "sessionId", "sid"], undefined),
    service_type: serviceType(kind),
    origin: kind === "hotels" || kind === "cars" ? null : from,
    destination: kind === "hotels" || kind === "cars" ? city : to,
    pickup: kind === "cars" ? searchParamText(requestUrl, ["pickup", "city", "from"], city || "Siem Reap") : null,
    dropoff: kind === "cars" ? searchParamText(requestUrl, ["dropoff", "city", "to"], city || "Siem Reap") : null,
    date_start: readDateParam(requestUrl, ["start", "date", "ci", "pickup_date"]),
    date_end: readDateParam(requestUrl, ["end", "co", "return_date"]),
    travelers,
    rooms,
    filters: {
      ...Object.fromEntries(requestUrl.searchParams),
      product: kind,
      bridge: "cloudflare_results",
    },
    source_host: requestUrl.host,
  };
}

async function persistSearchEvent(requestUrl: URL, env: Env, kind: SearchKind) {
  const supabaseUrl = travelSupabaseUrl(env);
  const writeKey = writeSupabaseKey(env);

  if (!supabaseUrl || !writeKey) {
    return {
      mode: "search_event_preview",
      persisted: false,
      reason: "missing_supabase_write_key",
    };
  }

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/zivo_travel_search_events`, {
      method: "POST",
      headers: supabaseApiHeaders(writeKey, {
        "content-type": "application/json",
        prefer: "return=minimal",
      }),
      body: JSON.stringify(buildSearchEventRow(requestUrl, kind)),
    });

    if (!response.ok) {
      return {
        mode: "search_event_preview",
        persisted: false,
        reason: "supabase_search_event_insert_failed",
        supabaseStatus: response.status,
      };
    }

    return {
      mode: "supabase_search_event",
      persisted: true,
    };
  } catch {
    return {
      mode: "search_event_preview",
      persisted: false,
      reason: "supabase_search_event_insert_error",
    };
  }
}

async function buildResults(requestUrl: URL, env: Env, kind: SearchKind) {
  const searchEvent = await persistSearchEvent(requestUrl, env, kind);

  return {
    app: "zivo-travel",
    mode: "cloudflare_results",
    product: kind,
    label: resultLabel(kind),
    summary: resultSummary(kind),
    currency: "USD",
    provider: "zivosmedia",
    results: resultCatalog[kind].map((result) => ({
      ...result,
      reviewUrl: buildReviewUrl(requestUrl, kind, result.id),
      checkoutUrl: buildCheckoutUrl(requestUrl, env, kind, result.id),
    })),
    searchEvent,
    checkedAt: new Date().toISOString(),
  };
}

function buildDeals(requestUrl: URL) {
  return {
    app: "zivo-travel",
    mode: "cloudflare_deals",
    currency: "USD",
    provider: "zivosmedia",
    deals: dealPackages.map((deal) => ({
      ...deal,
      reviewUrl: buildReviewUrl(requestUrl, deal.reviewKind, deal.resultId, deal.id),
    })),
    checkedAt: new Date().toISOString(),
  };
}

function buildWalletSummary(env: Env): WalletSummary {
  const origin = platformOrigin(env);
  const hasPrivateKey = Boolean(privilegedSupabaseKey(env));

  return {
    app: "zivo-travel",
    mode: hasPrivateKey ? "wallet_bridge_ready" : "wallet_preview",
    persisted: hasPrivateKey,
    reason: hasPrivateKey ? undefined : "missing_supabase_private_key",
    currency: "USD",
    available: 356.35,
    pending: 116,
    rewards: 42,
    methods: [
      { id: "card-primary", label: "Primary card", detail: "Visa ending 4242", status: "Ready" },
      { id: "wallet-balance", label: "Travel wallet", detail: "Use balance first", status: "Enabled" },
      { id: "cash", label: "Cash office", detail: "Counter collection", status: "Fallback" },
    ],
    payouts: [
      { id: "payout-weekly", label: "Weekly cash out", amount: 188, status: "Scheduled", eta: "Jun 10" },
      { id: "payout-booking", label: "Booking settlement", amount: 116, status: "Pending", eta: "After checkout" },
      { id: "payout-reward", label: "Reward credit", amount: 42, status: "Available", eta: "Now" },
    ],
    links: {
      wallet: new URL(routePaths.wallet, origin).toString(),
      paymentMethods: new URL(routePaths.paymentMethods, origin).toString(),
      payout: new URL(routePaths.payout, origin).toString(),
      support: new URL(routePaths.support, origin).toString(),
    },
    checkedAt: new Date().toISOString(),
  };
}

function buildPreviewAdminQueue(): AdminQueueRow[] {
  const now = new Date().toISOString();

  return dealPackages.map((deal, index) => ({
    id: `preview-${deal.id}`,
    customer: "Guest checkout",
    product: deal.services.map(serviceName).join(" + "),
    route: deal.title,
    status: "Pending Checkout",
    risk: index === 0 ? "Medium" : "Low",
    amount: `USD ${deal.price.toFixed(2)}`,
    lastUpdate: now,
  }));
}

async function fetchAdminQueue(requestUrl: URL, env: Env) {
  const limit = Math.min(Math.max(Number.parseInt(requestUrl.searchParams.get("limit") || "50", 10) || 50, 1), 100);
  const supabaseUrl = travelSupabaseUrl(env);
  const privateKey = privilegedSupabaseKey(env);

  if (!supabaseUrl || !privateKey) {
    return {
      app: "zivo-travel",
      mode: "admin_queue_preview",
      persisted: false,
      reason: "missing_supabase_service_role_secret",
      queue: buildPreviewAdminQueue().slice(0, limit),
      checkedAt: new Date().toISOString(),
    };
  }

  const endpoint = `${supabaseUrl}/rest/v1/rpc/zivo_travel_admin_queue`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: supabaseApiHeaders(privateKey, {
      "content-type": "application/json",
      accept: "application/json",
    }),
    body: JSON.stringify({ p_limit: limit }),
  });

  if (!response.ok) {
    return {
      app: "zivo-travel",
      mode: "admin_queue_preview",
      persisted: false,
      reason: "supabase_rpc_failed",
      supabaseStatus: response.status,
      queue: buildPreviewAdminQueue().slice(0, limit),
      checkedAt: new Date().toISOString(),
    };
  }

  const queue = await response.json() as AdminQueueRow[];

  return {
    app: "zivo-travel",
    mode: "supabase_admin_queue",
    persisted: true,
    queue,
    checkedAt: new Date().toISOString(),
  };
}

function buildReviewSession(requestUrl: URL, env: Env, kind: SearchKind) {
  const deal = findDeal(requestUrl.searchParams.get("deal"));
  const sessionKind = deal?.reviewKind || kind;
  const resultId = deal?.resultId || requestUrl.searchParams.get("result");
  const baseResult = resultCatalog[sessionKind].find((item) => item.id === resultId) || resultCatalog[sessionKind][0];
  const result = deal
    ? {
        ...baseResult,
        title: deal.title,
        provider: "Zivo Deals",
        detail: deal.body,
        price: deal.price,
        rating: deal.highlight,
        tags: [deal.save, ...deal.services.map(serviceName), "Bundle"],
      }
    : baseResult;
  const checkoutUrl = buildCheckoutUrl(requestUrl, env, sessionKind, baseResult.id, deal?.id);
  const auth = new URL(routePaths.authHandoff, platformOrigin(env));
  const serviceFee = Math.max(3, Math.round(result.price * 0.08));

  auth.searchParams.set("app", "zivo-travel");
  auth.searchParams.set("redirect", new URL(checkoutUrl).pathname + new URL(checkoutUrl).search);

  return {
    app: "zivo-travel",
    mode: "cloudflare_review",
    product: sessionKind,
    label: `Review ${result.title}`,
    summary: result.detail,
    currency: "USD",
    provider: "zivosmedia",
    result: {
      ...result,
      id: baseResult.id,
      reviewUrl: buildReviewUrl(requestUrl, sessionKind, baseResult.id, deal?.id),
      checkoutUrl,
    },
    subtotal: result.price,
    serviceFee,
    total: result.price + serviceFee,
    reviewUrl: buildReviewUrl(requestUrl, sessionKind, baseResult.id, deal?.id),
    checkoutUrl,
    paymentUrl: new URL(routePaths.paymentMethods, platformOrigin(env)).toString(),
    walletUrl: new URL(routePaths.wallet, platformOrigin(env)).toString(),
    payoutUrl: new URL(routePaths.payout, platformOrigin(env)).toString(),
    ssoUrl: auth.toString(),
    deal: deal || undefined,
    steps: [
      { label: "Result selected", status: "ready" },
      { label: "Review trip", status: "ready" },
      { label: "Sign in", status: "handoff" },
      { label: "Pay", status: "handoff" },
      { label: "Wallet record", status: "handoff" },
    ],
    ledger: [
      { label: "Booking source", value: "Zivo Travel" },
      ...(deal ? [{ label: "Package", value: `${deal.save} bundle` }] : []),
      { label: "Checkout authority", value: "Zivos Media" },
      { label: "Payment rail", value: "Saved methods" },
      { label: "Payout record", value: "Wallet ledger" },
    ],
    checkedAt: new Date().toISOString(),
  };
}

function buildBookingRow(
  requestUrl: URL,
  env: Env,
  kind: SearchKind,
  resultId?: string,
  body?: Record<string, unknown>,
) {
  const bodyDeal = typeof body?.dealId === "string" ? body.dealId : null;
  const deal = findDeal(requestUrl.searchParams.get("deal") || bodyDeal);
  const bookingKind = deal?.reviewKind || kind;
  const baseResult = resultCatalog[bookingKind].find((item) => item.id === (deal?.resultId || resultId)) || resultCatalog[bookingKind][0];
  const result = deal
    ? {
        ...baseResult,
        title: deal.title,
        provider: "Zivo Deals",
        detail: deal.body,
        price: deal.price,
        rating: deal.highlight,
        tags: [deal.save, ...deal.services.map(serviceName), "Bundle"],
      }
    : baseResult;
  const serviceFee = Math.max(3, Math.round(result.price * 0.08));
  const bookingReference = createBookingReference();
  const checkoutUrl = withBookingReference(buildCheckoutUrl(requestUrl, env, bookingKind, baseResult.id, deal?.id), bookingReference);
  const reviewUrl = withBookingReference(buildReviewUrl(requestUrl, bookingKind, baseResult.id, deal?.id), bookingReference);
  const auth = new URL(routePaths.authHandoff, platformOrigin(env));
  const travelers = Number.parseInt(requestUrl.searchParams.get("travelers") || "1", 10);
  const traveler = sanitizeTraveler(body?.traveler);

  auth.searchParams.set("app", "zivo-travel");
  auth.searchParams.set("redirect", new URL(checkoutUrl).pathname + new URL(checkoutUrl).search);

  return {
    booking_reference: bookingReference,
    service_type: serviceType(bookingKind),
    result_id: baseResult.id,
    result_title: result.title,
    provider: result.provider,
    origin: requestUrl.searchParams.get("from") || "Phnom Penh",
    destination: requestUrl.searchParams.get("to") || "Siem Reap",
    date_start: requestUrl.searchParams.get("start") || "2026-06-15",
    date_end: requestUrl.searchParams.get("end") || "2026-06-18",
    travelers: Number.isFinite(travelers) ? Math.max(1, Math.min(99, travelers)) : 1,
    currency: "USD",
    subtotal: result.price,
    service_fee: serviceFee,
    total: result.price + serviceFee,
    status: "pending_checkout",
    review_url: reviewUrl,
    checkout_url: checkoutUrl,
    sso_url: auth.toString(),
    source_host: requestUrl.host,
    idempotency_key: bookingReference,
    request_payload: {
      product: bookingKind,
      query: Object.fromEntries(requestUrl.searchParams),
      result,
      deal,
      traveler,
    },
    checkout_payload: {
      checkoutUrl,
      paymentUrl: new URL(routePaths.paymentMethods, platformOrigin(env)).toString(),
      walletUrl: new URL(routePaths.wallet, platformOrigin(env)).toString(),
      payoutUrl: new URL(routePaths.payout, platformOrigin(env)).toString(),
    },
    metadata: {
      app: "zivo-travel",
      bridge: "cloudflare",
      authority: "zivosmedia",
      driverWorkflow: {
        sourcePlatform: "zivo-travel",
        targetPlatform: "zivo-driver",
        travelBookingId: bookingReference,
        driverJobId: null,
        chatThreadId: null,
        paymentOrderId: null,
        status: "pending_driver_request",
      },
      dealId: deal?.id || null,
      packageReady: Boolean(deal),
      travelerReady: Boolean(traveler),
    },
  };
}

function buildDriverRequestPreview(requestUrl: URL, body?: Record<string, unknown>): DriverRequestPreview {
  const booking = body?.booking && typeof body.booking === "object"
    ? body.booking as Record<string, unknown>
    : {};
  const bookingReference = cleanText(
    body?.travelBookingId || body?.travel_booking_id || booking.bookingReference || booking.booking_reference || requestUrl.searchParams.get("booking_reference"),
    "ztb_preview",
    80,
  );
  const service = cleanNullableText(booking.serviceType || booking.service_type || requestUrl.searchParams.get("type"), 80);
  const origin = cleanNullableText(booking.origin || requestUrl.searchParams.get("from"), 140);
  const destination = cleanNullableText(booking.destination || requestUrl.searchParams.get("to"), 140);
  const scheduledFor = cleanNullableText(booking.dateStart || booking.date_start || requestUrl.searchParams.get("start"), 40);
  const travelers = Number.parseInt(String(booking.travelers || requestUrl.searchParams.get("travelers") || "1"), 10);

  return {
    app: "zivo-travel",
    mode: "driver_request_preview",
    persisted: false,
    sourcePlatform: "zivo-travel",
    targetPlatform: "zivo-driver",
    travelBookingId: bookingReference,
    driverJobId: null,
    status: "pending_driver_request",
    customerStatus: "driver_request_ready",
    adminStatus: "visible_after_driver_job_creation",
    chatThreadId: null,
    paymentOrderId: null,
    payoutStatus: "not_eligible_until_completed",
    requestPayload: {
      travel_booking_id: bookingReference,
      source_platform: "zivo-travel",
      target_platform: "zivo-driver",
      pickup_address: origin,
      dropoff_address: destination,
      scheduled_for: scheduledFor,
      service_type: service,
      traveler_count: Number.isFinite(travelers) ? Math.max(1, travelers) : 1,
      notes: "Preview only. Driver job creation, payment order binding, chat thread creation, and payout eligibility require the approved Travel to Driver backend workflow.",
    },
    nextSteps: [
      "Travel creates or confirms booking draft",
      "Travel sends this payload to the approved Driver job receiver",
      "Driver accepts or rejects the job",
      "Driver status syncs back to Travel",
      "ZivoChat and Zivo Admin attach to travel_booking_id and driver_job_id",
      "Payment order and payout status attach after approved ZivoPay workflow",
    ],
    checkedAt: new Date().toISOString(),
  };
}

function bookingRecordFromRow(row: Record<string, unknown>) {
  const deal = dealFromRow(row);

  return {
    id: row.id || null,
    bookingReference: row.booking_reference,
    status: row.status,
    serviceType: row.service_type,
    resultId: row.result_id,
    resultTitle: row.result_title,
    provider: row.provider,
    currency: row.currency,
    subtotal: row.subtotal,
    serviceFee: row.service_fee,
    total: row.total,
    reviewUrl: row.review_url,
    checkoutUrl: row.checkout_url,
    ssoUrl: row.sso_url,
    createdAt: row.created_at || null,
    dealId: deal?.id,
    traveler: travelerFromRow(row),
  };
}

function bookingResponseFromRow(row: Record<string, unknown>, mode: string, persisted: boolean) {
  return {
    app: "zivo-travel",
    mode,
    persisted,
    booking: bookingRecordFromRow(row),
    checkedAt: new Date().toISOString(),
  };
}

function supportTicketFromRow(row: Record<string, unknown>) {
  return {
    reference: row.reference,
    status: row.status,
    topic: row.topic,
    priority: row.priority,
    summary: row.summary,
    customer: row.customer_name || row.customer,
    bookingReference: row.booking_reference || undefined,
    chatUrl: row.chat_url,
    createdAt: row.created_at || new Date().toISOString(),
  };
}

function supportResponseFromRow(
  row: Record<string, unknown>,
  mode: string,
  persisted: boolean,
  reason?: string,
) {
  return {
    app: "zivo-travel",
    mode,
    persisted,
    ...(reason ? { reason } : {}),
    ticket: supportTicketFromRow(row),
    checkedAt: new Date().toISOString(),
  };
}

async function createBookingIntent(request: Request, requestUrl: URL, env: Env) {
  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  const bodyType = typeof body.type === "string" ? body.type : null;
  const bodyResult = typeof body.resultId === "string" ? body.resultId : null;
  const kind = normalizeSearchKind(requestUrl.searchParams.get("type") || bodyType);
  const resultId = requestUrl.searchParams.get("result") || bodyResult || undefined;
  const row = buildBookingRow(requestUrl, env, kind, resultId, body);
  const supabaseUrl = travelSupabaseUrl(env);
  const privateKey = privilegedSupabaseKey(env);
  const writeKey = writeSupabaseKey(env);

  if (!supabaseUrl || !writeKey) {
    return {
      ...bookingResponseFromRow(row, "booking_bridge_preview", false),
      reason: "missing_supabase_write_key",
    };
  }

  const canReadInsertedRow = Boolean(privateKey);
  const endpoint = canReadInsertedRow
    ? `${supabaseUrl}/rest/v1/zivo_travel_booking_intents?select=id,booking_reference,status,service_type,result_id,result_title,provider,currency,subtotal,service_fee,total,review_url,checkout_url,sso_url,created_at`
    : `${supabaseUrl}/rest/v1/zivo_travel_booking_intents`;
  const response = await fetch(
    endpoint,
    {
      method: "POST",
      headers: supabaseApiHeaders(writeKey, {
        "content-type": "application/json",
        prefer: canReadInsertedRow ? "return=representation" : "return=minimal",
      }),
      body: JSON.stringify(row),
    },
  );

  if (!response.ok) {
    return {
      ...bookingResponseFromRow(row, "booking_bridge_preview", false),
      reason: "supabase_insert_failed",
      supabaseStatus: response.status,
    };
  }

  if (!canReadInsertedRow) {
    return bookingResponseFromRow(row, "supabase_public_booking_intent", true);
  }

  const records = await response.json() as Array<Record<string, unknown>>;
  return bookingResponseFromRow(records[0] || row, "supabase_booking_intent", true);
}

async function findBookingIntent(requestUrl: URL, env: Env) {
  const reference = requestUrl.searchParams.get("reference") || requestUrl.searchParams.get("booking_reference");
  const supabaseUrl = travelSupabaseUrl(env);
  const privateKey = privilegedSupabaseKey(env);

  if (!reference) {
    return {
      app: "zivo-travel",
      mode: "booking_lookup_requires_reference",
      persisted: false,
      bookings: [],
      checkedAt: new Date().toISOString(),
    };
  }

  if (!supabaseUrl || !privateKey) {
    return {
      app: "zivo-travel",
      mode: "booking_lookup_preview",
      persisted: false,
      reason: "missing_supabase_private_key",
      reference,
      bookings: [],
      checkedAt: new Date().toISOString(),
    };
  }

  const endpoint = new URL(`${supabaseUrl}/rest/v1/zivo_travel_booking_intents`);
  endpoint.searchParams.set("select", "id,booking_reference,status,service_type,result_id,result_title,provider,currency,subtotal,service_fee,total,review_url,checkout_url,sso_url,created_at");
  endpoint.searchParams.set("booking_reference", `eq.${reference}`);
  endpoint.searchParams.set("limit", "1");

  const response = await fetch(endpoint.toString(), {
    headers: supabaseApiHeaders(privateKey, {
      accept: "application/json",
    }),
  });

  if (!response.ok) {
    return {
      app: "zivo-travel",
      mode: "booking_lookup_failed",
      persisted: false,
      reference,
      bookings: [],
      supabaseStatus: response.status,
      checkedAt: new Date().toISOString(),
    };
  }

  const records = await response.json() as Array<Record<string, unknown>>;

  return {
    app: "zivo-travel",
    mode: "supabase_booking_lookup",
    persisted: true,
    reference,
    bookings: records.map(bookingRecordFromRow),
    checkedAt: new Date().toISOString(),
  };
}

function buildSupportTicketRow(
  requestUrl: URL,
  env: Env,
  topic: SupportTopic,
  body: Record<string, unknown>,
): SupportTicketRow {
  const reference = createSupportReference();
  const origin = platformOrigin(env);
  const chat = new URL(routePaths.support, origin);
  const name = cleanText(body.name, "Guest Traveler", 120);
  const email = cleanText(body.email, "", 180);
  const summary = cleanText(body.message, "Please help me with my Zivo Travel booking.", 520);
  const bookingReference = cleanText(body.bookingReference, "", 80);
  const priority = supportPriority(topic);

  chat.searchParams.set("app", "zivo-travel");
  chat.searchParams.set("ticket", reference);

  return {
    reference,
    status: "open",
    topic,
    priority,
    customer_name: name,
    customer_email: email || null,
    booking_reference: bookingReference || null,
    summary,
    chat_url: chat.toString(),
    source_host: requestUrl.host,
    request_payload: {
      topic,
      name,
      email: email || null,
      bookingReference: bookingReference || null,
      message: summary,
    },
    metadata: {
      app: "zivo-travel",
      bridge: "cloudflare",
      authority: "zivosmedia",
      supportUrl: chat.toString(),
    },
  };
}

async function createSupportTicket(request: Request, env: Env) {
  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  const requestUrl = new URL(request.url);
  const topic = normalizeSupportTopic(body.topic);
  const row = buildSupportTicketRow(requestUrl, env, topic, body);
  const supabaseUrl = travelSupabaseUrl(env);
  const privateKey = privilegedSupabaseKey(env);
  const writeKey = writeSupabaseKey(env);

  if (!supabaseUrl || !writeKey) {
    return supportResponseFromRow(row, "support_bridge_preview", false, "missing_supabase_write_key");
  }

  const canReadInsertedRow = Boolean(privateKey);
  const endpoint = canReadInsertedRow
    ? `${supabaseUrl}/rest/v1/zivo_travel_support_tickets?select=reference,status,topic,priority,customer_name,booking_reference,summary,chat_url,created_at`
    : `${supabaseUrl}/rest/v1/zivo_travel_support_tickets`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: supabaseApiHeaders(writeKey, {
      "content-type": "application/json",
      prefer: canReadInsertedRow ? "return=representation" : "return=minimal",
    }),
    body: JSON.stringify(row),
  });

  if (!response.ok) {
    return {
      ...supportResponseFromRow(row, "support_bridge_preview", false, "supabase_support_insert_failed"),
      supabaseStatus: response.status,
    };
  }

  if (!canReadInsertedRow) {
    return supportResponseFromRow(row, "supabase_public_support_ticket", true);
  }

  const records = await response.json() as Array<Record<string, unknown>>;
  return supportResponseFromRow(records[0] || row, "supabase_support_ticket", true);
}

function supportPersistenceMode(env: Env) {
  if (privilegedSupabaseKey(env)) {
    return "supabase";
  }

  if (writeSupabaseKey(env)) {
    return "supabase_insert";
  }

  return "preview";
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "OPTIONS" && url.pathname.startsWith("/api/")) {
      return new Response(null, {
        status: 204,
        headers: apiHeaders(request),
      });
    }

    if (url.pathname === "/robots.txt") {
      return text(
        request,
        ["User-agent: *", "Allow: /", "Sitemap: https://zivostravel.com/sitemap.xml", ""].join("\n"),
        "text/plain; charset=utf-8",
      );
    }

    if (url.pathname === "/sitemap.xml") {
      const pages = ["", "flights", "hotels", "cars", "bus", "deals", "trips", "ops", "wallet", "support", "booking/review"].map(
        (path) => `  <url><loc>https://zivostravel.com/${path}</loc></url>`,
      );

      return text(
        request,
        [`<?xml version="1.0" encoding="UTF-8"?>`, `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`, ...pages, `</urlset>`].join("\n"),
        "application/xml; charset=utf-8",
      );
    }

    if (url.pathname === "/api/health" || url.pathname === "/api/travel/status") {
      const hasPrivateSupabaseKey = Boolean(privilegedSupabaseKey(env));
      const hasWriteSupabaseKey = Boolean(writeSupabaseKey(env));

      return json(request, {
        app: "zivo-travel",
        mode: "cloudflare_bridge",
        platformOrigin: platformOrigin(env),
        travelSupabaseUrl: env.ZIVO_TRAVEL_SUPABASE_URL || null,
        authoritySupabaseUrl: env.ZIVO_AUTHORITY_SUPABASE_URL || null,
        dedicatedBackendEnabled: hasWriteSupabaseKey,
        bookingPersistence: hasPrivateSupabaseKey ? "supabase" : hasWriteSupabaseKey ? "supabase_insert" : "preview",
        searchTelemetry: hasWriteSupabaseKey ? "supabase_insert" : "preview",
        supportPersistence: supportPersistenceMode(env),
        adminQueue: hasPrivateSupabaseKey ? "supabase_rpc" : "preview",
        walletSummary: hasPrivateSupabaseKey ? "bridge_ready" : "preview",
        driverWorkflow: "preview_contract",
        services: travelServices,
        routes: routePaths,
        checkedAt: new Date().toISOString(),
      });
    }

    if (url.pathname === "/api/travel/bridge") {
      return json(request, {
        app: "zivo-travel",
        mode: "handoff_bridge",
        travelOrigin: `${url.protocol}//${url.host}`,
        platformOrigin: platformOrigin(env),
        guardrails: [
          "Auth, checkout, wallet, payouts, and live bookings stay on the Zivos Media authority during bridge mode.",
          "The dedicated Travel Supabase project is ready for telemetry, config, and staged migrations.",
        ],
        routes: routePaths,
        services: travelServices,
      });
    }

    if (url.pathname === "/api/travel/quote") {
      const kind = normalizeSearchKind(url.searchParams.get("type"));

      return json(request, buildQuote(url, env, kind));
    }

    if (url.pathname === "/api/travel/results") {
      const kind = normalizeSearchKind(url.searchParams.get("type"));

      return json(request, await buildResults(url, env, kind));
    }

    if (url.pathname === "/api/travel/deals") {
      return json(request, buildDeals(url));
    }

    if (url.pathname === "/api/travel/wallet/summary") {
      if (request.method !== "GET") {
        return json(request, { error: "method_not_allowed" }, 405);
      }

      return json(request, buildWalletSummary(env));
    }

    if (url.pathname === "/api/travel/support") {
      if (request.method === "GET") {
        const supportPersistence = supportPersistenceMode(env);

        return json(request, {
          app: "zivo-travel",
          mode: supportPersistence === "preview" ? "support_bridge_preview" : "support_bridge",
          persisted: supportPersistence !== "preview",
          reason: supportPersistence === "preview" ? "missing_supabase_write_key" : undefined,
          provider: "zivosmedia",
          supportPersistence,
          topics: ["booking", "payment", "wallet", "change"],
          supportUrl: new URL(routePaths.support, platformOrigin(env)).toString(),
          checkedAt: new Date().toISOString(),
        });
      }

      if (request.method !== "POST") {
        return json(request, { error: "method_not_allowed" }, 405);
      }

      return json(request, await createSupportTicket(request, env));
    }

    if (url.pathname === "/api/travel/admin/queue") {
      if (request.method !== "GET") {
        return json(request, { error: "method_not_allowed" }, 405);
      }

      // CORS does not stop server-side callers (curl), so the service-role path
      // must be gated here. The synthetic preview (no service-role key) stays
      // public and harmless; only the live admin read requires the admin token.
      if (privilegedSupabaseKey(env) && !isAuthorizedAdminRequest(request, env)) {
        return json(request, { error: "unauthorized" }, 401);
      }

      return json(request, await fetchAdminQueue(url, env));
    }

    if (url.pathname === "/api/travel/session") {
      const kind = normalizeSearchKind(url.searchParams.get("type"));

      return json(request, buildReviewSession(url, env, kind));
    }

    if (url.pathname === "/api/travel/bookings") {
      if (request.method === "GET") {
        return json(request, await findBookingIntent(url, env));
      }

      if (request.method !== "POST") {
        return json(request, { error: "method_not_allowed" }, 405);
      }

      return json(request, await createBookingIntent(request, url, env));
    }

    if (url.pathname === "/api/travel/driver-request") {
      if (request.method === "GET") {
        return json(request, buildDriverRequestPreview(url));
      }

      if (request.method !== "POST") {
        return json(request, { error: "method_not_allowed" }, 405);
      }

      const body = await request.json().catch(() => ({})) as Record<string, unknown>;
      return json(request, buildDriverRequestPreview(url, body));
    }

    if (url.pathname === "/api/travel/search") {
      const kind = normalizeSearchKind(url.searchParams.get("type"));

      return json(request, {
        app: "zivo-travel",
        mode: "handoff_bridge",
        product: kind,
        provider: "zivosmedia",
        handoffUrl: buildHandoffUrl(url, env, kind),
      });
    }

    const response = await env.ASSETS.fetch(request);
    const headers = new Headers(response.headers);

    for (const [key, value] of Object.entries(securityHeaders)) {
      headers.set(key, value);
    }

    headers.set("x-zivo-travel-engine", env.ZIVO_PLATFORM_ORIGIN);

    return new Response(response.body, {
      headers,
      status: response.status,
      statusText: response.statusText,
    });
  },
};
