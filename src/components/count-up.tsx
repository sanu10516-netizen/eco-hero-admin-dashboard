"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

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

  const from = useRef(0);

  useIsomorphicLayoutEffect(() => {
    const target = value;
    const start = from.current;

    from.current = target;

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
      const eased = 1 - Math.pow(1 - progress, 3);

      setShown(Math.round(start + (target - start) * eased));

      if (progress < 1) frame = requestAnimationFrame(step);
    };

    frame = requestAnimationFrame(step);

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
