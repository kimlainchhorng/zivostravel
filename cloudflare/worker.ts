export interface Env {
  ASSETS: Fetcher;
  ZIVO_PLATFORM_ORIGIN: string;
}

const securityHeaders = {
  "x-content-type-options": "nosniff",
  "referrer-policy": "strict-origin-when-cross-origin",
  "permissions-policy": "camera=(), microphone=(), geolocation=()",
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
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
