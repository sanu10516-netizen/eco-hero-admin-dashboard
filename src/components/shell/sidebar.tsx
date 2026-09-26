"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import {
  Gauge,
  ClipboardList,
  LogOut,
  MessagesSquare,
  Route as RouteIcon,
  Users,
} from "lucide-react";

import { useAuth } from "@/lib/auth-context";
import { initialsFrom } from "@/lib/format";

const NAV = [
  {
    href: "/dashboard",
    label: "Operations",
    icon: Gauge,
    exact: true,
    active: "bg-canopy-soft text-canopy-deep",
    dot: "bg-canopy",
  },
  {
    href: "/dashboard/players",
    label: "Players",
    icon: Users,
    exact: false,
    active: "bg-tide-soft text-tide-deep",
    dot: "bg-tide",
  },
  {
    href: "/dashboard/research",
    label: "Research",
    icon: ClipboardList,
    exact: false,
    active: "bg-berry-soft text-berry",
    dot: "bg-berry",
  },
  {
    href: "/dashboard/levels",
    label: "Level analytics",
    icon: RouteIcon,
    exact: false,
    active: "bg-sun-soft text-sun-deep",
    dot: "bg-sun",
  },
  {
    href: "/dashboard/community",
    label: "Community",
    icon: MessagesSquare,
    exact: false,
    active: "bg-coral-soft text-coral-deep",
    dot: "bg-coral",
  },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { admin, user, leave } = useAuth();

  return (
    <div className="flex h-full flex-col border-r border-line bg-surface">
      <div className="flex items-center gap-3 px-5 py-5">
        <Mark />

        <div className="min-w-0">
          <p className="truncate font-display text-[16px] font-semibold tracking-tight text-ink">
            Eco Hero
          </p>
          <p className="truncate text-[11.5px] text-ink-faint">Operations console</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
          Monitoring
        </p>

        <ul className="space-y-1">
          {NAV.map((item) => {
            const Icon = item.icon;
            const current = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={current ? "page" : undefined}
                  className={[
                    "press group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium",
                    current ? "text-ink" : "text-ink-soft hover:bg-surface-high hover:text-ink",
                  ].join(" ")}
                >
                  {current ? (
                    <motion.span
                      layoutId="nav-active"
                      aria-hidden
                      className={`absolute inset-0 rounded-xl ${item.active}`}
                      transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    />
                  ) : null}

                  <Icon
                    size={18}
                    strokeWidth={2}
                    className={[
                      "relative z-10 transition-transform duration-500 ease-[cubic-bezier(0.34,1.4,0.5,1)]",
                      current ? "" : "text-ink-faint group-hover:scale-110 group-hover:text-ink-soft",
                    ].join(" ")}
                  />

                  <span className="relative z-10 truncate">{item.label}</span>

                  {current ? (
                    <span
                      aria-hidden
                      className={`relative z-10 ml-auto size-1.5 rounded-full ${item.dot}`}
                    />
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-line p-3">
        <div className="flex items-center gap-3 rounded-xl bg-surface-high px-3 py-2.5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-canopy text-[12px] font-semibold text-white">
            {initialsFrom(admin?.name ?? user?.email ?? undefined, "EH")}
          </span>

          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium text-ink">
              {admin?.name ?? "Administrator"}
            </p>
            <p className="truncate text-[11.5px] text-ink-faint">{user?.email ?? ""}</p>
          </div>

          <button
            type="button"
            onClick={() => void leave()}
            aria-label="Sign out"
            className="press rounded-lg p-2 text-ink-faint hover:bg-coral-soft hover:text-coral-deep"
          >
            <LogOut size={16} strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  );
}

function Mark() {
  return (
    <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-canopy shadow-[0_6px_14px_-6px_rgba(47,168,79,0.9)]">
      <svg width="21" height="21" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M12 21c0-5.5 3-9.2 7.5-10.5C19 16 16 20 12 21Z"
          fill="rgba(255,255,255,0.92)"
        />
        <path
          d="M12 21C12 14.5 8.6 10.4 4 9c.6 6 3.9 10.4 8 12Z"
          fill="rgba(255,255,255,0.62)"
        />
        <path
          d="M12 21v-4"
          stroke="rgba(255,255,255,0.95)"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
