import { SkeletonPage } from "@/components/ui/states";

/**
 * Shown the moment a navigation into this section begins, before the route's
 * own code has even loaded. Without it the previous page simply sits there and
 * the click appears to have done nothing.
 */
export default function Loading() {
  return <SkeletonPage panels={2} />;
}
