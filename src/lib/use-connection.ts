"use client";

import { useEffect, useState } from "react";
import { collection, limit, onSnapshot, query } from "firebase/firestore";

import { db } from "@/lib/firebase";
import { COLLECTIONS } from "@/lib/schema";

export type ConnectionState = "connecting" | "live" | "offline";

/**
 * Reports whether the console is actually receiving data.
 *
 * A single document listener is enough to tell the difference, and it costs one
 * read. The browser online event is folded in because a dropped network can
 * leave an existing listener idle rather than erroring, which would otherwise
 * keep the indicator green while nothing is arriving.
 */
export function useConnection(): ConnectionState {
  const [state, setState] = useState<ConnectionState>("connecting");

  useEffect(() => {
    const probe = query(collection(db, COLLECTIONS.players), limit(1));

    const stop = onSnapshot(
      probe,
      (snapshot) => {
        // fromCache with no pending writes means Firestore has fallen back to
        // its local copy and is no longer talking to the server.
        setState(snapshot.metadata.fromCache && !navigator.onLine ? "offline" : "live");
      },
      () => setState("offline"),
    );

    const online = () => setState("live");
    const offline = () => setState("offline");

    window.addEventListener("online", online);
    window.addEventListener("offline", offline);

    // Not checked synchronously here. The server renders "connecting", so
    // reading navigator during the first client pass would produce a hydration
    // mismatch. A device that is already offline reaches the same state through
    // the listener error below.

    return () => {
      stop();
      window.removeEventListener("online", online);
      window.removeEventListener("offline", offline);
    };
  }, []);

  return state;
}
