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