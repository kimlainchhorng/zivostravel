import { createClient } from "@supabase/supabase-js";
import bridge from "../zivo-travel-bridge.json";

export const authorityHandoffPath = "/auth/handoff";

type AuthorityHandoffResult = {
  handled: boolean;
  error?: string;
};

const authorityUrl = (
  import.meta.env.VITE_ZIVO_AUTHORITY_SUPABASE_URL ||
  `https://${bridge.authAuthority.projectRef}.supabase.co`
).replace(/\/$/, "");
const authorityPublishableKey = (
  import.meta.env.VITE_ZIVO_AUTHORITY_SUPABASE_PUBLISHABLE_KEY || ""
).trim();

function isSecretSupabaseKey(key: string) {
  if (key.startsWith("sb_secret_")) return true;

  const [, encodedPayload] = key.split(".");

  if (!encodedPayload || typeof atob !== "function") return false;

  try {
    const normalized = encodedPayload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    return JSON.parse(atob(padded))?.role === "service_role";
  } catch {
    return false;
  }
}

// A publishable key is intentionally public. Reject a secret/service key if a
// deployment is ever misconfigured so it can never be bundled into the app.
const authorityClient =
  authorityUrl && authorityPublishableKey && !isSecretSupabaseKey(authorityPublishableKey)
    ? createClient(authorityUrl, authorityPublishableKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          // Only the explicit /auth/handoff path consumes a one-time token.
          detectSessionInUrl: false,
        },
      })
    : null;

export function authoritySessionUnavailableMessage() {
  if (!authorityPublishableKey) {
    return "Zivos Media sign-in is not configured for this Travel deployment. No booking draft was created.";
  }

  if (isSecretSupabaseKey(authorityPublishableKey)) {
    return "This Travel deployment has an invalid identity key configuration. No booking draft was created.";
  }

  return "A Zivos Media sign-in is required before creating a booking draft.";
}

export async function getAuthorityAccessToken(): Promise<string | null> {
  if (!authorityClient) return null;

  const { data, error } = await authorityClient.auth.getSession();
  const accessToken = data.session?.access_token?.trim();

  return error || !accessToken ? null : accessToken;
}

export function sanitizeAuthorityHandoffNext(next: string | null | undefined): string {
  if (!next) return "/";

  const normalized = next.replace(/\\/g, "/");

  if (!normalized.startsWith("/") || normalized.startsWith("//")) return "/";

  return normalized;
}

/**
 * Consume only the central identity authority's one-time magic-link hash.
 * The raw token is erased before any asynchronous request so it cannot remain
 * in history or leak to a later navigation.
 */
export async function consumeAuthorityHandoff(): Promise<AuthorityHandoffResult> {
  if (typeof window === "undefined" || window.location.pathname !== authorityHandoffPath) {
    return { handled: false };
  }

  const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : "";
  const params = new URLSearchParams(hash);
  const tokenHash = params.get("ott") || params.get("token_hash");
  const next = sanitizeAuthorityHandoffNext(params.get("next"));

  window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);

  if (!tokenHash) {
    return { handled: true, error: "The Zivos Media sign-in handoff was incomplete. No booking draft was created." };
  }

  if (!authorityClient) {
    return { handled: true, error: authoritySessionUnavailableMessage() };
  }

  const { error } = await authorityClient.auth.verifyOtp({
    type: "magiclink",
    token_hash: tokenHash,
  });

  if (error) {
    return { handled: true, error: "The Zivos Media sign-in handoff could not be verified. Please sign in again." };
  }

  window.location.replace(next);
  return { handled: true };
}
