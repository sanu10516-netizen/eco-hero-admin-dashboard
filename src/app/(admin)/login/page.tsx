"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff, Leaf, Lock, Mail, ShieldCheck } from "lucide-react";
import { FirebaseError } from "firebase/app";

import { NotAnAdminError, useAuth } from "@/lib/auth-context";
import { RestorationScene } from "@/components/viz/restoration-scene";
import { FluidLoader } from "@/components/fluid-loader";

type Phase = "idle" | "authenticating" | "verifying" | "error";

function explain(cause: unknown): string {
  if (cause instanceof NotAnAdminError) {
    return "Those credentials are valid, but the account has no admin clearance. An existing administrator must add a document at admins/{uid} with role set to admin.";
  }

  if (cause instanceof FirebaseError) {
    switch (cause.code) {
      case "auth/invalid-credential":
      case "auth/wrong-password":
      case "auth/user-not-found":
        return "Email address or password is not correct.";
      case "auth/invalid-email":
        return "That email address is not formatted correctly.";
      case "auth/user-disabled":
        return "This account has been disabled in Firebase Authentication.";
      case "auth/too-many-requests":
        return "Firebase has temporarily blocked sign in from this device after repeated failures. Wait a few minutes and try again.";
      case "auth/network-request-failed":
        return "The network request failed. Check the connection and try again.";
      default:
        return `Sign in failed. Firebase reported ${cause.code}.`;
    }
  }

  return "Sign in failed for an unexpected reason.";
}

export default function LoginPage() {
  const router = useRouter();
  const { signIn, clearance } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [reveal, setReveal] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (clearance === "granted") router.replace("/dashboard");
  }, [clearance, router]);

  const busy = phase === "authenticating" || phase === "verifying";

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;

    setPhase("authenticating");
    setMessage("");

    try {
      setTimeout(() => setPhase((p) => (p === "authenticating" ? "verifying" : p)), 450);
      await signIn(email, password);
      router.replace("/dashboard");
    } catch (cause) {
      setMessage(explain(cause));
      setPhase("error");
    }
  }

  if (clearance === "checking") {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <FluidLoader size={56} label="Restoring session" />
      </main>
    );
  }

  return (
    <main className="grid min-h-screen grid-cols-1 lg:grid-cols-[1.05fr_1fr]">
      <section className="relative hidden overflow-hidden lg:block">
        <div className="relative flex h-full flex-col justify-between overflow-y-auto p-12">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-canopy shadow-[0_8px_18px_-8px_rgba(47,168,79,0.9)]">
              <Leaf size={21} strokeWidth={2.25} className="text-white" />
            </span>

            <div>
              <p className="font-display text-[17px] font-semibold tracking-tight text-ink">
                Eco Hero
              </p>
              <p className="text-[12px] text-ink-soft">Operations console</p>
            </div>
          </div>

          <div className="flex flex-1 flex-col justify-center py-8">
            <h2 className="rise max-w-[13ch] font-display text-[clamp(38px,4.6vw,60px)] font-semibold leading-[0.98] tracking-tight text-ink">
              Clear it up. Grow it back.
            </h2>

            <p
              className="rise mt-4 max-w-[42ch] text-[14.5px] leading-relaxed text-ink-soft"
              style={{ animationDelay: "110ms" }}
            >
              Every run in the game ends the same way. Litter goes, saplings go in, and the
              numbers behind that land here.
            </p>

            <div
              style={{ animationDelay: "200ms" }}
              className="rise mt-8 hidden w-full max-w-[460px] rounded-3xl border border-line bg-surface p-5 [@media(min-height:820px)]:block shadow-[0_2px_4px_rgba(20,48,28,0.05),0_24px_50px_-30px_rgba(20,48,28,0.35)]"
            >
              <div className="mb-3 flex items-center justify-between">
                <p className="font-display text-[14px] font-semibold text-ink">
                  The restoration cycle
                </p>

                <span className="inline-flex items-center gap-1.5 rounded-full bg-canopy-soft px-2.5 py-1 text-[11px] font-semibold text-canopy-deep">
                  <span className="live-dot size-1.5 rounded-full bg-canopy" />
                  On loop
                </span>
              </div>

              <RestorationScene className="w-full" />

              <p className="mt-3 text-[12.5px] leading-relaxed text-ink-soft">
                Clear the litter, plant the sapling, let it grow. One run of the game, drawn the
                way the console counts it.
              </p>
            </div>
          </div>

          <p className="font-mono text-[11.5px] text-ink-faint">project ecoheroadventure</p>
        </div>
      </section>

      <section className="flex items-center justify-center px-5 py-12 sm:px-10">
        <div
          className="rise w-full max-w-[400px] rounded-3xl border border-line bg-surface p-7 shadow-[0_2px_4px_rgba(20,48,28,0.05),0_28px_60px_-30px_rgba(20,48,28,0.4)] sm:p-9"
        >
          <span className="inline-flex items-center gap-2 rounded-full bg-canopy-soft px-3 py-1.5 text-[11.5px] font-semibold uppercase tracking-[0.12em] text-canopy-deep">
            <ShieldCheck size={14} strokeWidth={2.25} />
            Restricted access
          </span>

          <h1 className="mt-5 font-display text-[26px] font-semibold leading-tight tracking-tight text-ink">
            Sign in to the console
          </h1>

          <p className="mt-2 text-[13.5px] leading-relaxed text-ink-soft">
            Accounts are created in Firebase and granted clearance separately. There is no self
            registration.
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
                placeholder="admin@example.com"
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
                {reveal ? (
                  <EyeOff size={16} strokeWidth={2} />
                ) : (
                  <Eye size={16} strokeWidth={2} />
                )}
              </button>
            </Field>

            {phase === "error" && message ? (
              <p
                role="alert"
                className="rise rounded-xl border border-coral/30 bg-coral-soft px-4 py-3 text-[13px] leading-relaxed text-coral-deep"
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
                  {phase === "authenticating" ? "Authenticating" : "Checking clearance"}
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
            Every route behind this screen verifies clearance against the admins collection on
            load, so a direct link cannot be used to step around sign in.
          </p>
        </div>
      </section>
    </main>
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
  icon: ReactNode;
  children: ReactNode;
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
