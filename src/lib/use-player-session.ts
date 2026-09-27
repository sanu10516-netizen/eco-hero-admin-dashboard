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
