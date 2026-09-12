"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  deleteDoc,
  doc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { Ban, Eye, EyeOff, Info, ShieldOff, Trash2, Undo2 } from "lucide-react";

import { db } from "@/lib/firebase";
import { useLiveCollection } from "@/lib/use-collection";
import { useAuth } from "@/lib/auth-context";
import { COLLECTIONS, type BanDoc, type PostDoc } from "@/lib/schema";
import { formatNumber, formatRelative, initialsFrom, shortId } from "@/lib/format";
import { PageHeading, Panel, PanelHeader } from "@/components/ui/panel";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/states";
import { Reveal } from "@/components/reveal";

type Post = PostDoc & { id: string };
type Filter = "all" | "visible" | "hidden";

export default function CommunityPage() {
  const { admin } = useAuth();
  const posts = useLiveCollection<PostDoc>(COLLECTIONS.posts);
  const bans = useLiveCollection<BanDoc>(COLLECTIONS.bans);

  const [filter, setFilter] = useState<Filter>("all");
  const [pendingDelete, setPendingDelete] = useState<Post | null>(null);
  const [working, setWorking] = useState<string | null>(null);
  const [actionError, setActionError] = useState<unknown>(null);

  const bannedIds = useMemo(
    () => new Set(bans.data.map((entry) => entry.id)),
    [bans.data],
  );

  const visiblePosts = useMemo(() => {
    return [...posts.data]
      .filter((post) => {
        if (filter === "visible") return !post.hidden;
        if (filter === "hidden") return Boolean(post.hidden);
        return true;
      })
      .sort((a, b) => {
        const left = a.createdAt?.toMillis?.() ?? 0;
        const right = b.createdAt?.toMillis?.() ?? 0;
        return right - left;
      });
  }, [posts.data, filter]);

  /**
   * Hiding is preferred to deleting.
   *
   * A hidden post stays in the record, so a moderation decision can be reviewed
   * or reversed. Permanent deletion is kept behind a confirmation because there
   * is no undo once the document is gone.
   */
  async function setHidden(post: Post, hidden: boolean) {
    setWorking(post.id);
    setActionError(null);

    try {
      await updateDoc(doc(db, COLLECTIONS.posts, post.id), {
        hidden,
        hiddenBy: hidden ? (admin?.uid ?? null) : null,
        hiddenAt: hidden ? serverTimestamp() : null,
      });
    } catch (cause) {
      setActionError(cause);
    } finally {
      setWorking(null);
    }
  }

  async function removePost(post: Post) {
    setWorking(post.id);
    setActionError(null);

    try {
      await deleteDoc(doc(db, COLLECTIONS.posts, post.id));
      setPendingDelete(null);
    } catch (cause) {
      setActionError(cause);
    } finally {
      setWorking(null);
    }
  }

  async function toggleBan(post: Post) {
    const userId = post.userId;
    if (!userId) return;

    setWorking(post.id);
    setActionError(null);

    try {
      if (bannedIds.has(userId)) {
        await deleteDoc(doc(db, COLLECTIONS.bans, userId));
      } else {
        await setDoc(doc(db, COLLECTIONS.bans, userId), {
          userId,
          username: post.username ?? "",
          reason: "Removed by a moderator from the operations console.",
          bannedBy: admin?.uid ?? "",
          bannedAt: serverTimestamp(),
        });
      }
    } catch (cause) {
      setActionError(cause);
    } finally {
      setWorking(null);
    }
  }

  if (posts.error) {
    return (
      <div className="space-y-7">
        <PageHeading eyebrow="Moderation" title="Community" detail="Posts written by players." />
        <ErrorState error={posts.error} />
      </div>
    );
  }

  const hiddenCount = posts.data.filter((post) => post.hidden).length;

  return (
    <>
      <Reveal className="space-y-6">
        <PageHeading
          eyebrow="Moderation" title="Community"
          detail="Posts written by players, with the moderation actions applied against the same records the game reads."
        />

        <div className="reveal-item grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-3">
          <Tile label="Posts" value={formatNumber(posts.data.length)} />
          <Tile label="Hidden by a moderator" value={formatNumber(hiddenCount)} />
          <Tile label="Players banned" value={formatNumber(bans.data.length)} />
        </div>

        {actionError ? <ErrorState error={actionError} title="That action did not complete" /> : null}

        <Panel className="reveal-item overflow-hidden">
          <PanelHeader
            title="Posts"
            detail="Newest first. Hiding is reversible, deleting is not."
            action={
              <div className="flex rounded-xl border border-line-strong p-0.5">
                {(["all", "visible", "hidden"] as Filter[]).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setFilter(value)}
                    className={`rounded px-2.5 py-1 text-[12.5px] capitalize transition-colors duration-300 ${
                      filter === value
                        ? "bg-surface-high text-ink"
                        : "text-ink-faint hover:text-ink-soft"
                    }`}
                  >
                    {value}
                  </button>
                ))}
              </div>
            }
          />

          {posts.loading ? (
            <div className="space-y-3 p-5">
              {[0, 1, 2].map((index) => (
                <Skeleton key={index} className="h-24" />
              ))}
            </div>
          ) : posts.data.length === 0 ? (
            <EmptyState
              collection={COLLECTIONS.posts}
              title="No community posts have been written"
              detail="This console is ready to moderate posts as soon as something writes them. Nothing does yet: the Unity client has no posting screen, so the collection stays empty until one is added or the web side starts writing to it."
            />
          ) : visiblePosts.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <p className="text-[14px] text-ink">Nothing in this view</p>
              <p className="mt-2 text-[13px] text-ink-soft">
                {formatNumber(posts.data.length)} posts exist under a different filter.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {visiblePosts.map((post) => {
                const banned = post.userId ? bannedIds.has(post.userId) : false;
                const busy = working === post.id;

                return (
                  <li
                    key={post.id}
                    className={`px-5 py-4 transition-colors duration-300 ${
                      post.hidden ? "bg-base/60" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-canopy-soft text-[11px] font-semibold text-canopy-deep">
                        {initialsFrom(post.username, "??")}
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[13.5px] text-ink">
                            {post.username || "Unnamed player"}
                          </span>

                          <span className="font-mono text-[11.5px] text-ink-faint">
                            {shortId(post.userId)}
                          </span>

                          {post.hidden ? <Chip tone="amber">Hidden</Chip> : null}
                          {banned ? <Chip tone="rust">Banned</Chip> : null}
                        </div>

                        <p
                          className={`mt-2 whitespace-pre-wrap text-[13.5px] leading-relaxed ${
                            post.hidden ? "text-ink-faint line-through" : "text-ink-soft"
                          }`}
                        >
                          {post.body || "This post has no text."}
                        </p>

                        <p className="mt-2 text-[12px] text-ink-faint">
                          {formatRelative(post.createdAt)}
                        </p>
                      </div>

                      <div className="flex shrink-0 items-center gap-1">
                        <IconAction
                          label={post.hidden ? "Restore post" : "Hide post"}
                          onClick={() => void setHidden(post, !post.hidden)}
                          disabled={busy}
                        >
                          {post.hidden ? (
                            <Eye size={15} strokeWidth={2} />
                          ) : (
                            <EyeOff size={15} strokeWidth={2} />
                          )}
                        </IconAction>

                        <IconAction
                          label={banned ? "Lift ban" : "Ban this player"}
                          onClick={() => void toggleBan(post)}
                          disabled={busy || !post.userId}
                          tone={banned ? "default" : "amber"}
                        >
                          {banned ? (
                            <Undo2 size={15} strokeWidth={2} />
                          ) : (
                            <Ban size={15} strokeWidth={2} />
                          )}
                        </IconAction>

                        <IconAction
                          label="Delete permanently"
                          onClick={() => setPendingDelete(post)}
                          disabled={busy}
                          tone="rust"
                        >
                          <Trash2 size={15} strokeWidth={2} />
                        </IconAction>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        {/* Banned list, so a ban can be lifted without hunting for a post. */}
        {bans.data.length > 0 ? (
          <Panel className="reveal-item">
            <PanelHeader title="Banned players" detail="Held in the communityBans collection." />

            <ul className="divide-y divide-line">
              {bans.data.map((entry) => (
                <li key={entry.id} className="flex items-center gap-3 px-5 py-3.5">
                  <ShieldOff size={15} strokeWidth={2} className="shrink-0 text-coral-deep" />

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] text-ink">
                      {entry.username || "Unnamed player"}
                    </p>
                    <p className="font-mono text-[11.5px] text-ink-faint">{shortId(entry.id)}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => void deleteDoc(doc(db, COLLECTIONS.bans, entry.id))}
                    className="rounded-xl border border-line-strong px-2.5 py-1.5 text-[12.5px] text-ink-soft transition-colors duration-300 hover:bg-surface-high hover:text-ink"
                  >
                    Lift ban
                  </button>
                </li>
              ))}
            </ul>
          </Panel>
        ) : null}

        <div className="reveal-item flex items-start gap-3 rounded-lg border border-tide/20 bg-tide/6 px-4 py-3.5">
          <Info size={16} strokeWidth={2} className="mt-0.5 shrink-0 text-tide" />
          <p className="text-[13px] leading-relaxed text-ink-soft">
            Moderation writes to {COLLECTIONS.posts} and {COLLECTIONS.bans}. For a ban to stop
            somebody posting, whichever client writes posts has to check {COLLECTIONS.bans} first,
            and the security rules have to enforce it. Hiding a post here removes it from any client
            that filters on the hidden field.
          </p>
        </div>
      </Reveal>

      {/* Deletion is irreversible, so it asks first and says what is lost. */}
      <AnimatePresence>
        {pendingDelete ? (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setPendingDelete(null)}
              className="fixed inset-0 z-40 bg-ink/35 backdrop-blur-sm"
            />

            <motion.div
              role="alertdialog"
              aria-label="Confirm deletion"
              initial={{ opacity: 0, scale: 0.97, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 12 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-line-strong bg-surface p-6"
            >
              <h2 className="font-display text-[18px] font-semibold text-ink">Delete this post permanently</h2>

              <p className="mt-2.5 text-[13.5px] leading-relaxed text-ink-soft">
                The document is removed from Firestore and cannot be recovered. If you only want it
                off the feed, hide it instead and the record is kept.
              </p>

              <p className="mt-4 rounded-xl border border-line bg-base px-3.5 py-3 text-[13px] leading-relaxed text-ink-faint">
                {pendingDelete.body || "This post has no text."}
              </p>

              <div className="mt-6 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setPendingDelete(null)}
                  className="rounded-xl border border-line-strong px-3.5 py-2 text-[13px] text-ink-soft transition-colors duration-300 hover:bg-surface-high hover:text-ink"
                >
                  Keep it
                </button>

                <button
                  type="button"
                  onClick={() => void removePost(pendingDelete)}
                  disabled={working === pendingDelete.id}
                  className="rounded-xl bg-coral px-3.5 py-2 text-[13px] font-semibold text-white transition-colors duration-300 hover:opacity-90 disabled:opacity-50"
                >
                  {working === pendingDelete.id ? "Deleting" : "Delete permanently"}
                </button>
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface px-5 py-4">
      <p className="text-[12.5px] text-ink-soft">{label}</p>
      <p className="mt-2 font-display text-[26px] font-semibold leading-none text-ink tabular-nums">{value}</p>
    </div>
  );
}

function Chip({ tone, children }: { tone: "amber" | "rust"; children: React.ReactNode }) {
  const styles =
    tone === "amber"
      ? "border-sun/40 bg-sun-soft text-sun-deep"
      : "border-coral/40 bg-coral-soft text-coral-deep";

  return (
    <span className={`rounded border px-1.5 py-0.5 text-[11px] ${styles}`}>{children}</span>
  );
}

function IconAction({
  label,
  onClick,
  disabled,
  tone = "default",
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  tone?: "default" | "amber" | "rust";
  children: React.ReactNode;
}) {
  const hover =
    tone === "rust"
      ? "hover:text-coral-deep"
      : tone === "amber"
        ? "hover:text-sun-deep"
        : "hover:text-ink";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`rounded-xl p-2 text-ink-faint transition-colors duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-surface-high ${hover} disabled:cursor-not-allowed disabled:opacity-35`}
    >
      {children}
    </button>
  );
}
