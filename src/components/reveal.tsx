"use client";

import { useEffect, useRef, type ReactNode } from "react";
import gsap from "gsap";

/**
 * Staggered entrance for page content.
 *
 * Three rules, all learned the hard way from this console rendering empty
 * containers where panels of real data should have been.
 *
 * It never hides anything in CSS. The stylesheet used to set .reveal-item to
 * opacity 0 and wait for GSAP, so any panel that mounted after its Firestore
 * read stayed invisible for good. Content is visible by default and the
 * animation fades it in from nothing.
 *
 * It watches for late arrivals. Panels that depend on a network read appear
 * long after an ordinary mount effect has run, so a MutationObserver picks them
 * up and animates them on arrival.
 *
 * And it gives up rather than leaving anything hidden. GSAP applies the start
 * of a tween immediately, so a frame loop that stalls, throttles, or is torn
 * down mid flight would strand an element at zero opacity. A timer, which does
 * not depend on the frame loop, clears the inline styles once the animation
 * should have finished. If it ran normally that is a no-op; if it did not, the
 * data appears anyway. A decorative animation must never be able to hide data.
 */
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
    if (reduced) return; // content is already visible, nothing to do

    // Tracked so an element is never animated twice, which would restart it
    // every time a sibling re-rendered.
    const seen = new WeakSet<Element>();
    const timers = new Set<number>();

    const show = (candidates: Element[], initial: boolean) => {
      const fresh = candidates.filter((item) => !seen.has(item));
      if (!fresh.length) return;

      fresh.forEach((item) => seen.add(item));

      const startDelay = initial ? delay : 0;
      const step = initial ? stagger : 0.04;
      const duration = 0.9;

      // Nothing was ever painted for this tab, so there is no entrance to see.
      // Animating anyway would only risk leaving it hidden.
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
          // Clear both, so nothing is left holding an inline opacity that a
          // later state change cannot override.
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
