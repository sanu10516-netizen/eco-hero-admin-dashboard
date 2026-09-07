"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

/**
 * The world the game is set in, drawn behind every page.
 *
 * Daylight, because the game is set in daylight. Sky at the top, a sun, drifting
 * cloud banks, then rolling hills along the bottom where the game's own loop
 * plays out on repeat: litter is carried away, saplings rise in its place and
 * grow into trees, butterflies cross, and then it resets.
 *
 * It is anchored to the bottom rather than filling the screen, so the middle of
 * the page, where the panels sit, stays quiet. Panels are opaque, so nothing
 * here competes with a number the reader is trying to hold in their head.
 */

const SCENE_W = 1600;
const SCENE_H = 460;
const GROUND_Y = 356;

/**
 * Deterministic scatter, so the hills look hand placed without being random.
 *
 * Integer arithmetic rather than trigonometry. Math.sin is permitted to differ
 * in its final bits between the server's maths library and the browser's, which
 * was enough to make the two draw paths that differed at the eleventh decimal
 * and trip a React hydration mismatch on every load. Integer hashing is exact
 * everywhere, and the result is rounded to two decimals so the markup the
 * server sends is character for character what the client would have written.
 */
function wobble(seed: number, spread: number): number {
  let hash = Math.imul(seed ^ 0x9e3779b9, 0x85ebca6b);
  hash = Math.imul(hash ^ (hash >>> 13), 0xc2b2ae35);
  hash ^= hash >>> 16;

  const unit = (hash >>> 0) / 4294967296;
  return Math.round(unit * spread * 100) / 100;
}

const HILL_FAR =
  "M0 268 C 160 226, 300 250, 430 232 C 560 214, 660 252, 790 238 C 930 222, 1030 254, 1160 236 C 1290 218, 1420 250, 1600 228 L1600 460 L0 460 Z";

const HILL_MID =
  "M0 306 C 140 274, 280 300, 420 284 C 560 268, 690 300, 830 288 C 980 274, 1090 302, 1230 286 C 1370 270, 1490 300, 1600 282 L1600 460 L0 460 Z";

const HILL_NEAR =
  "M0 344 C 180 318, 330 340, 480 330 C 640 320, 760 344, 920 334 C 1080 324, 1200 346, 1350 332 C 1460 322, 1530 340, 1600 330 L1600 460 L0 460 Z";

/** Background tree line. Small, dense, no detail. */
const TREELINE = Array.from({ length: 30 }, (_, index) => {
  const x = 18 + index * 54 + wobble(index + 1, 20);
  const h = 34 + wobble(index + 7, 26);
  return { x, h };
});

/** Foreground trees that grow during the loop. */
const GROWN = [
  { x: 220, scale: 1 },
  { x: 620, scale: 0.84 },
  { x: 1080, scale: 1.14 },
  { x: 1420, scale: 0.72 },
];

/** Litter cleared at the start of each cycle. */
const LITTER = [
  { x: 400, y: GROUND_Y + 18, tone: "#f0603c" },
  { x: 530, y: GROUND_Y + 26, tone: "#9fb0b6" },
  { x: 860, y: GROUND_Y + 16, tone: "#1c9ce0" },
  { x: 980, y: GROUND_Y + 28, tone: "#f0603c" },
  { x: 1270, y: GROUND_Y + 20, tone: "#9fb0b6" },
];

const GRASS = Array.from({ length: 62 }, (_, index) => {
  const x = 8 + index * 26 + wobble(index + 3, 14);
  const h = 10 + wobble(index + 11, 16);
  return { x, h, lean: index % 2 ? 4 : -4 };
});

const CLOUDS = [
  { x: 120, y: 78, scale: 1, speed: 1 },
  { x: 620, y: 46, scale: 0.72, speed: 0.7 },
  { x: 1010, y: 96, scale: 1.15, speed: 1.25 },
  { x: 1400, y: 58, scale: 0.85, speed: 0.9 },
];

export function WorldBackdrop() {
  const root = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    const svg = root.current;
    if (!svg) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const pick = (selector: string) => Array.from(svg.querySelectorAll(selector));

    const litter = pick("[data-litter]");
    const trees = pick("[data-tree]");
    const flyers = pick("[data-flyer]");
    const grass = pick("[data-grass]");
    const clouds = pick("[data-cloud]");

    gsap.set(trees, { transformOrigin: "50% 100%", scaleY: 0, opacity: 0 });
    gsap.set(litter, { opacity: 1, y: 0 });

    const tl = gsap.timeline({ repeat: -1, defaults: { ease: "power2.out" } });

    // Litter is carried away.
    tl.to(litter, { y: -26, opacity: 0, duration: 1.1, stagger: 0.18 });

    // Trees rise where it was. Slight overshoot, so they spring rather than
    // slide, which is how growth reads in the game itself.
    tl.to(
      trees,
      {
        scaleY: 1,
        opacity: 1,
        duration: 2.1,
        stagger: 0.42,
        ease: "back.out(1.5)",
      },
      "-=0.5",
    );

    // The scene holds, restored, for a good while before resetting.
    tl.to({}, { duration: 7 });

    tl.to(trees, { opacity: 0, duration: 1.3, stagger: 0.12 });
    tl.set(trees, { scaleY: 0 });
    tl.set(litter, { y: 0 });
    tl.to(litter, { opacity: 1, duration: 1.1, stagger: 0.1 });

    // Grass sways on its own cycle, unrelated to the main loop.
    const sway = gsap.to(grass, {
      rotation: 3,
      transformOrigin: "50% 100%",
      duration: 3.2,
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1,
      stagger: { each: 0.05, from: "random" },
    });

    // Butterflies cross the scene, bobbing as they go.
    const drift = gsap.to(flyers, {
      x: SCENE_W + 120,
      duration: 22,
      ease: "none",
      repeat: -1,
      stagger: { each: 5.5, repeat: -1 },
    });

    const bob = gsap.to(flyers, {
      y: "+=22",
      duration: 1.6,
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1,
      stagger: { each: 0.4, from: "random" },
    });

    // Cloud banks move slowly enough that you only notice between glances.
    const sail = gsap.to(clouds, {
      x: (index: number) => 90 + index * 26,
      duration: 26,
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1,
    });

    const all = [tl, sway, drift, bob, sail];

    const onVisibility = () => {
      all.forEach((item) => (document.hidden ? item.pause() : item.resume()));
    };

    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      all.forEach((item) => item.kill());
    };
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-base">
      {/* Sky. A single wash from open blue down to the meadow tone the page
          uses, so the horizon has somewhere to arrive. */}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#c4e7f7_0%,#dcf0ea_38%,#e7f2dd_66%)]" />

      {/* Sun, and the haze around it. */}
      <div className="absolute right-[12%] top-[7%] float-slow">
        <div className="size-40 rounded-full bg-[radial-gradient(circle,rgba(245,179,35,0.42)_0%,rgba(245,179,35,0.14)_42%,transparent_70%)]" />
      </div>

      <svg
        ref={root}
        viewBox={`0 0 ${SCENE_W} ${SCENE_H}`}
        preserveAspectRatio="xMidYMax slice"
        className="absolute inset-x-0 bottom-0 h-[42vh] min-h-[260px] w-full sm:h-[54vh] sm:min-h-[340px]"
      >
        {/* Cloud banks */}
        <g fill="#ffffff" opacity="0.82">
          {CLOUDS.map((cloud, index) => (
            <g
              key={index}
              data-cloud
              transform={`translate(${cloud.x} ${cloud.y}) scale(${cloud.scale})`}
            >
              <ellipse cx="0" cy="0" rx="46" ry="18" />
              <ellipse cx="-30" cy="6" rx="30" ry="13" />
              <ellipse cx="28" cy="7" rx="34" ry="14" />
              <ellipse cx="4" cy="-13" rx="26" ry="16" />
            </g>
          ))}
        </g>

        {/* Rolling hills, lightest furthest away */}
        <path d={HILL_FAR} fill="#b9dfb4" />
        <path d={HILL_MID} fill="#96d095" />

        {/* Tree line sits on the mid hill */}
        <g fill="#5cb96c">
          {TREELINE.map((tree, index) => (
            <path key={index} d={`M${tree.x} 320 l-10 0 l10 -${tree.h} l10 ${tree.h} z`} />
          ))}
        </g>

        <path d={HILL_NEAR} fill="#7cc47c" />

        {/* Ground the loop plays out on */}
        <rect x="0" y={GROUND_Y} width={SCENE_W} height={SCENE_H - GROUND_Y} fill="#69b96d" />
        <path
          d={`M0 ${GROUND_Y} C 300 ${GROUND_Y - 8}, 620 ${GROUND_Y + 6}, 900 ${GROUND_Y - 4} C 1180 ${GROUND_Y - 12}, 1400 ${GROUND_Y + 4}, 1600 ${GROUND_Y - 6} L1600 ${GROUND_Y + 10} L0 ${GROUND_Y + 10} Z`}
          fill="#8ace87"
        />

        {/* Grass */}
        <g stroke="#3f9e52" strokeWidth="2" fill="none" strokeLinecap="round">
          {GRASS.map((blade, index) => (
            <path
              key={index}
              data-grass
              d={`M${blade.x} ${GROUND_Y + 4} Q ${blade.x + blade.lean} ${
                GROUND_Y + 4 - blade.h / 2
              } ${blade.x + blade.lean * 1.8} ${GROUND_Y + 4 - blade.h}`}
            />
          ))}
        </g>

        {/* Litter, cleared at the start of every cycle */}
        <g>
          {LITTER.map((piece, index) => (
            <g key={index} data-litter>
              <path
                d={`M${piece.x} ${piece.y} l8 -11 l12 3 l-3 8 z`}
                fill={piece.tone}
                opacity="0.85"
              />
              <path
                d={`M${piece.x} ${piece.y} l8 -11 l12 3 l-3 8 z`}
                fill="none"
                stroke="#14301c"
                strokeOpacity="0.25"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </g>
          ))}
        </g>

        {/* Foreground trees that grow back */}
        <g>
          {GROWN.map((tree, index) => (
            <g
              key={index}
              data-tree
              transform={`translate(${tree.x} ${GROUND_Y + 6}) scale(${tree.scale})`}
            >
              <path
                d="M0 0 L0 -52"
                stroke="#8a5a34"
                strokeWidth="7"
                strokeLinecap="round"
              />
              <path
                d="M0 -34 L-16 -50 M0 -42 L17 -58"
                stroke="#8a5a34"
                strokeWidth="4.5"
                strokeLinecap="round"
              />
              <circle cx="0" cy="-72" r="26" fill="#34ad55" />
              <circle cx="-19" cy="-54" r="15" fill="#42bd63" />
              <circle cx="20" cy="-60" r="14" fill="#2b9748" />
              <circle cx="-6" cy="-84" r="15" fill="#4ec66f" />
            </g>
          ))}
        </g>

        {/* Butterflies crossing the scene */}
        <g>
          {[0, 1, 2, 3].map((index) => (
            <g
              key={index}
              data-flyer
              transform={`translate(${-80 - index * 60} ${150 + index * 46})`}
            >
              <ellipse
                cx="-4"
                cy="0"
                rx="6"
                ry="4"
                fill={index % 2 ? "#f5b323" : "#f0603c"}
                opacity="0.9"
              />
              <ellipse
                cx="4"
                cy="0"
                rx="6"
                ry="4"
                fill={index % 2 ? "#f5b323" : "#f0603c"}
                opacity="0.7"
              />
            </g>
          ))}
        </g>
      </svg>

      {/* Softens the horizon into the page so panels do not sit on a hard edge,
          and holds enough of the page colour over the tree line that body text
          crossing it stays readable. On a phone the scene reaches much further
          up the screen, so it is veiled harder there. */}
      <div className="absolute inset-x-0 bottom-0 h-[42vh] min-h-[260px] bg-gradient-to-t from-transparent via-base/55 to-base/90 sm:h-[54vh] sm:min-h-[340px] sm:via-base/35 sm:to-base/80" />
    </div>
  );
}
