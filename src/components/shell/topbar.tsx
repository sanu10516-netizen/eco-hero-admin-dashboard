"use client";

import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";

import { useConnection } from "@/lib/use-connection";

const TITLES: { href: string; label: string; exact?: boolean }[] = [
  { href: "/dashboard", label: "Operations", exact: true },
  { href: "/dashboard/players", label: "Players" },
  { href: "/dashboard/research", label: "Research" },
  { href: "/dashboard/levels", label: "Level analytics" },
  { href: "/dashboard/community", label: "Community" },
];

export function Topbar({ onOpenMenu }: { onOpenMenu: () => void }) {
  const status = useConnection();
  const pathname = usePathname();

  const here =
    TITLES.find((item) =>
      item.exact ? pathname === item.href : pathname.startsWith(item.href),
    )?.label ?? "Console";

  const tone =
    status === "live"
      ? { dot: "bg-canopy", pill: "bg-canopy-soft text-canopy-deep", label: "Live" }
      : status === "connecting"
        ? { dot: "bg-sun", pill: "bg-sun-soft text-sun-deep", label: "Connecting" }
        : { dot: "bg-coral", pill: "bg-coral-soft text-coral-deep", label: "Offline" };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-line bg-base/80 px-4 backdrop-blur-xl sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label="Open navigation"
          className="press rounded-xl border border-line bg-surface p-2.5 text-ink-soft hover:text-ink lg:hidden"
        >
          <Menu size={18} strokeWidth={2} />
        </button>

        <p className="truncate font-display text-[15px] font-semibold tracking-tight text-ink">
          {here}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <span
          className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[12px] font-semibold ${tone.pill}`}
        >
          <span className="relative flex size-1.5">
            {status === "live" ? (
              <span
                aria-hidden
                className={`live-ripple absolute inline-flex size-full rounded-full ${tone.dot}`}
              />
            ) : null}

            <span
              className={`relative inline-flex size-full rounded-full ${tone.dot} ${
                status === "live" ? "live-dot" : ""
              }`}
            />
          </span>

          {tone.label}
        </span>

        <span className="hidden font-mono text-[12px] text-ink-faint sm:inline">
          ecoheroadventure
        </span>
      </div>
    </header>
  );
}
