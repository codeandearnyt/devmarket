import { trpc } from "@/lib/trpc";
import { TRPCClientError } from "@trpc/client";
import {
  createUserWithEmailAndPassword,
  onIdTokenChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User as FirebaseUser,
} from "firebase/auth";
import {
  createGoogleProvider,
  describeFirebaseError,
  getFirebaseAuth,
} from "@/lib/firebase";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export type AuthUser = {
  id: number;
  openId: string;
  name: string | null;
  email: string | null;
  photoUrl: string | null;
  loginMethod: string | null;
  role: "user" | "admin";
} | null;

/**
 * Single source of truth for auth on the client.
 *
 * Firebase owns the credential; our backend owns the profile and the httpOnly
 * session cookie. `onIdTokenChanged` fires on sign-in, sign-out, and hourly
 * token refresh, so every one of those paths re-exchanges the fresh ID token
 * for a session cookie and keeps the two sides in step.
 */
export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath } = options ?? {};
  const utils = trpc.useUtils();

  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [initialising, setInitialising] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  const sessionMutation = trpc.auth.session.useMutation({
    onSuccess: user => {
      setAuthError(null);
      utils.auth.me.setData(undefined, user);
    },
    onError: error => {
      setAuthError(error.message);
    },
  });

  // Mirrors the latest mutation into a ref so the Firebase token callback can
  // call it without needing to re-subscribe on every render.
  const exchanging = useRef(false);
  const sessionMutationRef = useRef<typeof sessionMutation | null>(null);
  sessionMutationRef.current = sessionMutation;

  const exchangeToken = useCallback(
    async (user: FirebaseUser | null) => {
      if (!user) return;
      if (exchanging.current) return;
      exchanging.current = true;
      try {
        const idToken = await user.getIdToken();
        await sessionMutationRef.current?.mutateAsync({ idToken });
      } catch (error) {
        setAuthError(describeFirebaseError(error));
      } finally {
        exchanging.current = false;
      }
    },
    []
  );

  useEffect(() => {
    const auth = getFirebaseAuth();
    const unsubscribe = onIdTokenChanged(auth, async user => {
      setFirebaseUser(user);
      setInitialising(false);
      if (user) {
        await exchangeToken(user);
      } else {
        utils.auth.me.setData(undefined, null);
      }
    });
    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logoutMutation = trpc.auth.logout.useMutation();

  const logout = useCallback(async () => {
    setAuthError(null);
    try {
      // Firebase owns the credential: signing out there is what stops the
      // onIdTokenChanged loop from re-establishing the session.
      await signOut(getFirebaseAuth());
    } catch {
      // Ignore: still clear the server session below.
    }
    try {
      await logoutMutation.mutateAsync();
    } catch (error) {
      if (!(error instanceof TRPCClientError && error.data?.code === "UNAUTHORIZED")) {
        // Non-fatal: the cookie is cleared client-side regardless.
        console.warn("[Auth] Logout request failed:", error);
      }
    } finally {
      try {
        sessionStorage.removeItem("manus-cookie");
      } catch {}
      utils.auth.me.setData(undefined, null);
      await utils.auth.me.invalidate();
    }
  }, [logoutMutation, utils]);

  const signInWithGoogle = useCallback(async () => {
    setAuthError(null);
    try {
      const auth = getFirebaseAuth();
      const credential = await signInWithPopup(auth, createGoogleProvider());
      await exchangeToken(credential.user);
      return credential.user;
    } catch (error) {
      const message = describeFirebaseError(error);
      setAuthError(message);
      throw new Error(message);
    }
  }, [exchangeToken]);

  const registerWithEmail = useCallback(
    async (email: string, password: string, name?: string) => {
      setAuthError(null);
      try {
        const auth = getFirebaseAuth();
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        if (name?.trim()) {
          await updateProfile(credential.user, { displayName: name.trim() });
          // Refresh so the ID token carries the new display name.
          await credential.user.getIdToken(true);
        }
        await exchangeToken(credential.user);
        return credential.user;
      } catch (error) {
        const message = describeFirebaseError(error);
        setAuthError(message);
        throw new Error(message);
      }
    },
    [exchangeToken]
  );

  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      setAuthError(null);
      try {
        const auth = getFirebaseAuth();
        const credential = await signInWithEmailAndPassword(auth, email, password);
        await exchangeToken(credential.user);
        return credential.user;
      } catch (error) {
        const message = describeFirebaseError(error);
        setAuthError(message);
        throw new Error(message);
      }
    },
    [exchangeToken]
  );

  const state = useMemo(() => {
    const user = (meQuery.data ?? null) as AuthUser;
    return {
      // The local row is what the app renders (it carries `role`), but we are
      // considered signed in as soon as Firebase has a credential.
      user,
      firebaseUser,
      loading:
        initialising ||
        meQuery.isLoading ||
        sessionMutation.isPending ||
        (Boolean(firebaseUser) && !user),
      error: authError ?? meQuery.error ?? null,
      isAuthenticated: Boolean(user) || Boolean(firebaseUser),
    };
  }, [
    meQuery.data,
    meQuery.error,
    meQuery.isLoading,
    sessionMutation.isPending,
    firebaseUser,
    initialising,
    authError,
  ]);

  useEffect(() => {
    if (!redirectOnUnauthenticated) return;
    if (state.loading) return;
    if (state.isAuthenticated) return;
    if (typeof window === "undefined") return;
    if (redirectPath && window.location.pathname === redirectPath) return;

    window.location.hash = `#${redirectPath ?? "/login"}`;
  }, [redirectOnUnauthenticated, redirectPath, state.loading, state.isAuthenticated]);

  return {
    ...state,
    refresh: () => meQuery.refetch(),
    logout,
    signInWithGoogle,
    signInWithEmail,
    registerWithEmail,
  };
}