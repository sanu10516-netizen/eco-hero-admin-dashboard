"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/lib/auth-context";
import { FluidLoader } from "@/components/fluid-loader";

/**
 * Gate for everything under /dashboard.
 *
 * The previous console registered its routes with no guard at all, so typing a
 * path straight into the address bar walked past the login screen entirely.
 * Here nothing under the gate renders until Firebase has resolved the session
 * and the matching admins document has been read back.
 *
 * This is the usability half of the fix. The enforcement half is the Firestore
 * security rules, since a determined visitor can always run their own client.
 */
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
