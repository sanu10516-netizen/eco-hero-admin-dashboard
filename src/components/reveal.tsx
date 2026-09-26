"use client";

import { useEffect, useRef, type ReactNode } from "react";
import gsap from "gsap";

export function Reveal({
  children,
  className = "",
  delay = 0,
  stagger = 0.07,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  stagger?: number;
}) {
  const scope = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = scope.current;
    if (!root) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const seen = new WeakSet<Element>();
    const timers = new Set<number>();

    const show = (candidates: Element[], initial: boolean) => {
      const fresh = candidates.filter((item) => !seen.has(item));
      if (!fresh.length) return;

      fresh.forEach((item) => seen.add(item));

      const startDelay = initial ? delay : 0;
      const step = initial ? stagger : 0.04;
      const duration = 0.9;

      if (document.hidden) return;

      gsap.fromTo(
        fresh,
        { opacity: 0, y: 26 },
        {
          opacity: 1,
          y: 0,
          duration,
          ease: "power3.out",
          stagger: step,
          delay: startDelay,
          clearProps: "transform,opacity",
        },
      );

      const settleAfter = (startDelay + duration + step * fresh.length + 1.5) * 1000;

      const rescue = window.setTimeout(() => {
        timers.delete(rescue);
        gsap.set(fresh, { clearProps: "transform,opacity" });
      }, settleAfter);

      timers.add(rescue);
    };

    show(Array.from(root.querySelectorAll(".reveal-item")), true);

    const observer = new MutationObserver((records) => {
      const arrivals: Element[] = [];

      records.forEach((record) => {
        record.addedNodes.forEach((node) => {
          if (!(node instanceof Element)) return;

          if (node.classList.contains("reveal-item")) arrivals.push(node);
          arrivals.push(...Array.from(node.querySelectorAll(".reveal-item")));
        });
      });

      if (arrivals.length) show(arrivals, false);
    });

    observer.observe(root, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [delay, stagger]);

  return (
    <div ref={scope} className={className}>
      {children}
    </div>
  );
}
