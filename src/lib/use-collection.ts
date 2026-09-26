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
  settled: boolean;
}

interface Snapshot<T> {
  token: string;
  data: T[];
  error: unknown;
}

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
