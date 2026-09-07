"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { doc, getDoc, getDocs, limit, orderBy, query, where, collection } from "firebase/firestore";
import { Layers, Shirt, Star, X } from "lucide-react";

import { db } from "@/lib/firebase";
import {
  COLLECTIONS,
  type InventoryDoc,
  type Player,
  type ScoreRun,
  type Session,
} from "@/lib/schema";
import {
  formatDateTime,
  formatDuration,
  formatNumber,
  formatRelative,
  initialsFrom,
  shortId,
} from "@/lib/format";
import { FluidLoader } from "@/components/fluid-loader";
import { ErrorState } from "@/components/ui/states";

interface Detail {
  inventory: InventoryDoc | null;
  runs: ScoreRun[];
  sessions: Session[];
}

/** Stamped with the player it belongs to, so staleness is detectable. */
interface Record {
  uid: string;
  detail: Detail | null;
  error: unknown;
}

/**
 * Slide out record for one player.
 *
 * The joins are done here, on demand, for a single userId. Loading every score
 * and session up front just to show one player's history would be the same
 * mistake the roster page avoids.
 */
export function PlayerDrawer({
  player,
  onClose,
}: {
  player: Player | null;
  onClose: () => void;
}) {
  const [record, setRecord] = useState<Record | null>(null);

  const uid = player?.uid ?? null;

  // Derived rather than assigned at the top of the effect. Writing state
  // synchronously inside an effect body triggers a cascading render.
  const fresh = Boolean(uid) && record?.uid === uid;
  const loading = Boolean(uid) && !fresh;
  const detail = fresh ? record?.detail ?? null : null;
  const error = fresh ? record?.error ?? null : null;

  useEffect(() => {
    if (!player) return;

    let cancelled = false;

    (async () => {
      try {
        const [inventorySnap, runsSnap, sessionsSnap] = await Promise.all([
          getDoc(doc(db, COLLECTIONS.inventory, player.uid)),
          getDocs(
            query(
              collection(db, COLLECTIONS.scores),
              where("userId", "==", player.uid),
              orderBy("timestamp", "desc"),
              limit(12),
            ),
          ),
          getDocs(
            query(
              collection(db, COLLECTIONS.sessions),
              where("userId", "==", player.uid),
              orderBy("startTime", "desc"),
              limit(12),
            ),
          ),
        ]);

        if (cancelled) return;

        setRecord({
          uid: player.uid,
          error: null,
          detail: {
            inventory: inventorySnap.exists() ? (inventorySnap.data() as InventoryDoc) : null,
            runs: runsSnap.docs.map((entry) => ({ id: entry.id, ...entry.data() }) as ScoreRun),
            sessions: sessionsSnap.docs.map(
              (entry) => ({ id: entry.id, ...entry.data() }) as Session,
            ),
          },
        });
      } catch (cause) {
        if (!cancelled) setRecord({ uid: player.uid, detail: null, error: cause });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [player]);

  // Escape closes, and the page behind stops scrolling while it is open.
  useEffect(() => {
    if (!player) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [player, onClose]);

  return (
    <AnimatePresence>
      {player ? (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-ink/35 backdrop-blur-sm"
          />

          <motion.aside
            role="dialog"
            aria-label={`Record for ${player.username ?? "player"}`}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.44, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[520px] flex-col border-l border-line bg-surface"
          >
            <header className="flex items-start gap-4 border-b border-line px-6 py-5">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-canopy text-[13px] font-semibold text-white">
                {initialsFrom(player.username, "??")}
              </div>

              <div className="min-w-0 flex-1">
                <h2 className="truncate font-display text-[18px] font-semibold tracking-tight text-ink">
                  {player.username || "Unnamed player"}
                </h2>
                <p className="truncate text-[12.5px] text-ink-soft">
                  {player.email || "No email recorded"}
                </p>
                <p className="mt-1 font-mono text-[11.5px] text-ink-faint">{shortId(player.uid)}</p>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Close record"
                className="rounded-xl p-2 text-ink-faint transition-colors duration-300 hover:bg-surface-high hover:text-ink"
              >
                <X size={17} strokeWidth={2} />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto">
              {/* Headline figures come from the player document itself, so they
                  render immediately while the joins are still in flight. */}
              <div className="grid grid-cols-3 gap-px border-b border-line bg-line">
                <Figure label="Total score" value={formatNumber(player.totalScore)} />
                <Figure label="Level" value={formatNumber(player.currentLevel)} />
                <Figure label="Coins" value={formatNumber(player.coins)} />
              </div>

              {loading ? (
                <div className="flex justify-center py-16">
                  <FluidLoader size={44} label="Reading player record" />
                </div>
              ) : error ? (
                <div className="p-5">
                  <ErrorState error={error} title="Could not read this player's history" />
                </div>
              ) : detail ? (
                <div className="space-y-7 p-6">
                  <Section title="Inventory" icon={<Shirt size={15} strokeWidth={2} />}>
                    {detail.inventory ? (
                      <div className="space-y-3">
                        <Row
                          label="Equipped"
                          value={detail.inventory.equippedSkin || player.equippedSkin || "default"}
                        />
                        <Row label="Coins held" value={formatNumber(detail.inventory.coins)} />

                        <div>
                          <p className="mb-2 text-[12.5px] text-ink-soft">
                            Owned items ({detail.inventory.ownedSkins?.length ?? 0})
                          </p>

                          <div className="flex flex-wrap gap-1.5">
                            {(detail.inventory.ownedSkins ?? []).map((skin) => (
                              <span
                                key={skin}
                                className="rounded-lg bg-base-deep px-2 py-1 font-mono text-[11.5px] text-ink-soft"
                              >
                                {skin}
                              </span>
                            ))}

                            {!detail.inventory.ownedSkins?.length ? (
                              <span className="text-[12.5px] text-ink-faint">
                                No items recorded.
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <Note>
                        No document at {COLLECTIONS.inventory}/{shortId(player.uid)}. The game
                        creates this on registration, so an older account may predate it.
                      </Note>
                    )}
                  </Section>

                  <Section title="Recent runs" icon={<Star size={15} strokeWidth={2} />}>
                    {detail.runs.length ? (
                      <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line">
                        {detail.runs.map((run) => (
                          <li key={run.id} className="flex items-center gap-3 bg-base px-3.5 py-3">
                            <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-canopy-soft font-display text-[11px] text-ink-faint">
                              {run.level ?? "?"}
                            </span>

                            <div className="min-w-0 flex-1">
                              <p className="text-[13px] text-ink">{formatNumber(run.score)} points</p>
                              <p className="text-[11.5px] text-ink-faint">
                                {formatRelative(run.timestamp)}
                              </p>
                            </div>

                            <Stars count={run.stars ?? 0} />
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <Note>This player has not completed a level yet.</Note>
                    )}
                  </Section>

                  <Section title="Sessions" icon={<Layers size={15} strokeWidth={2} />}>
                    {detail.sessions.length ? (
                      <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line">
                        {detail.sessions.map((session) => (
                          <li key={session.id} className="bg-base px-3.5 py-3">
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-[13px] text-ink">
                                Level {session.levelPlayed ?? "unknown"}
                              </p>

                              <span
                                className={`rounded px-1.5 py-0.5 text-[11px] ${
                                  session.endTime
                                    ? "bg-surface-high text-ink-faint"
                                    : "bg-canopy-soft text-canopy-deep"
                                }`}
                              >
                                {session.endTime ? "Finished" : "Open"}
                              </span>
                            </div>

                            <p className="mt-1 text-[11.5px] text-ink-faint">
                              {formatDateTime(session.startTime)} ·{" "}
                              {formatDuration(session.startTime, session.endTime)}
                            </p>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <Note>No sessions recorded for this player.</Note>
                    )}
                  </Section>
                </div>
              ) : null}
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface px-4 py-4">
      <p className="text-[11.5px] tracking-wide text-ink-faint">{label}</p>
      <p className="mt-1.5 font-display text-[20px] font-semibold text-ink tabular-nums">{value}</p>
    </div>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-2 text-ink-soft">
        <span className="text-ink-faint">{icon}</span>
        <h3 className="text-[13px] font-medium tracking-wide text-ink">{title}</h3>
      </div>
      {children}
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-[12.5px] text-ink-soft">{label}</span>
      <span className="font-mono text-[12.5px] text-ink-soft">{value}</span>
    </div>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl border border-line bg-base px-3.5 py-3 text-[12.5px] leading-relaxed text-ink-faint">
      {children}
    </p>
  );
}

function Stars({ count }: { count: number }) {
  return (
    <div className="flex shrink-0 items-center gap-0.5" aria-label={`${count} of 3 stars`}>
      {[0, 1, 2].map((index) => (
        <Star
          key={index}
          size={12}
          strokeWidth={2}
          className={index < count ? "text-sun-deep" : "text-line-strong"}
          fill={index < count ? "currentColor" : "none"}
        />
      ))}
    </div>
  );
}
