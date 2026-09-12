"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import { auth, db } from "@/lib/firebase";
import { COLLECTIONS, type AdminProfile } from "@/lib/schema";

/**
 * Clearance is deliberately a small state machine rather than a boolean.
 *
 * "checking" is not the same as "denied". Treating them as one is what lets a
 * guard bounce a legitimate admin out during the second or so Firebase spends
 * restoring a saved session.
 */
export type Clearance = "checking" | "granted" | "denied";

interface AuthValue {
  user: User | null;
  admin: AdminProfile | null;
  clearance: Clearance;
  signIn: (email: string, password: string) => Promise<void>;
  leave: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

/** Raised when the credentials are valid but the account is not an admin. */
export class NotAnAdminError extends Error {
  constructor() {
    super("This account exists but has no admin clearance.");
    this.name = "NotAnAdminError";
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [admin, setAdmin] = useState<AdminProfile | null>(null);
  const [clearance, setClearance] = useState<Clearance>("checking");

  useEffect(() => {
    // Fires once on load with the restored session, then on every change.
    const stop = onAuthStateChanged(auth, async (next) => {
      if (!next) {
        setUser(null);
        setAdmin(null);
        setClearance("denied");
        return;
      }

      setUser(next);
      setClearance("checking");

      try {
        const snap = await getDoc(doc(db, COLLECTIONS.admins, next.uid));

        if (snap.exists() && snap.data()?.role === "admin") {
          setAdmin({ uid: next.uid, ...snap.data() } as AdminProfile);
          setClearance("granted");
        } else {
          // Signed in, but not staff. Deny clearance without touching the
          // session itself.
          //
          // Firebase Auth is one identity per browser, not one per tab or
          // route: signing out here used to end the session for every open
          // tab on this origin, including a player who had just signed in on
          // /community in a different tab. Denying clearance already keeps
          // this console's own UI and its Firestore rules closed to a
          // non-admin; it does not also need to log everyone else out.
          setAdmin(null);
          setClearance("denied");
        }
      } catch {
        // A rules rejection or a dropped connection lands here. Fail closed.
        setAdmin(null);
        setClearance("denied");
      }
    });

    return stop;
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
    const snap = await getDoc(doc(db, COLLECTIONS.admins, credential.user.uid));

    if (!snap.exists() || snap.data()?.role !== "admin") {
      // Same reasoning as the listener: these credentials might belong to a
      // real player with a session open elsewhere, so the failure here is
      // reported without signing that identity out of the browser.
      throw new NotAnAdminError();
    }
    // The listener above promotes clearance to "granted".
  }, []);

  const leave = useCallback(async () => {
    await signOut(auth);
  }, []);

  const value = useMemo<AuthValue>(
    () => ({ user, admin, clearance, signIn, leave }),
    [user, admin, clearance, signIn, leave],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider.");
  return value;
}
