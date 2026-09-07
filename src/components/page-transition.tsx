"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * Route to route entrance.
 *
 * Keyed on the path, so React tears the old page down and mounts the new one,
 * which replays the entrance on every navigation. There is deliberately no exit
 * animation: the App Router has already swapped the content by the time an exit
 * would run, so waiting for one only adds a pause where the reader expects the
 * new page to be.
 *
 * The animation is CSS rather than JavaScript, and that is a deliberate choice
 * for this element in particular. It wraps every page in the console. A frame
 * loop that stalls partway would leave the entire dashboard sitting at zero
 * opacity, whereas a CSS animation that never runs simply leaves the content
 * where it already is, which is visible.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div key={pathname} className="rise">
      {children}
    </div>
  );
}
