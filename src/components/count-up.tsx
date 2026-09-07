"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

/**
 * useLayoutEffect on the client, useEffect on the server.
 *
 * The count has to be knocked back to its start before the browser paints,
 * otherwise the final figure flashes for one frame and then appears to fall.
 * React warns about useLayoutEffect during server rendering, so it is swapped
 * out there, where there is no paint to be early for anyway.
 */
const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * Counts a figure up to its real value on mount, and again whenever the value
 * changes.
 *
 * It renders the true value during server rendering and never animates unless
 * the browser is actually there, so the number is correct even if the animation
 * never runs. It eases out rather than running linearly, so the last few digits
 * settle instead of stopping dead.
 */
export function CountUp({
  value,
  format,
  duration = 1100,
  className = "",
}: {
  value: number;
  format?: (input: number) => string;
  duration?: number;
  className?: string;
}) {
  const [shown, setShown] = useState(value);

  // Where the next run counts from. Zero to begin with, so the first paint
  // after mount rolls up from nothing.
  const from = useRef(0);

  useIsomorphicLayoutEffect(() => {
    const target = value;
    const start = from.current;

    from.current = target;

    // Nothing to count. This branch also catches React running the effect
    // twice in development: the first pass knocks the figure down to its start
    // and is then torn down, and without this the second pass would return
    // early and leave the tile reading zero for good.
    if (start === target) {
      setShown(target);
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(target);
      return;
    }

    setShown(start);

    let frame = 0;
    const began = performance.now();

    const step = (now: number) => {
      const progress = Math.min((now - began) / duration, 1);
      // Same curve as the CSS easing, so counters and panels feel related.
      const eased = 1 - Math.pow(1 - progress, 3);

      setShown(Math.round(start + (target - start) * eased));

      if (progress < 1) frame = requestAnimationFrame(step);
    };

    frame = requestAnimationFrame(step);

    // A counter that stalls does not go blank, it reports a smaller number,
    // which is far worse than no animation at all: nobody looking at it would
    // know it was wrong. The frame loop can be throttled or suspended by the
    // browser at any time, so a plain timer, which does not depend on frames,
    // snaps the figure to its real value once the count should have ended.
    const settle = window.setTimeout(() => setShown(target), duration + 400);

    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(settle);
    };
  }, [value, duration]);

  return (
    <span className={`tabular-nums ${className}`}>
      {format ? format(shown) : String(shown)}
    </span>
  );
}
