"use client";

import { Crown } from "lucide-react";

import { formatNumber, initialsFrom } from "@/lib/format";

export interface Standing {
  uid: string;
  username: string;
  score: number;
  level: number;
}

/**
 * Ranked standings.
 *
 * The top three are marked by tone and by a number, never by colour alone, so
 * the ranking still reads correctly in a screenshot, in print, and to anyone who
 * cannot tell the medal colours apart. Positions beyond third are numbered
 * plainly.
 */
export function Leaderboard({ standings }: { standings: Standing[] }) {
  if (!standings.length) {
    return (
      <p className="px-5 py-12 text-center text-[13px] text-ink-faint">
        No completed runs yet, so there is nothing to rank.
      </p>
    );
  }

  const leader = standings[0]?.score || 1;

  return (
    <ol className="divide-y divide-line">
      {standings.map((entry, index) => {
        const rank = index + 1;

        const rankTone =
          rank === 1
            ? "bg-sun text-white"
            : rank === 2
              ? "bg-tide-soft text-tide-deep"
              : rank === 3
                ? "bg-coral-soft text-coral-deep"
                : "bg-surface-high text-ink-faint";

        const barTone =
          rank === 1 ? "#f5b323" : rank === 2 ? "#1c9ce0" : rank === 3 ? "#f0603c" : "#2fa84f";

        return (
          <li
            key={entry.uid}
            className="flex items-center gap-3.5 px-5 py-3.5 transition-colors duration-300 hover:bg-surface-high"
          >
            <span
              className={`flex size-8 shrink-0 items-center justify-center rounded-xl font-display text-[13px] font-semibold ${rankTone}`}
            >
              {rank === 1 ? <Crown size={15} strokeWidth={2.25} /> : rank}
            </span>

            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-canopy-soft text-[12px] font-semibold text-canopy-deep">
              {initialsFrom(entry.username, "??")}
            </span>

            <div className="min-w-0 flex-1">
              <p className="truncate text-[13.5px] font-medium text-ink">{entry.username}</p>

              {/* The bar shows the gap to the leader, which is the thing a
                  ranking actually communicates. */}
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-base-deep">
                <div
                  className="grow-bar h-full rounded-full"
                  style={{
                    width: `${Math.max((entry.score / leader) * 100, 4)}%`,
                    backgroundColor: barTone,
                    animationDelay: `${index * 90}ms`,
                  }}
                />
              </div>
            </div>

            <div className="shrink-0 text-right">
              <p className="font-display text-[15px] font-semibold text-ink tabular-nums">
                {formatNumber(entry.score)}
              </p>
              <p className="text-[11.5px] text-ink-faint">Level {entry.level || "?"}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
