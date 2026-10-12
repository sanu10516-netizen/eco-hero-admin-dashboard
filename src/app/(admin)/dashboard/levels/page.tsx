"use client";

import { useMemo } from "react";
import { Star, TimerReset } from "lucide-react";

import { useLiveCollection } from "@/lib/use-collection";
import { COLLECTIONS, type ScoreDoc, type SessionDoc } from "@/lib/schema";
import { formatNumber, toDate } from "@/lib/format";
import { levelBadge, levelLabel, sessionCompleted } from "@/lib/levels";
import { PageHeading, Panel, PanelHeader } from "@/components/ui/panel";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/states";
import { Reveal } from "@/components/reveal";

interface LevelRow {
  level: number;
  started: number;
  completed: number;
  failed: number;
  leftEarly: number;
  completionRate: number;
  averageSeconds: number | null;
  averageScore: number | null;
  averageStars: number | null;
}

interface Bucket {
  started: number;
  completed: number;
  failed: number;
  durations: number[];
  scores: number[];
  stars: number[];
}

export default function LevelsPage() {
  const sessions = useLiveCollection<SessionDoc>(COLLECTIONS.sessions);
  const scores = useLiveCollection<ScoreDoc>(COLLECTIONS.scores);

  const loading = sessions.loading || scores.loading;
  const failure = sessions.error ?? scores.error;

  const rows = useMemo<LevelRow[]>(() => {
    const byLevel = new Map<number, Bucket>();

    const bucket = (level: number) => {
      if (!byLevel.has(level)) {
        byLevel.set(level, { started: 0, completed: 0, failed: 0, durations: [], scores: [], stars: [] });
      }
      return byLevel.get(level)!;
    };

    sessions.data.forEach((session) => {
      const level = session.levelPlayed;
      if (typeof level !== "number") return;

      const entry = bucket(level);
      entry.started += 1;

      if (session.result === "failed") entry.failed += 1;

      if (!sessionCompleted(session)) return;
      entry.completed += 1;

      let seconds = typeof session.durationSeconds === "number" ? session.durationSeconds : null;

      if (seconds === null) {
        const start = toDate(session.startTime);
        const end = toDate(session.endTime);
        if (start && end) seconds = (end.getTime() - start.getTime()) / 1000;
      }

      if (seconds !== null && seconds > 0 && seconds < 60 * 60 * 3) entry.durations.push(seconds);
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
        completed: entry.completed,
        failed: entry.failed,
        leftEarly: Math.max(0, entry.started - entry.completed - entry.failed),
        completionRate: entry.started ? entry.completed / entry.started : 0,
        averageSeconds: mean(entry.durations),
        averageScore: mean(entry.scores),
        averageStars: mean(entry.stars),
      }))
      .sort((a, b) => a.level - b.level);
  }, [sessions.data, scores.data]);

  if (failure) {
    return (
      <div className="space-y-7">
        <PageHeading eyebrow="Levels" title="Level analytics" />
        <ErrorState error={failure} />
      </div>
    );
  }

  return (
    <Reveal className="space-y-6">
      <PageHeading eyebrow="Levels" title="Level analytics" />

      <Panel className="reveal-item overflow-hidden">
        <PanelHeader title="Per level performance" />

        {loading ? (
          <div className="space-y-3 p-5">
            {[0, 1, 2, 3].map((index) => (
              <Skeleton key={index} className="h-14" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <EmptyState collection={COLLECTIONS.sessions} title="No sessions have been recorded" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-left">
              <thead>
                <tr className="border-b border-line">
                  {[
                    "Level",
                    "Runs started",
                    "Completed",
                    "Failed",
                    "Left early",
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
                          {levelBadge(row.level)}
                        </span>
                        <span className="text-[13.5px] text-ink-soft">{levelLabel(row.level)}</span>
                      </div>
                    </td>

                    <Figure value={formatNumber(row.started)} />
                    <Figure value={formatNumber(row.completed)} />
                    <Figure value={formatNumber(row.failed)} />
                    <Figure value={formatNumber(row.leftEarly)} />

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

function Figure({ value }: { value: string }) {
  return (
    <td className="px-5 py-4 text-right font-display text-[14px] font-medium text-ink-soft tabular-nums">
      {value}
    </td>
  );
}

function formatClock(seconds: number): string {
  const whole = Math.round(seconds);
  const minutes = Math.floor(whole / 60);
  const rest = whole % 60;
  return minutes ? `${minutes}m ${String(rest).padStart(2, "0")}s` : `${rest}s`;
}