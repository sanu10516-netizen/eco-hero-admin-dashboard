"use client";

import { useEffect, useRef, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  type DocumentData,
  type QueryConstraint,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

export interface LiveResult<T> {
  data: T[];
  loading: boolean;
  error: unknown;
  /** True once the first snapshot has arrived, empty or not. */
  settled: boolean;
}

interface Snapshot<T> {
  /** Identifies which subscription produced this state. */
  token: string;
  data: T[];
  error: unknown;
}

/**
 * Realtime read of a collection.
 *
 * Constraints are supplied as a factory plus an explicit key. Building an array
 * inline creates a new reference every render, which would tear down and
 * rebuild the listener each time and quietly multiply the read count. The key
 * is what the subscription actually depends on.
 *
 * The query is assembled inside the effect rather than in a memo, so nothing is
 * read from a ref while rendering, and state carries the token of the
 * subscription that produced it so "loading" can be derived instead of assigned.
 */
export function useLiveCollection<T extends DocumentData>(
  path: string,
  build?: () => QueryConstraint[],
  key = "",
): LiveResult<T & { id: string }> {
  const token = `${path}|${key}`;

  const [snapshot, setSnapshot] = useState<Snapshot<T & { id: string }>>({
    token: "",
    data: [],
    error: null,
  });

  // Written in an effect, read only inside effects, never during render.
  const buildRef = useRef(build);

  useEffect(() => {
    buildRef.current = build;
  });

  useEffect(() => {
    const ref = collection(db, path);
    const constraints = buildRef.current?.() ?? [];
    const target = constraints.length ? query(ref, ...constraints) : ref;

    const stop = onSnapshot(
      target,
      (result) => {
        setSnapshot({
          token,
          data: result.docs.map((entry) => ({ id: entry.id, ...(entry.data() as T) })),
          error: null,
        });
      },
      (cause) => {
        // Surfaced rather than logged. A rules rejection is information the
        // operator needs, not something to hide behind an empty table.
        setSnapshot({ token, data: [], error: cause });
      },
    );

    return stop;
  }, [path, token]);

  const settled = snapshot.token === token;

  return {
    data: settled ? snapshot.data : [],
    error: settled ? snapshot.error : null,
    loading: !settled,
    settled,
  };
}
