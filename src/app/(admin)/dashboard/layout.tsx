"use client";

import { useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";

import { RequireAdmin } from "@/components/require-admin";
import { Sidebar } from "@/components/shell/sidebar";
import { Topbar } from "@/components/shell/topbar";
import { PageTransition } from "@/components/page-transition";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <RequireAdmin>
      <div className="flex min-h-screen">
        <aside className="hidden w-[252px] shrink-0 lg:block xl:w-[268px]">
          <div className="fixed inset-y-0 left-0 w-[252px] xl:w-[268px]">
            <Sidebar />
          </div>
        </aside>

        <AnimatePresence>
          {menuOpen ? (
            <>
              <motion.div
                key="scrim"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                onClick={() => setMenuOpen(false)}
                className="fixed inset-0 z-40 bg-ink/35 backdrop-blur-sm lg:hidden"
              />

              <motion.aside
                key="drawer"
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", stiffness: 320, damping: 34 }}
                className="fixed inset-y-0 left-0 z-50 w-[272px] shadow-[0_0_60px_-12px_rgba(20,48,28,0.4)] lg:hidden"
              >
                <button
                  type="button"
                  onClick={() => setMenuOpen(false)}
                  aria-label="Close navigation"
                  className="press absolute right-3 top-4 z-10 rounded-lg p-2 text-ink-faint hover:bg-surface-high hover:text-ink"
                >
                  <X size={17} strokeWidth={2} />
                </button>

                <Sidebar onNavigate={() => setMenuOpen(false)} />
              </motion.aside>
            </>
          ) : null}
        </AnimatePresence>

        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar onOpenMenu={() => setMenuOpen(true)} />

          <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 xl:px-10">
            <div className="mx-auto w-full max-w-[1680px]">
              <PageTransition>{children}</PageTransition>
            </div>
          </main>
        </div>
      </div>
    </RequireAdmin>
  );
}
