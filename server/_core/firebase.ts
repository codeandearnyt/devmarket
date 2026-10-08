import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";

/**
 * Firebase ID token verification.
 *
 * Firebase ID tokens are RS256 JWTs signed by Google, so they can be verified
 * against Google's published JWKS without a service-account private key. That
 * keeps the serverless bundle free of the (large, gRPC-based) Firebase Admin
 * SDK and means there is no private key to distribute or leak.
 *
 * Reference:
 * https://firebase.google.com/docs/auth/admin/verify-id-tokens#verify_id_tokens_using_a_third-party_jwt_library
 */

const PROJECT_ID =
  process.env.FIREBASE_PROJECT_ID ||
  process.env.VITE_FIREBASE_PROJECT_ID ||
  "devmarket-app";

/**
 * Firebase web API key.
 *
 * This is *publishable* configuration, not a secret: it identifies the project
 * and is shipped to every browser in the client bundle (see
 * `client/src/lib/firebase.ts`). Holding it server-side only gates nothing —
 * Firebase's `accounts:signInWithPassword` still checks the password and hands
 * back a signed ID token that `verifyFirebaseIdToken` validates against
 * Google's public keys. Kept here so the admin console cannot silently break
 * when an environment variable is missing.
 */
const FIREBASE_WEB_API_KEY = "AIzaSyBLB_7uvqZ_q-XF_2_nwD7ZvUw2loPTEb8";

const JWKS_URL =
  "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com";

// Cached across invocations; `jose` handles key rotation and re-fetch.
const JWKS = createRemoteJWKSet(new URL(JWKS_URL), {
  cacheMaxAge: 60 * 60 * 1000, // 1 hour
  timeoutDuration: 10_000,
});

export type FirebaseClaims = JWTPayload & {
  user_id: string;
  email?: string;
  name?: string;
  picture?: string;
  firebase?: {
    sign_in_provider?: string;
    identities?: Record<string, unknown>;
  };
};

export function isFirebaseConfigured() {
  return Boolean(PROJECT_ID);
}

/**
 * Verify a Firebase ID token. Returns the decoded claims, or null when the
 * token is expired, tampered with, or issued for a different project.
 */
export async function verifyFirebaseIdToken(idToken: string): Promise<FirebaseClaims | null> {
  try {
    const { payload } = await jwtVerify(idToken, JWKS, {
      issuer: `https://securetoken.google.com/${PROJECT_ID}`,
      audience: PROJECT_ID,
      algorithms: ["RS256"],
    });

    const claims = payload as FirebaseClaims;

    // Firebase guarantees these; reject rather than trusting the token shape.
    if (!claims.sub || !claims.user_id) {
      console.warn("[Firebase] ID token missing sub/user_id");
      return null;
    }
    if (claims.sub !== claims.user_id) {
      console.warn("[Firebase] ID token sub/user_id mismatch");
      return null;
    }
    // `auth_time` is required by Firebase's own verification steps.
    if (typeof claims.auth_time !== "number") {
      console.warn("[Firebase] ID token missing auth_time");
      return null;
    }

    return claims;
  } catch (error) {
    console.warn("[Firebase] ID token verification failed:", String(error));
    return null;
  }
}

/**
 * Exchange an email + password for a Firebase ID token.
 *
 * This is the same public endpoint the web SDK calls. The API key is not a
 * secret — it only identifies the project — and the password never touches our
 * database or our logs: Firebase verifies it and hands back a signed ID token,
 * which the caller still has to verify through `verifyFirebaseIdToken`.
 *
 * Used by the admin gate so an operator can unlock the console with their own
 * credentials without reusing a visitor's Google session.
 */
export async function exchangeCredentialsForIdToken(email: string, password: string): Promise<string | null> {
  // Mirrors the client's fallback in `client/src/lib/firebase.ts`. Vite only
  // inlines `VITE_*` vars into browser code at build time — a serverless
  // runtime never sees them unless they were also configured on the host — so
  // without this the admin console would reject valid credentials on
  // deployment while working perfectly in local dev.
  const apiKey = process.env.VITE_FIREBASE_API_KEY ?? process.env.FIREBASE_WEB_API_KEY ?? FIREBASE_WEB_API_KEY;
  if (!apiKey) {
    console.warn("[Firebase] Firebase web API key is not configured");
    return null;
  }

  try {
    const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    });

    if (!response.ok) return null;
    const data = (await response.json()) as { idToken?: unknown };
    return typeof data.idToken === "string" ? data.idToken : null;
  } catch (error) {
    console.warn("[Firebase] Credential exchange failed:", String(error));
    return null;
  }
}