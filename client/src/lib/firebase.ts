import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  browserLocalPersistence,
  getAuth,
  GoogleAuthProvider,
  setPersistence,
  type Auth,
} from "firebase/auth";

/**
 * Firebase web config. These are publishable identifiers, not secrets — the
 * API key only identifies the project, and access is controlled by the
 * Authorized Domains list plus security rules.
 *
 * Env vars win so a fork can point at its own project; the literal values are
 * the DevMarket project so a fresh clone works without extra setup.
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? "AIzaSyBLB_7uvqZ_q-XF_2_nwD7ZvUw2loPTEb8",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? "devmarket-app.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? "devmarket-app",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? "devmarket-app.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? "485498632227",
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? "1:485498632227:web:fa516e97410bb8999f1996",
};

let _app: FirebaseApp | null = null;
let _auth: Auth | null = null;

export function getFirebaseApp(): FirebaseApp {
  if (_app) return _app;
  _app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  return _app;
}

export function getFirebaseAuth(): Auth {
  if (_auth) return _auth;
  _auth = getAuth(getFirebaseApp());
  // Survives reloads and the OAuth popup round-trip, which is what makes
  // "stay signed in" work without our own refresh-token plumbing.
  void setPersistence(_auth, browserLocalPersistence).catch(error => {
    console.warn("[Firebase] Could not set auth persistence:", error);
  });
  return _auth;
}

export function createGoogleProvider() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  return provider;
}

/** Human-readable message for the Firebase error codes users actually hit. */
export function describeFirebaseError(error: unknown): string {
  const code = (error as { code?: string })?.code ?? "";
  switch (code) {
    case "auth/popup-closed-by-user":
      return "Sign-in window was closed before finishing.";
    case "auth/popup-blocked":
      return "Your browser blocked the sign-in window. Allow popups and try again.";
    case "auth/cancelled-popup-request":
      return "Another sign-in attempt is already in progress.";
    case "auth/email-already-in-use":
      return "An account with this email already exists. Try signing in instead.";
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Invalid email or password.";
    case "auth/weak-password":
      return "Password is too weak. Use at least 8 characters.";
    case "auth/invalid-email":
      return "That email address is not valid.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a moment and try again.";
    case "auth/network-request-failed":
      return "Network error. Check your connection and try again.";
    case "auth/unauthorized-domain":
      return "This domain is not authorized for sign-in. Contact support.";
    case "auth/operation-not-allowed":
      return "This sign-in method is not enabled for the project.";
    default: {
      const message = (error as { message?: string })?.message ?? "Something went wrong.";
      return message.replace(/^Firebase:\s*/, "").replace(/\(auth\/[^)]+\)\.?$/, "").trim();
    }
  }
}