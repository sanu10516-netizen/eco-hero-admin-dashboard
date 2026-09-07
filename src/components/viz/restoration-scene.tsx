"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

/**
 * The restoration cycle, drawn as it happens in the game.
 *
 * Litter is cleared, grass returns to the bare ground, then a sapling grows and
 * fills out. The sequence loops slowly with a long pause on the finished state,
 * so it reads as a quiet illustration rather than something demanding attention
 * next to a sign in form.
 *
 * Everything is one inline SVG driven by a single GSAP timeline. No sprite
 * sheet, no video, and nothing that keeps painting once the tab is hidden.
 */
export function RestorationScene({ className = "" }: { className?: string }) {
  const root = useRef<SVGSVGElement | null>(null);
  const timeline = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    const svg = root.current;
    if (!svg) return;

    const pick = (selector: string) => Array.from(svg.querySelectorAll(selector));

    const litter = pick("[data-litter]");
    const blades = pick("[data-blade]");
    const trunk = svg.querySelector<SVGPathElement>("[data-trunk]");
    const canopy = pick("[data-canopy]");
    const motes = pick("[data-mote]");

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduced) {
      // Show the restored state and stop. The point of the illustration is the
      // outcome, which a still frame carries perfectly well.
      gsap.set(litter, { opacity: 0 });
      gsap.set(blades, { scaleY: 1, opacity: 1 });
      gsap.set(canopy, { scale: 1, opacity: 1 });
      if (trunk) gsap.set(trunk, { strokeDashoffset: 0 });
      return;
    }

    const length = trunk?.getTotalLength() ?? 0;

    gsap.set(blades, { transformOrigin: "50% 100%", scaleY: 0, opacity: 0 });
    gsap.set(canopy, { transformOrigin: "50% 100%", scale: 0, opacity: 0 });
    gsap.set(litter, { opacity: 1, y: 0, rotate: 0 });
    gsap.set(motes, { opacity: 0 });

    if (trunk) {
      gsap.set(trunk, { strokeDasharray: length, strokeDashoffset: length });
    }

    const tl = gsap.timeline({ repeat: -1, defaults: { ease: "power3.out" } });
    timeline.current = tl;

    // 1. The ground is cleared. Each piece lifts away rather than blinking out.
    tl.to(litter, {
      y: -26,
      rotate: (index: number) => (index % 2 ? 34 : -28),
      opacity: 0,
      duration: 0.9,
      stagger: 0.13,
    });

    // 2. Grass returns across the cleared ground.
    tl.to(
      blades,
      {
        scaleY: 1,
        opacity: 1,
        duration: 1.1,
        stagger: { each: 0.045, from: "center" },
        ease: "back.out(1.7)",
      },
      "-=0.35",
    );

    // 3. A sapling draws itself upward.
    if (trunk) {
      tl.to(trunk, { strokeDashoffset: 0, duration: 1.25, ease: "power2.inOut" }, "-=0.5");
    }

    // 4. The canopy fills in, lowest leaves first.
    tl.to(
      canopy,
      {
        scale: 1,
        opacity: 1,
        duration: 1.05,
        stagger: 0.16,
        ease: "back.out(1.5)",
      },
      "-=0.45",
    );

    // 5. Seeds drift off the finished tree, then the cycle resets.
    tl.to(
      motes,
      {
        opacity: 0.75,
        y: -34,
        x: (index: number) => (index % 2 ? 16 : -14),
        duration: 2.4,
        stagger: 0.4,
        ease: "sine.inOut",
      },
      "-=0.3",
    );

    tl.to({}, { duration: 1.9 });

    tl.to([canopy, blades], { opacity: 0, duration: 0.85, stagger: 0.015 });
    tl.to(trunk, { opacity: 0, duration: 0.6 }, "<");
    tl.to(motes, { opacity: 0, duration: 0.4 }, "<");

    // Restore the starting frame off screen so the loop does not visibly snap.
    tl.set([blades], { scaleY: 0, opacity: 0 });
    tl.set(canopy, { scale: 0, opacity: 0 });
    tl.set(trunk, { strokeDashoffset: length, opacity: 1 });
    tl.set(motes, { y: 0, x: 0 });
    tl.set(litter, { opacity: 1, y: 0, rotate: 0 });
    tl.to({}, { duration: 0.5 });

    // Pausing when the tab is hidden keeps a background tab from animating.
    const onVisibility = () => {
      if (document.hidden) tl.pause();
      else tl.resume();
    };

    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      tl.kill();
    };
  }, []);

  // Grass placed by hand rather than evenly, so the line does not look printed.
  const grass = [
    { x: 66, h: 20, lean: -5 },
    { x: 84, h: 27, lean: 3 },
    { x: 101, h: 17, lean: -2 },
    { x: 122, h: 24, lean: 4 },
    { x: 139, h: 15, lean: -4 },
    { x: 168, h: 22, lean: 2 },
    { x: 186, h: 29, lean: -3 },
    { x: 232, h: 26, lean: 4 },
    { x: 251, h: 18, lean: -2 },
    { x: 274, h: 24, lean: 3 },
    { x: 293, h: 16, lean: -4 },
    { x: 313, h: 21, lean: 2 },
  ];

  return (
    <svg
      ref={root}
      viewBox="28 104 344 142"
      className={className}
      role="img"
      aria-label="Litter is cleared from bare ground, grass returns and a tree grows"
    >
      {/* Ground */}
      <line
        x1="40"
        y1="230"
        x2="360"
        y2="230"
        stroke="rgba(20,48,28,0.16)"
        strokeWidth="1"
      />

      {/* A little soil texture so the line is not the only anchor */}
      {[58, 96, 148, 205, 262, 318, 344].map((x, index) => (
        <line
          key={x}
          x1={x}
          y1={233 + (index % 2)}
          x2={x + 11}
          y2={233 + (index % 2)}
          stroke="rgba(20,48,28,0.08)"
          strokeWidth="1"
        />
      ))}

      {/* Litter, cleared in the first beat */}
      <g stroke="#c33f1e" strokeWidth="2.5" fill="#f0603c" fillOpacity="0.75" strokeLinejoin="round">
        <path data-litter d="M92 230 l7 -9 l10 3 l-3 6 z" />
        <path data-litter d="M147 230 l5 -7 l9 1 l-2 6 z" />
        <rect data-litter x="216" y="221" width="13" height="9" rx="1.5" />
        <path data-litter d="M281 230 l6 -8 l8 2 l-2 6 z" />
        <circle data-litter cx="330" cy="225" r="4.5" />
      </g>

      {/* Grass */}
      <g stroke="#2fa84f" strokeWidth="3" fill="none" strokeLinecap="round">
        {grass.map((blade) => (
          <path
            key={blade.x}
            data-blade
            d={`M${blade.x} 230 Q ${blade.x + blade.lean} ${230 - blade.h / 2} ${
              blade.x + blade.lean * 2
            } ${230 - blade.h}`}
          />
        ))}
      </g>

      {/* Trunk and branches, drawn on */}
      <path
        data-trunk
        d="M200 230 L200 168 M200 196 L182 178 M200 184 L219 165"
        stroke="#8a5a34"
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
      />

      {/* Canopy */}
      <g fill="none" strokeLinejoin="round">
        <path
          data-canopy
          d="M182 178 q -17 -7 -13 -21 q 15 -4 22 8 z"
          fill="#5ec87b"
          stroke="#2b9748"
          strokeWidth="2.5"
        />
        <path
          data-canopy
          d="M219 165 q 19 -6 17 -21 q -17 -3 -23 10 z"
          fill="#5ec87b"
          stroke="#2b9748"
          strokeWidth="2.5"
        />
        <circle data-canopy cx="200" cy="146" r="24" fill="#34ad55" stroke="#1d7c38" strokeWidth="2.5" />
        <circle data-canopy cx="200" cy="146" r="12" fill="rgba(255,255,255,0.32)" stroke="none" />
      </g>

      {/* Seeds drifting from the finished tree */}
      <g fill="#2fa84f">
        <circle data-mote cx="176" cy="132" r="2.6" />
        <circle data-mote cx="223" cy="140" r="2.2" />
        <circle data-mote cx="206" cy="120" r="2.4" />
      </g>
    </svg>
  );
}
