import type { ReactNode } from "react";

import { AuthProvider } from "@/lib/auth-context";

/**
 * Scopes the admin clearance check to /dashboard and /login only.
 *
 * AuthProvider used to sit in the root layout, so it ran for every route in
 * the app. Its onAuthStateChanged listener signs a session out the moment it
 * finds a signed in user with no admins document - correct for an operator
 * console, but it would eject an ordinary player the instant they signed in
 * anywhere else, including /community. This route group is what keeps that
 * listener from ever seeing a session that was never meant to hold admin
 * clearance in the first place.
 */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
