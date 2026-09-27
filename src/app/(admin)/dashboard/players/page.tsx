"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Search } from "lucide-react";

import { usePagedPlayers, type SortKey } from "@/lib/use-paged-players";
import { COLLECTIONS, type Player } from "@/lib/schema";
import { formatNumber, initialsFrom, shortId } from "@/lib/format";
import { PageHeading, Panel } from "@/components/ui/panel";
import { EmptyState, ErrorState, SkeletonTable } from "@/components/ui/states";
import { PlayerDrawer } from "@/components/player-drawer";
import { Reveal } from "@/components/reveal";

const PAGE_SIZE = 25;

const COLUMNS: { key: SortKey; label: string; align?: "right" }[] = [
  { key: "username", label: "Player" },
  { key: "currentLevel", label: "Level", align: "right" },
  { key: "totalScore", label: "Total score", align: "right" },
];

export default function PlayersPage() {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("totalScore");
  const [descending, setDescending] = useState(true);
  const [selected, setSelected] = useState<Player | null>(null);

  const { rows, loading, error, page, hasNext, hasPrevious, next, previous, searching } =
    usePagedPlayers({ pageSize: PAGE_SIZE, sortKey, descending, search });

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setDescending((value) => !value);
    } else {
      setSortKey(key);
      setDescending(key !== "username");
    }
  }

  return (
    <>
      <Reveal className="space-y-6">
        <PageHeading
          eyebrow="Accounts" title="Players"
          detail="Every registered account, read a page at a time. Select a row to open the full record."
        />

        <Panel className="reveal-item overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line px-5 py-4">
            <div className="relative w-full max-w-xs">
              <Search
                size={15}
                strokeWidth={2}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
              />

              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by username"
                aria-label="Search players by username"
                className="w-full rounded-xl border border-line-strong bg-base py-2 pl-9 pr-3 text-[13.5px] text-ink outline-none transition-colors duration-300 placeholder:text-ink-faint focus:border-canopy focus:bg-surface focus:shadow-[0_0_0_4px_rgba(47,168,79,0.14)]"
              />
            </div>

            <p className="text-[12.5px] text-ink-faint">
              {searching
                ? `Matches beginning with "${search.trim()}"`
                : `Page ${page + 1} · ${PAGE_SIZE} per page`}
            </p>
          </div>

          {error ? (
            <div className="p-5">
              <ErrorState error={error} />
            </div>
          ) : loading ? (
            <SkeletonTable rows={8} columns={4} />
          ) : rows.length === 0 ? (
            searching ? (
              <div className="px-6 py-16 text-center">
                <p className="text-[14px] text-ink">No username begins with that text</p>
                <p className="mx-auto mt-2 max-w-md text-[13px] leading-relaxed text-ink-soft">
                  Firestore matches from the start of a name rather than anywhere inside it, so
                  partial matches from the middle of a name will not appear.
                </p>
              </div>
            ) : (
              <EmptyState
                collection={COLLECTIONS.players}
                title="No player accounts exist yet"
                detail="A document is written here the first time someone registers in the game."
              />
            )
          ) : (
            <>
              <div className="hidden overflow-x-auto sm:block">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-line">
                      {COLUMNS.map((column) => {
                        const active = sortKey === column.key;

                        return (
                          <th
                            key={column.key}
                            scope="col"
                            className={`px-5 py-3 text-[12px] font-medium tracking-wide text-ink-soft ${
                              column.align === "right" ? "text-right" : ""
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => toggleSort(column.key)}
                              disabled={searching}
                              className={`inline-flex items-center gap-1.5 transition-colors duration-300 hover:text-ink disabled:cursor-not-allowed disabled:opacity-45 ${
                                active ? "text-ink" : ""
                              }`}
                            >
                              {column.label}
                              {active && !searching ? (
                                descending ? (
                                  <ArrowDown size={13} strokeWidth={2} />
                                ) : (
                                  <ArrowUp size={13} strokeWidth={2} />
                                )
                              ) : null}
                            </button>
                          </th>
                        );
                      })}

                      <th
                        scope="col"
                        className="px-5 py-3 text-right text-[12px] font-medium tracking-wide text-ink-soft"
                      >
                        Coins
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-line">
                    {rows.map((player) => (
                      <tr
                        key={player.uid}
                        onClick={() => setSelected(player)}
                        tabIndex={0}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            setSelected(player);
                          }
                        }}
                        className="cursor-pointer transition-colors duration-300 hover:bg-surface-high focus:bg-surface-high focus:outline-none"
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-canopy-soft text-[11px] font-semibold text-canopy-deep">
                              {initialsFrom(player.username, "??")}
                            </span>

                            <span className="min-w-0">
                              <span className="block truncate text-[13.5px] text-ink">
                                {player.username || "Unnamed player"}
                              </span>
                              <span className="block truncate text-[12px] text-ink-faint">
                                {player.email || shortId(player.uid)}
                              </span>
                            </span>
                          </div>
                        </td>

                        <td className="px-5 py-3.5 text-right font-display text-[14px] font-medium text-ink-soft tabular-nums">
                          {formatNumber(player.currentLevel)}
                        </td>

                        <td className="px-5 py-3.5 text-right font-display text-[14px] font-semibold text-ink tabular-nums">
                          {formatNumber(player.totalScore)}
                        </td>

                        <td className="px-5 py-3.5 text-right font-mono text-[13px] text-sun-deep tabular-nums">
                          {formatNumber(player.coins)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <ul className="divide-y divide-line sm:hidden">
                {rows.map((player) => (
                  <li key={player.uid}>
                    <button
                      type="button"
                      onClick={() => setSelected(player)}
                      className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors duration-300 hover:bg-surface-high"
                    >
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-canopy-soft text-[11px] font-semibold text-canopy-deep">
                        {initialsFrom(player.username, "??")}
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13.5px] text-ink">
                          {player.username || "Unnamed player"}
                        </span>
                        <span className="block truncate text-[12px] text-ink-faint">
                          Level {formatNumber(player.currentLevel)} ·{" "}
                          {formatNumber(player.coins)} coins
                        </span>
                      </span>

                      <span className="shrink-0 font-display text-[14px] font-semibold text-ink tabular-nums">
                        {formatNumber(player.totalScore)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>

              {!searching ? (
                <div className="flex items-center justify-between gap-4 border-t border-line px-5 py-3.5">
                  <p className="text-[12.5px] text-ink-faint">
                    Showing {rows.length} on page {page + 1}
                  </p>

                  <div className="flex items-center gap-2">
                    <PagerButton onClick={previous} disabled={!hasPrevious} label="Previous">
                      <ChevronLeft size={15} strokeWidth={2} />
                      <span>Previous</span>
                    </PagerButton>

                    <PagerButton onClick={next} disabled={!hasNext} label="Next">
                      <span>Next</span>
                      <ChevronRight size={15} strokeWidth={2} />
                    </PagerButton>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </Panel>
      </Reveal>

      <PlayerDrawer player={selected} onClose={() => setSelected(null)} />
    </>
  );
}

function PagerButton({
  onClick,
  disabled,
  label,
  children,
}: {
  onClick: () => void;
  disabled: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="inline-flex items-center gap-1.5 rounded-xl border border-line-strong px-3 py-1.5 text-[12.5px] text-ink-soft transition-colors duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:border-line-strong hover:bg-surface-high hover:text-ink disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent"
    >
      {children}
    </button>
  );
}
