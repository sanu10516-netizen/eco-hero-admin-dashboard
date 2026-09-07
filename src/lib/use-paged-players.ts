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

/**
 * Cursor paged read of the player roster.
 *
 * The console this replaces opened a live listener on the entire users
 * collection on two separate pages, downloading every player document on every
 * visit. That is survivable with twenty test accounts and ruinous at any real
 * size, so this fetches one page at a time and remembers the cursors it has
 * already walked.
 *
 * Searching switches the ordering to username and uses a range query, because
 * Firestore has no substring matching. It is a prefix match: "sam" finds
 * "Sameer" but not "Wasam". That is a property of the database rather than a
 * limitation of this screen, and the interface says so.
 */
export function usePagedPlayers({
  pageSize = 25,
  sortKey = "totalScore",
  descending = true,
  search = "",
}: Options = {}) {
  const term = search.trim();

  // Identifies the shape of the query. Any change invalidates walked cursors.
  const shape = `${sortKey}|${descending ? "desc" : "asc"}|${term}|${pageSize}`;

  // Shape and page travel together so a change of ordering cannot leave the
  // reader stranded on page four of a list that no longer has one.
  const [view, setView] = useState({ shape, page: 0 });

  const [outcome, setOutcome] = useState<Outcome>({
    token: "",
    rows: [],
    hasNext: false,
    error: null,
  });

  // Adjusting state during render is the supported way to reset when an input
  // changes. React discards this pass and re-renders immediately, so the table
  // never paints a frame of the previous result under the new ordering.
  if (view.shape !== shape) setView({ shape, page: 0 });

  const page = view.shape === shape ? view.page : 0;
  const cursors = useRef<QueryDocumentSnapshot<DocumentData>[]>([]);

  const token = `${shape}|${page}`;

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        // Cleared here rather than during render, since a ref may only be
        // touched inside an effect. Page zero means the trail restarts.
        if (page === 0) cursors.current = [];

        const ref = collection(db, COLLECTIONS.players);
        const constraints = [];

        if (term) {
          // Prefix range. U+F8FF sorts above any ordinary character, so the
          // pair reads as "anything beginning with this".
          constraints.push(orderBy("username"), startAt(term), endAt(`${term}\uf8ff`));
        } else {
          constraints.push(orderBy(sortKey, descending ? "desc" : "asc"));

          const cursor = cursors.current[page - 1];
          if (page > 0 && cursor) constraints.push(startAfter(cursor));
        }

        // One extra row reveals whether a further page exists, without paying
        // for a separate count query.
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

  // Derived rather than assigned, so no state is written during render.
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
