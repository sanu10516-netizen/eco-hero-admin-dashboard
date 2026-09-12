"use client";

import { useCallback, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";

import { auth, db } from "@/lib/firebase";
import { COLLECTIONS, type BanDoc, type InventoryDoc, type PlayerDoc } from "@/lib/schema";

/**
 * Sign in for an ordinary player, deliberately separate from useAuth.
 *
 * useAuth is wired to the admins collection: it drops any session that is not
 * on the roster, which is correct for the operations console and wrong for
 * everyone the game actually has. This hook asks Firebase for nothing more
 * than a valid account, the same one a player already signed in with inside
 * the game, since it is the same Firebase project underneath.
 */
export type SessionStatus = "checking" | "signedOut" | "signedIn";

export interface PlayerSession {
  status: SessionStatus;
  user: User | null;
  profile: PlayerDoc | null;
  inventory: InventoryDoc | null;
  ban: BanDoc | null;
  signIn: (email: string, password: string) => Promise<void>;
  leave: () => Promise<void>;
}

export function usePlayerSession(): PlayerSession {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<SessionStatus>("checking");
  const [profile, setProfile] = useState<PlayerDoc | null>(null);
  const [inventory, setInventory] = useState<InventoryDoc | null>(null);
  const [ban, setBan] = useState<BanDoc | null>(null);

  useEffect(() => {
    return onAuthStateChanged(auth, (next) => {
      setUser(next);
      setStatus(next ? "signedIn" : "signedOut");

      if (!next) {
        setProfile(null);
        setInventory(null);
        setBan(null);
      }
    });
  }, []);

  // Three small documents, all keyed by uid, all live: a ban applied by a
  // moderator while this tab is open takes the composer away without a
  // reload, the same immediacy the rest of the console relies on.
  useEffect(() => {
    if (!user) return;

    const stopProfile = onSnapshot(doc(db, COLLECTIONS.players, user.uid), (snap) => {
      setProfile(snap.exists() ? (snap.data() as PlayerDoc) : null);
    });

    const stopInventory = onSnapshot(doc(db, COLLECTIONS.inventory, user.uid), (snap) => {
      setInventory(snap.exists() ? (snap.data() as InventoryDoc) : null);
    });

    const stopBan = onSnapshot(doc(db, COLLECTIONS.bans, user.uid), (snap) => {
      setBan(snap.exists() ? (snap.data() as BanDoc) : null);
    });

    return () => {
      stopProfile();
      stopInventory();
      stopBan();
    };
  }, [user]);

  const signIn = useCallback(async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email.trim(), password);
  }, []);

  const leave = useCallback(async () => {
    await signOut(auth);
  }, []);

  return { status, user, profile, inventory, ban, signIn, leave };
}
