"use client";

import { useMemo, useState, type FormEvent } from "react";
import { FirebaseError } from "firebase/app";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Leaf,
  Lock,
  LogOut,
  Mail,
  ShieldOff,
  Sparkles,
  Trash2,
} from "lucide-react";

import { db } from "@/lib/firebase";
import { usePlayerSession } from "@/lib/use-player-session";
import { useLiveCollection } from "@/lib/use-collection";
import { COLLECTIONS, type PostDoc } from "@/lib/schema";
import { formatRelative, initialsFrom } from "@/lib/format";
import { CountUp } from "@/components/count-up";
import { FluidLoader } from "@/components/fluid-loader";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/states";

/** Firebase's own codes, translated for a player rather than an operator. */
function explainSignIn(cause: unknown): string {
  if (cause instanceof FirebaseError) {
    switch (cause.code) {
      case "auth/invalid-credential":
      case "auth/wrong-password":
      case "auth/user-not-found":
        return "That email or password doesn't match an Eco Hero account.";
      case "auth/invalid-email":
        return "That doesn't look like a valid email address.";
      case "auth/user-disabled":
        return "This account has been disabled.";
      case "auth/too-many-requests":
        return "Too many attempts. Wait a few minutes and try again.";
      case "auth/network-request-failed":
        return "Couldn't reach the server. Check your connection.";
      default:
        return `Sign in failed (${cause.code}).`;
    }
  }
  return "Sign in failed for an unexpected reason.";
}

const BODY_LIMIT = 2000;

export default function CommunityPage() {
  const session = usePlayerSession();

  return (
    <main className="rise mx-auto min-h-screen w-full max-w-[720px] px-5 py-10 sm:px-6 sm:py-14">
      <Header session={session} />

      {session.status === "checking" ? (
        <div className="flex min-h-[50vh] items-center justify-center">
          <FluidLoader size={52} label="Restoring your session" />
        </div>
      ) : session.status === "signedOut" ? (
        <SignInCard onSignIn={session.signIn} />
      ) : (
        <SignedInView session={session} />
      )}
    </main>
  );
}

function Header({ session }: { session: ReturnType<typeof usePlayerSession> }) {
  return (
    <div className="mb-8 flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <span className="flex size-10 items-center justify-center rounded-2xl bg-canopy shadow-[0_8px_18px_-8px_rgba(47,168,79,0.9)]">
          <Leaf size={19} strokeWidth={2.25} className="text-white" />
        </span>
        <div>
          <p className="font-display text-[16px] font-semibold tracking-tight text-ink">
            Eco Hero
          </p>
          <p className="text-[11.5px] text-ink-soft">Community</p>
        </div>
      </div>

      {session.status === "signedIn" ? (
        <button
          type="button"
          onClick={() => void session.leave()}
          className="press flex items-center gap-1.5 rounded-xl border border-line-strong px-3 py-2 text-[13px] text-ink-soft hover:bg-surface-high hover:text-ink"
        >
          <LogOut size={14} strokeWidth={2} />
          Sign out
        </button>
      ) : null}
    </div>
  );
}

function SignInCard({
  onSignIn,
}: {
  onSignIn: (email: string, password: string) => Promise<void>;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [reveal, setReveal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;

    setBusy(true);
    setMessage("");

    try {
      await onSignIn(email, password);
      // onAuthStateChanged in usePlayerSession promotes the view once this resolves.
    } catch (cause) {
      setMessage(explainSignIn(cause));
      setBusy(false);
    }
  }

  return (
    <div className="rounded-3xl border border-line bg-surface p-7 shadow-[0_2px_4px_rgba(20,48,28,0.05),0_28px_60px_-30px_rgba(20,48,28,0.4)] sm:p-9">
      <span className="inline-flex items-center gap-2 rounded-full bg-canopy-soft px-3 py-1.5 text-[11.5px] font-semibold uppercase tracking-[0.12em] text-canopy-deep">
        <Sparkles size={14} strokeWidth={2.25} />
        Players only
      </span>

      <h1 className="mt-5 font-display text-[24px] font-semibold leading-tight tracking-tight text-ink">
        Sign in with your Eco Hero account
      </h1>

      <p className="mt-2 text-[13.5px] leading-relaxed text-ink-soft">
        Use the same email and password you play the game with. There&apos;s nothing new to
        create here.
      </p>

      <form onSubmit={submit} className="mt-7 space-y-5" noValidate>
        <Field id="email" label="Email address" icon={<Mail size={16} strokeWidth={2} />}>
          <input
            id="email"
            type="email"
            autoComplete="username"
            inputMode="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={busy}
            required
            placeholder="you@example.com"
            className="w-full bg-transparent py-3 pl-10 pr-3 text-[14px] text-ink outline-none placeholder:text-ink-faint disabled:opacity-50"
          />
        </Field>

        <Field id="password" label="Password" icon={<Lock size={16} strokeWidth={2} />}>
          <input
            id="password"
            type={reveal ? "text" : "password"}
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={busy}
            required
            placeholder="Enter password"
            className="w-full bg-transparent py-3 pl-10 pr-11 text-[14px] text-ink outline-none placeholder:text-ink-faint disabled:opacity-50"
          />
          <button
            type="button"
            onClick={() => setReveal((value) => !value)}
            aria-label={reveal ? "Hide password" : "Show password"}
            className="press absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-ink-faint hover:text-ink-soft"
          >
            {reveal ? <EyeOff size={16} strokeWidth={2} /> : <Eye size={16} strokeWidth={2} />}
          </button>
        </Field>

        {message ? (
          <p
            role="alert"
            className="rounded-xl border border-coral/30 bg-coral-soft px-4 py-3 text-[13px] leading-relaxed text-coral-deep"
          >
            {message}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={busy}
          className="press flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-canopy font-display text-[15px] font-semibold text-white shadow-[0_10px_22px_-12px_rgba(47,168,79,1)] hover:bg-canopy-deep disabled:cursor-not-allowed disabled:opacity-70"
        >
          {busy ? (
            <>
              <span className="size-4 animate-spin rounded-full border-2 border-white/35 border-t-white" />
              Signing in
            </>
          ) : (
            <>
              Sign in
              <ArrowRight size={17} strokeWidth={2.25} />
            </>
          )}
        </button>
      </form>

      <p className="mt-7 border-t border-line pt-5 text-[12.5px] leading-relaxed text-ink-faint">
        No account yet? Play a level in Eco Hero first — this page shows the same profile the
        game already knows about.
      </p>
    </div>
  );
}

function SignedInView({ session }: { session: ReturnType<typeof usePlayerSession> }) {
  const { profile, inventory, ban } = session;
  const username = profile?.username || session.user?.email?.split("@")[0] || "Player";
  // inventory is the collection the coins/skins drift note names as the
  // source of truth; users.coins is the fallback for a profile that predates it.
  const coins = inventory?.coins ?? profile?.coins ?? 0;
  const score = profile?.totalScore ?? 0;
  const level = profile?.currentLevel ?? 1;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-px overflow-hidden rounded-2xl border border-line bg-line">
        <Stat label="Score" value={score} tone="canopy" />
        <Stat label="Coins" value={coins} tone="sun" />
        <Stat label="Level" value={level} tone="tide" />
      </div>

      {!profile ? (
        <p className="rounded-xl border border-line bg-surface-high px-4 py-3 text-[13px] leading-relaxed text-ink-soft">
          No game profile found yet for this account. Stats appear here once a level has been
          played.
        </p>
      ) : null}

      <Composer username={username} uid={session.user!.uid} ban={ban} />
      <Feed uid={session.user!.uid} />
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "canopy" | "sun" | "tide";
}) {
  const ink = { canopy: "text-canopy-deep", sun: "text-sun-deep", tide: "text-tide-deep" }[tone];
  return (
    <div className="bg-surface px-4 py-4 text-center sm:px-5">
      <p className="text-[11.5px] text-ink-soft">{label}</p>
      <CountUp
        value={value}
        className={`mt-1.5 block font-display text-[24px] font-semibold leading-none ${ink}`}
      />
    </div>
  );
}

function Composer({
  username,
  uid,
  ban,
}: {
  username: string;
  uid: string;
  ban: ReturnType<typeof usePlayerSession>["ban"];
}) {
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);

  if (ban) {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-coral/30 bg-coral-soft px-5 py-4">
        <ShieldOff size={18} strokeWidth={2} className="mt-0.5 shrink-0 text-coral-deep" />
        <div>
          <p className="text-[13.5px] font-medium text-coral-deep">
            You can&apos;t post to the community right now.
          </p>
          {ban.reason ? (
            <p className="mt-1 text-[13px] leading-relaxed text-coral-deep/80">{ban.reason}</p>
          ) : null}
        </div>
      </div>
    );
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const trimmed = body.trim();
    if (!trimmed || busy) return;

    setBusy(true);
    setError(null);

    try {
      await addDoc(collection(db, COLLECTIONS.posts), {
        userId: uid,
        username,
        body: trimmed,
        createdAt: serverTimestamp(),
        hidden: false,
      });
      setBody("");
    } catch (cause) {
      setError(cause);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl border border-line bg-surface p-4 shadow-[0_1px_2px_rgba(20,48,28,0.05),0_8px_22px_-12px_rgba(20,48,28,0.18)] sm:p-5"
    >
      <textarea
        value={body}
        onChange={(event) => setBody(event.target.value.slice(0, BODY_LIMIT))}
        disabled={busy}
        rows={3}
        placeholder="Share feedback, a tip, or what you thought of the game..."
        className="w-full resize-none rounded-xl border border-line-strong bg-base/60 p-3.5 text-[14px] text-ink outline-none placeholder:text-ink-faint focus:border-canopy focus:bg-surface focus:shadow-[0_0_0_4px_rgba(47,168,79,0.14)] disabled:opacity-60"
      />

      <div className="mt-3 flex items-center justify-between">
        <span className="text-[11.5px] text-ink-faint">
          {body.length}/{BODY_LIMIT}
        </span>

        <button
          type="submit"
          disabled={busy || !body.trim()}
          className="press flex items-center gap-1.5 rounded-xl bg-canopy px-4 py-2 text-[13.5px] font-semibold text-white hover:bg-canopy-deep disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? "Posting" : "Post"}
        </button>
      </div>

      {error ? (
        <p className="mt-3 rounded-xl border border-coral/30 bg-coral-soft px-3.5 py-2.5 text-[12.5px] text-coral-deep">
          That didn&apos;t post. Try again in a moment.
        </p>
      ) : null}
    </form>
  );
}

type Post = PostDoc & { id: string };

function Feed({ uid }: { uid: string }) {
  const posts = useLiveCollection<PostDoc>(
    COLLECTIONS.posts,
    () => [orderBy("createdAt", "desc")],
    "createdAt-desc",
  );

  // Hidden posts stay readable to the moderation console on purpose, so a
  // decision can be reviewed. This is the client that has to leave them out.
  const visible = useMemo(() => posts.data.filter((post) => !post.hidden), [posts.data]);

  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<unknown>(null);

  async function removeOwnPost(post: Post) {
    setDeletingId(post.id);
    setDeleteError(null);

    try {
      await deleteDoc(doc(db, COLLECTIONS.posts, post.id));
      setConfirmingId(null);
    } catch (cause) {
      setDeleteError(cause);
    } finally {
      setDeletingId(null);
    }
  }

  if (posts.error) return <ErrorState error={posts.error} title="Couldn't load the community feed" />;

  if (posts.loading) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((index) => (
          <Skeleton key={index} className="h-20 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (visible.length === 0) {
    return (
      <EmptyState
        collection={COLLECTIONS.posts}
        title="Nobody has posted yet"
        detail="Be the first to leave feedback for the Eco Hero community."
      />
    );
  }

  return (
    <div className="space-y-3">
      {deleteError ? (
        <p className="rounded-xl border border-coral/30 bg-coral-soft px-3.5 py-2.5 text-[12.5px] text-coral-deep">
          That post couldn&apos;t be deleted. Try again in a moment.
        </p>
      ) : null}

      <ul className="space-y-3">
        {visible.map((post) => {
          const isOwn = post.userId === uid;
          const confirming = confirmingId === post.id;
          const busy = deletingId === post.id;

          return (
            <li
              key={post.id}
              className="flex items-start gap-3 rounded-2xl border border-line bg-surface px-4 py-3.5"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-canopy-soft text-[11px] font-semibold text-canopy-deep">
                {initialsFrom(post.username, "??")}
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="text-[13.5px] font-medium text-ink">
                    {post.username || "A player"}
                  </span>
                  <span className="text-[11.5px] text-ink-faint">
                    {formatRelative(post.createdAt)}
                  </span>
                </div>

                <p className="mt-1.5 whitespace-pre-wrap text-[13.5px] leading-relaxed text-ink-soft">
                  {post.body}
                </p>

                {isOwn && confirming ? (
                  <div className="mt-2.5 flex items-center gap-2">
                    <span className="text-[12.5px] text-ink-soft">Delete this post?</span>
                    <button
                      type="button"
                      onClick={() => void removeOwnPost(post)}
                      disabled={busy}
                      className="press rounded-lg bg-coral px-2.5 py-1 text-[12px] font-semibold text-white hover:opacity-90 disabled:opacity-50"
                    >
                      {busy ? "Deleting" : "Delete"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmingId(null)}
                      disabled={busy}
                      className="press rounded-lg border border-line-strong px-2.5 py-1 text-[12px] text-ink-soft hover:bg-surface-high"
                    >
                      Cancel
                    </button>
                  </div>
                ) : null}
              </div>

              {isOwn && !confirming ? (
                <button
                  type="button"
                  onClick={() => setConfirmingId(post.id)}
                  aria-label="Delete post"
                  title="Delete post"
                  className="press shrink-0 rounded-xl p-2 text-ink-faint hover:bg-surface-high hover:text-coral-deep"
                >
                  <Trash2 size={15} strokeWidth={2} />
                </button>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Field({
  id,
  label,
  icon,
  children,
}: {
  id: string;
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-[12.5px] font-medium text-ink-soft">
        {label}
      </label>
      <div className="relative rounded-xl border border-line-strong bg-base/60 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] focus-within:border-canopy focus-within:bg-surface focus-within:shadow-[0_0_0_4px_rgba(47,168,79,0.14)]">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint">
          {icon}
        </span>
        {children}
      </div>
    </div>
  );
}
