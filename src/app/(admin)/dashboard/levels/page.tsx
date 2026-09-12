"use client";

import { useMemo } from "react";
import { Info, Star, TimerReset, TrendingDown } from "lucide-react";

import { useLiveCollection } from "@/lib/use-collection";
import { COLLECTIONS, type ScoreDoc, type SessionDoc } from "@/lib/schema";
import { formatNumber, formatPercent, toDate } from "@/lib/format";
import { PageHeading, Panel, PanelHeader } from "@/components/ui/panel";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/states";
import { Reveal } from "@/components/reveal";

interface LevelRow {
  level: number;
  started: number;
  finished: number;
  abandoned: number;
  completionRate: number;
  averageSeconds: number | null;
  averageScore: number | null;
  averageStars: number | null;
}

export default function LevelsPage() {
  const sessions = useLiveCollection<SessionDoc>(COLLECTIONS.sessions);
  const scores = useLiveCollection<ScoreDoc>(COLLECTIONS.scores);

  const loading = sessions.loading || scores.loading;
  const failure = sessions.error ?? scores.error;

  const rows = useMemo<LevelRow[]>(() => {
    const byLevel = new Map<
      number,
      { started: number; finished: number; durations: number[]; scores: number[]; stars: number[] }
    >();

    const bucket = (level: number) => {
      if (!byLevel.has(level)) {
        byLevel.set(level, { started: 0, finished: 0, durations: [], scores: [], stars: [] });
      }
      return byLevel.get(level)!;
    };

    sessions.data.forEach((session) => {
      const level = session.levelPlayed;
      if (typeof level !== "number") return;

      const entry = bucket(level);
      entry.started += 1;

      const start = toDate(session.startTime);
      const end = toDate(session.endTime);

      if (end && start) {
        entry.finished += 1;
        const seconds = (end.getTime() - start.getTime()) / 1000;
        // Guard against clock skew and sessions left open across a restart,
        // either of which would drag the average somewhere meaningless.
        if (seconds > 0 && seconds < 60 * 60 * 3) entry.durations.push(seconds);
      }
    });

    scores.data.forEach((run) => {
      const level = run.level;
      if (typeof level !== "number") return;

      const entry = bucket(level);
      if (typeof run.score === "number") entry.scores.push(run.score);
      if (typeof run.stars === "number") entry.stars.push(run.stars);
    });

    const mean = (values: number[]) =>
      values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;

    return Array.from(byLevel.entries())
      .map(([level, entry]) => ({
        level,
        started: entry.started,
        finished: entry.finished,
        abandoned: Math.max(0, entry.started - entry.finished),
        completionRate: entry.started ? entry.finished / entry.started : 0,
        averageSeconds: mean(entry.durations),
        averageScore: mean(entry.scores),
        averageStars: mean(entry.stars),
      }))
      .sort((a, b) => a.level - b.level);
  }, [sessions.data, scores.data]);

  // Worst completion rate, only once there is enough data to mean anything.
  const friction = useMemo(() => {
    const eligible = rows.filter((row) => row.started >= 3);
    if (!eligible.length) return null;

    return eligible.reduce((worst, row) =>
      row.completionRate < worst.completionRate ? row : worst,
    );
  }, [rows]);

  if (failure) {
    return (
      <div className="space-y-7">
        <PageHeading eyebrow="Levels" title="Level analytics" detail="How each level performs in play." />
        <ErrorState error={failure} />
      </div>
    );
  }

  return (
    <Reveal className="space-y-6">
      <PageHeading
        eyebrow="Levels" title="Level analytics"
        detail="How each level performs once players reach it, measured from opened and closed sessions rather than from level configuration."
      />

      {/* The page this replaces edited level records the game never read. That
          is worth stating plainly rather than quietly dropping the feature. */}
      <div className="reveal-item flex items-start gap-3 rounded-lg border border-tide/20 bg-tide/6 px-4 py-3.5">
        <Info size={16} strokeWidth={2} className="mt-0.5 shrink-0 text-tide" />
        <p className="text-[13px] leading-relaxed text-ink-soft">
          Levels are built as scenes inside the Unity project, so they cannot be edited from here.
          Changing a value in a database the game never reads would look like it worked and change
          nothing. This view reports how the levels actually behave instead.
        </p>
      </div>

      {friction && friction.completionRate < 0.6 ? (
        <Panel className="reveal-item border-sun/40">
          <div className="flex items-start gap-4 p-5">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-sun/40 bg-sun-soft">
              <TrendingDown size={17} strokeWidth={2} className="text-sun-deep" />
            </div>

            <div>
              <h3 className="text-[14px] font-medium text-ink">
                Level {friction.level} is where players stop
              </h3>

              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-soft">
                Only {formatPercent(friction.finished, friction.started)} of runs that start this
                level are finished. {formatNumber(friction.abandoned)} of{" "}
                {formatNumber(friction.started)} were left open, which usually means players quit
                partway rather than failing at the end.
              </p>
            </div>
          </div>
        </Panel>
      ) : null}

      <Panel className="reveal-item overflow-hidden">
        <PanelHeader
          title="Per level performance"
          detail="A run counts as finished once the session records an end time."
        />

        {loading ? (
          <div className="space-y-3 p-5">
            {[0, 1, 2, 3].map((index) => (
              <Skeleton key={index} className="h-14" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            collection={COLLECTIONS.sessions}
            title="No sessions have been recorded"
            detail="The game opens a session document when a level starts and closes it on completion. Nothing can be measured until players have played."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left">
              <thead>
                <tr className="border-b border-line">
                  {[
                    "Level",
                    "Runs started",
                    "Finished",
                    "Completion",
                    "Average time",
                    "Average score",
                    "Stars",
                  ].map((heading, index) => (
                    <th
                      key={heading}
                      scope="col"
                      className={`px-5 py-3 text-[12px] font-medium tracking-wide text-ink-soft ${
                        index > 0 ? "text-right" : ""
                      }`}
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-line">
                {rows.map((row) => (
                  <tr key={row.level} className="transition-colors duration-300 hover:bg-surface-high">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span className="flex size-8 items-center justify-center rounded-xl border border-line bg-base font-mono text-[12px] text-ink">
                          {row.level}
                        </span>
                        <span className="text-[13.5px] text-ink-soft">
                          {row.level === 1 ? "Tutorial" : `Level ${row.level}`}
                        </span>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-right font-display text-[14px] font-medium text-ink-soft tabular-nums">
                      {formatNumber(row.started)}
                    </td>

                    <td className="px-5 py-4 text-right font-display text-[14px] font-medium text-ink-soft tabular-nums">
                      {formatNumber(row.finished)}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-3">
                        <div className="h-1.5 w-20 overflow-hidden rounded-full bg-surface-high">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.round(row.completionRate * 100)}%`,
                              backgroundColor:
                                row.completionRate >= 0.75
                                  ? "#4caf50"
                                  : row.completionRate >= 0.5
                                    ? "#cc9a45"
                                    : "#c26248",
                            }}
                          />
                        </div>

                        <span className="w-10 text-right font-display text-[14px] font-semibold text-ink tabular-nums">
                          {Math.round(row.completionRate * 100)}%
                        </span>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-right">
                      {row.averageSeconds === null ? (
                        <span className="text-[12.5px] text-ink-faint">No data</span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 font-display text-[14px] font-medium text-ink-soft tabular-nums">
                          <TimerReset size={13} strokeWidth={2} className="text-ink-faint" />
                          {formatClock(row.averageSeconds)}
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-4 text-right font-display text-[14px] font-semibold text-ink tabular-nums">
                      {row.averageScore === null ? (
                        <span className="text-[12.5px] text-ink-faint">No data</span>
                      ) : (
                        formatNumber(Math.round(row.averageScore))
                      )}
                    </td>

                    <td className="px-5 py-4 text-right">
                      {row.averageStars === null ? (
                        <span className="text-[12.5px] text-ink-faint">No data</span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 font-mono text-[13px] text-sun-deep tabular-nums">
                          <Star size={13} strokeWidth={2} fill="currentColor" />
                          {row.averageStars.toFixed(1)}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </Reveal>
  );
}

function formatClock(seconds: number): string {
  const whole = Math.round(seconds);
  const minutes = Math.floor(whole / 60);
  const rest = whole % 60;
  return minutes ? `${minutes}m ${String(rest).padStart(2, "0")}s` : `${rest}s`;
}
