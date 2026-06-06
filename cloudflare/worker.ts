export interface Env {
  ASSETS: Fetcher;
  ZIVO_PLATFORM_ORIGIN: string;
  ZIVO_TRAVEL_SUPABASE_URL?: string;
  ZIVO_AUTHORITY_SUPABASE_URL?: string;
}

const securityHeaders = {
  "x-content-type-options": "nosniff",
  "referrer-policy": "strict-origin-when-cross-origin",
  "permissions-policy": "camera=(), microphone=(), geolocation=()",
};

type SearchKind = "flights" | "hotels" | "cars" | "bus";

const travelServices: SearchKind[] = ["flights", "hotels", "cars", "bus"];
const routePaths: Record<SearchKind | "checkout" | "wallet" | "support", string> = {
  flights: "/flights",
  hotels: "/hotels",
  cars: "/cars",
  bus: "/bus",
  checkout: "/travel/checkout",
  wallet: "/wallet",
  support: "/chat",
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

function normalizeSearchKind(value: string | null): SearchKind {
  if (value === "hotels" || value === "cars" || value === "bus") {
    return value;
  }

  return "flights";
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
    headers.set("access-control-allow-methods", "GET, OPTIONS");
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

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "OPTIONS" && url.pathname.startsWith("/api/")) {
      return new Response(null, {
        status: 204,
        headers: apiHeaders(request),
      });
    }

    if (url.pathname === "/api/health" || url.pathname === "/api/travel/status") {
      return json(request, {
        app: "zivo-travel",
        mode: "cloudflare_bridge",
        platformOrigin: platformOrigin(env),
        travelSupabaseUrl: env.ZIVO_TRAVEL_SUPABASE_URL || null,
        authoritySupabaseUrl: env.ZIVO_AUTHORITY_SUPABASE_URL || null,
        dedicatedBackendEnabled: false,
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
