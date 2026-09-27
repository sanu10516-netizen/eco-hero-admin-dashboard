"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/lib/auth-context";
import { FluidLoader } from "@/components/fluid-loader";

export function RequireAdmin({ children }: { children: ReactNode }) {
  const { clearance } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (clearance === "denied") router.replace("/login");
  }, [clearance, router]);

  if (clearance === "granted") return <>{children}</>;

  return (
    <div className="flex min-h-screen items-center justify-center bg-transparent">
      <FluidLoader
        size={52}
        label={clearance === "checking" ? "Checking security clearance" : "Returning to sign in"}
      />
    </div>
  );
}
