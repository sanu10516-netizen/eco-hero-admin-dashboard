import { redirect } from "next/navigation";

/**
 * The root has no content of its own. Sending it to the dashboard rather than
 * the login screen means a returning admin with a live session lands where they
 * expect, and RequireAdmin turns anyone else back.
 */
export default function Index() {
  redirect("/dashboard");
}
