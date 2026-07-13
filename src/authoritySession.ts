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

// A publishable/anon key is public by design.  Never fall back to a bundled
// key, and reject a service-role key if one is mistakenly supplied to Vite.
const authorityClient =
  authorityUrl && authorityPublishableKey && !isSecretSupabaseKey(authorityPublishableKey)
    ? createClient(authorityUrl, authorityPublishableKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          // Handoff tokens are accepted only on /auth/handoff below; do not
          // let the SDK implicitly consume arbitrary URL fragments.
          detectSessionInUrl: false,
        },
      })
    : null;

export function authoritySessionUnavailableMessage() {
  if (!authorityPublishableKey) {
    return "Zivos Media sign-in is not configured for this Travel deployment. No booking draft was created.";
  }

  if (isSecretSupabaseKey(authorityPublishableKey)) {
    return "This Travel deployment has an invalid authority key configuration. No booking draft was created.";
  }

  return "A Zivos Media sign-in is required before creating a booking draft.";
}

export async function getAuthorityAccessToken(): Promise<string | null> {
  if (!authorityClient) return null;

  const { data, error } = await authorityClient.auth.getSession();
  const accessToken = data.session?.access_token?.trim();

  return error || !accessToken ? null : accessToken;
}

/**
 * The user id is used only to scope volatile Travel UI state in this document.
 * It is never written to browser storage by the booking-draft store.
 */
export async function getAuthoritySessionUserId(): Promise<string | null> {
  if (!authorityClient) return null;

  const { data, error } = await authorityClient.auth.getSession();
  const userId = data.session?.user?.id?.trim();

  return error || !userId ? null : userId;
}

/**
 * Notify consumers when the authenticated authority identity changes. Token
 * refreshes for the same user are deliberately ignored; a sign-out or switch
 * to another user is a hard boundary for volatile customer data.
 */
export function subscribeToAuthorityUserChanges(onUserChanged: (userId: string | null) => void) {
  if (!authorityClient) {
    return () => undefined;
  }

  let disposed = false;
  let currentUserId: string | null | undefined;

  const applySession = (session: { user?: { id?: string } } | null) => {
    const nextUserId = session?.user?.id?.trim() || null;

    if (currentUserId === undefined || currentUserId !== nextUserId) {
      currentUserId = nextUserId;
      onUserChanged(nextUserId);
    }
  };

  void authorityClient.auth.getSession().then(({ data }) => {
    if (!disposed) {
      applySession(data.session);
    }
  });

  const {
    data: { subscription },
  } = authorityClient.auth.onAuthStateChange((_event, session) => {
    if (!disposed) {
      applySession(session);
    }
  });

  return () => {
    disposed = true;
    subscription.unsubscribe();
  };
}

export function sanitizeAuthorityHandoffNext(next: string | null | undefined): string {
  if (!next) return "/";

  const normalized = next.replace(/\\/g, "/");
  if (!normalized.startsWith("/") || normalized.startsWith("//")) return "/";

  return next;
}

/**
 * Consume only the central identity authority's one-time magic-link hash.
 * The hash is erased before any async work, so it cannot remain in browser
 * history or leak through a later referrer.  Raw access/refresh tokens are
 * intentionally not accepted here.
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
