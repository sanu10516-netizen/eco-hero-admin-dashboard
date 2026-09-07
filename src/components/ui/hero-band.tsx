"use client";

import { Sparkles } from "lucide-react";

import { CountUp } from "@/components/count-up";

export interface HeroStat {
  label: string;
  value: number;
  format?: (input: number) => string;
}

/**
 * The banner at the top of the operations page.
 *
 * The console had no moment anywhere in it that said what game this belongs to.
 * This is that moment: the game's own daylight palette, its horizon, and the
 * three figures that matter most, counted up as they land.
 *
 * The scene is decorative and marked as such. Every figure it sits beside is
 * real, and each one is repeated in the tiles below, so nothing here is the
 * only place a number appears.
 */
export function HeroBand({
  eyebrow,
  title,
  detail,
  stats,
  loading = false,
}: {
  eyebrow: string;
  title: string;
  detail: string;
  stats: HeroStat[];
  loading?: boolean;
}) {
  return (
    <section className="reveal-item relative overflow-hidden rounded-3xl bg-[linear-gradient(135deg,#2fa84f_0%,#1d7c38_58%,#17673d_100%)] text-white shadow-[0_18px_44px_-24px_rgba(29,124,56,0.9)]">
      <Scenery />

      <div className="relative flex flex-col gap-8 p-7 sm:p-9 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 max-w-[46ch]">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/18 px-3 py-1.5 text-[11.5px] font-semibold uppercase tracking-[0.12em] text-white backdrop-blur-sm">
            <Sparkles size={13} strokeWidth={2.5} />
            {eyebrow}
          </span>

          <h1 className="rise mt-4 font-display text-[clamp(28px,3.4vw,42px)] font-semibold leading-[1.05] tracking-tight">
            {title}
          </h1>

          <p
            className="rise mt-3 text-[14.5px] leading-relaxed text-white/85"
            style={{ animationDelay: "90ms" }}
          >
            {detail}
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap gap-3 sm:gap-4">
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className="rise min-w-[118px] rounded-2xl bg-white/14 px-4 py-3 backdrop-blur-sm"
              style={{ animationDelay: `${150 + index * 80}ms` }}
            >
              <p className="text-[11.5px] font-medium uppercase tracking-[0.1em] text-white/70">
                {stat.label}
              </p>

              <p className="mt-1 font-display text-[26px] font-semibold leading-none">
                {loading ? (
                  <span className="inline-block h-[26px] w-14 animate-pulse rounded bg-white/25 align-middle" />
                ) : (
                  <CountUp value={stat.value} format={stat.format} />
                )}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Sun, hills and a tree line, drawn into the banner rather than layered over it. */
function Scenery() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <div className="absolute -right-10 -top-14 size-56 rounded-full bg-[radial-gradient(circle,rgba(245,179,35,0.55)_0%,rgba(245,179,35,0.14)_45%,transparent_70%)]" />

      <svg
        viewBox="0 0 1200 260"
        preserveAspectRatio="xMidYMax slice"
        className="absolute inset-x-0 bottom-0 h-[62%] w-full"
      >
        <path
          d="M0 168 C 180 138, 340 168, 500 152 C 660 136, 780 166, 940 150 C 1060 138, 1140 162, 1200 148 L1200 260 L0 260 Z"
          fill="rgba(255,255,255,0.09)"
        />
        <path
          d="M0 202 C 160 182, 320 206, 470 194 C 640 180, 790 206, 950 196 C 1080 188, 1150 204, 1200 196 L1200 260 L0 260 Z"
          fill="rgba(255,255,255,0.13)"
        />

        <g fill="rgba(255,255,255,0.18)">
          {Array.from({ length: 22 }, (_, index) => {
            const x = 30 + index * 55;
            const h = 26 + ((index * 37) % 22);
            return <path key={index} d={`M${x} 206 l-9 0 l9 -${h} l9 ${h} z`} />;
          })}
        </g>

        <g stroke="rgba(255,255,255,0.22)" strokeWidth="2.5" strokeLinecap="round" fill="none">
          {Array.from({ length: 30 }, (_, index) => {
            const x = 14 + index * 41;
            const h = 10 + ((index * 53) % 14);
            return <path key={index} d={`M${x} 232 l${index % 2 ? 4 : -4} -${h}`} />;
          })}
        </g>
      </svg>
    </div>
  );
}
