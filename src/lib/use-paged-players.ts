"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  collection,
  endAt,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  startAt,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import { COLLECTIONS, type Player, type PlayerDoc } from "@/lib/schema";

export type SortKey = "totalScore" | "currentLevel" | "username";

interface Options {
  pageSize?: number;
  sortKey?: SortKey;
  descending?: boolean;
  search?: string;
}

interface Outcome {
  token: string;
  rows: Player[];
  hasNext: boolean;
  error: unknown;
}

export function usePagedPlayers({
  pageSize = 25,
  sortKey = "totalScore",
  descending = true,
  search = "",
}: Options = {}) {
  const term = search.trim();

  const shape = `${sortKey}|${descending ? "desc" : "asc"}|${term}|${pageSize}`;

  const [view, setView] = useState({ shape, page: 0 });

  const [outcome, setOutcome] = useState<Outcome>({
    token: "",
    rows: [],
    hasNext: false,
    error: null,
  });

  if (view.shape !== shape) setView({ shape, page: 0 });

  const page = view.shape === shape ? view.page : 0;
  const cursors = useRef<QueryDocumentSnapshot<DocumentData>[]>([]);

  const token = `${shape}|${page}`;

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        if (page === 0) cursors.current = [];

        const ref = collection(db, COLLECTIONS.players);
        const constraints = [];

        if (term) {
          constraints.push(orderBy("username"), startAt(term), endAt(`${term}\uf8ff`));
        } else {
          constraints.push(orderBy(sortKey, descending ? "desc" : "asc"));

          const cursor = cursors.current[page - 1];
          if (page > 0 && cursor) constraints.push(startAfter(cursor));
        }

        constraints.push(limit(pageSize + 1));

        const snapshot = await getDocs(query(ref, ...constraints));
        if (cancelled) return;

        const docs = snapshot.docs;
        const more = docs.length > pageSize;
        const visible = more ? docs.slice(0, pageSize) : docs;

        if (!term && visible.length) {
          cursors.current[page] = visible[visible.length - 1];
        }

        setOutcome({
          token,
          rows: visible.map((entry) => ({ uid: entry.id, ...(entry.data() as PlayerDoc) })),
          hasNext: !term && more,
          error: null,
        });
      } catch (cause) {
        if (!cancelled) setOutcome({ token, rows: [], hasNext: false, error: cause });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, term, sortKey, descending, page, pageSize]);

  const settled = outcome.token === token;

  const next = useCallback(
    () => setView((current) => ({ ...current, page: current.page + 1 })),
    [],
  );

  const previous = useCallback(
    () => setView((current) => ({ ...current, page: Math.max(0, current.page - 1) })),
    [],
  );

  return useMemo(
    () => ({
      rows: settled ? outcome.rows : [],
      loading: !settled,
      error: settled ? outcome.error : null,
      page,
      hasNext: settled && outcome.hasNext,
      hasPrevious: page > 0 && !term,
      next,
      previous,
      searching: Boolean(term),
    }),
    [settled, outcome, page, term, next, previous],
  );
}
