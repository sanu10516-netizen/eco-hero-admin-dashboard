"use client";

import { useEffect, useState } from "react";
import { collection, limit, onSnapshot, query } from "firebase/firestore";

import { db } from "@/lib/firebase";
import { COLLECTIONS } from "@/lib/schema";

export type ConnectionState = "connecting" | "live" | "offline";

export function useConnection(): ConnectionState {
  const [state, setState] = useState<ConnectionState>("connecting");

  useEffect(() => {
    const probe = query(collection(db, COLLECTIONS.players), limit(1));

    const stop = onSnapshot(
      probe,
      (snapshot) => {
        setState(snapshot.metadata.fromCache && !navigator.onLine ? "offline" : "live");
      },
      () => setState("offline"),
    );

    const online = () => setState("live");
    const offline = () => setState("offline");

    window.addEventListener("online", online);
    window.addEventListener("offline", offline);

    return () => {
      stop();
      window.removeEventListener("online", online);
      window.removeEventListener("offline", offline);
    };
  }, []);

  return state;
}
