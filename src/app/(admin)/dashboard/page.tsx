"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Crown,
  Flag,
  Gauge,
  Radio,
  Star,
  Trophy,
  Users,
} from "lucide-react";

import { useLiveCollection } from "@/lib/use-collection";
import { COLLECTIONS, type PlayerDoc, type ScoreDoc, type SessionDoc } from "@/lib/schema";
import { formatCompact, formatNumber, formatRelative, toDate } from "@/lib/format";
import { levelBadge, levelLabel, progressLabel, sessionCompleted } from "@/lib/levels";
import { MetricCard, MetricGrid } from "@/components/ui/metric-card";
import { Panel, PanelHeader, Chip } from "@/components/ui/panel";
import { HeroBand } from "@/components/ui/hero-band";
import {
  EmptyState,
  ErrorState,
  SkeletonBars,
  SkeletonList,
  SkeletonMetrics,
} from "@/components/ui/states";
import { BarList, type BarRow } from "@/components/viz/bar-list";
import { Leaderboard, type Standing } from "@/components/viz/leaderboard";
import { Reveal } from "@/components/reveal";

const ACTIVE_WINDOW_MINUTES = 15;

export default function OperationsPage() {
  const players = useLiveCollection<PlayerDoc>(COLLECTIONS.players);
  const scores = useLiveCollection<ScoreDoc>(COLLECTIONS.scores);
  const sessions = useLiveCollection<SessionDoc>(COLLECTIONS.sessions);

  const loading = players.loading || scores.loading || sessions.loading;
  const failure = players.error ?? scores.error ?? sessions.error;

  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const first = window.setTimeout(() => setNow(Date.now()), 0);
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);

    return () => {
      window.clearTimeout(first);
      window.clearInterval(timer);
    };
  }, []);

  const stats = useMemo(() => {
    const cutoff = (now ?? 0) - ACTIVE_WINDOW_MINUTES * 60 * 1000;

    const active = new Set(
      sessions.data
        .filter((session) => {
          if (session.endTime) return false;
          const started = toDate(session.startTime);
          return started ? started.getTime() >= cutoff : false;
        })
        .map((session) => session.userId)
        .filter(Boolean) as string[],
    );

    const runScores = scores.data.map((run) => run.score ?? 0);
    const totalScore = runScores.reduce((sum, value) => sum + value, 0);
    const best = scores.data.reduce<ScoreDoc | null>(
      (top, run) => ((run.score ?? 0) > (top?.score ?? -1) ? run : top),
      null,
    );

    const starsAwarded = scores.data.reduce((sum, run) => sum + (run.stars ?? 0), 0);
    const perfect = scores.data.filter((run) => (run.stars ?? 0) >= 3).length;

    const finished = sessions.data.filter(sessionCompleted).length;
    const clearRate = sessions.data.length ? finished / sessions.data.length : 0;

    const deepest = players.data.reduce(
      (highest, player) => Math.max(highest, player.currentLevel ?? 0),
      0,
    );

    return {
      players: players.data.length,
      active: active.size,
      runs: scores.data.length,
      totalScore,
      averageScore: runScores.length ? Math.round(totalScore / runScores.length) : 0,
      best,
      starsAwarded,
      perfect,
      clearRate,
      deepest,
    };
  }, [players.data, scores.data, sessions.data, now]);

  const progression = useMemo<BarRow[]>(() => {
    const counts = new Map<number, number>();

    players.data.forEach((player) => {
      const level = player.currentLevel ?? 1;
      counts.set(level, (counts.get(level) ?? 0) + 1);
    });

    return Array.from(counts.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([level, count]) => ({
        label: progressLabel(level),
        value: count,
        note: count === 1 ? "player" : "players",
        accent: "tide" as const,
      }));
  }, [players.data]);

  const starSpread = useMemo<BarRow[]>(() => {
    const counts = new Map<number, number>();

    scores.data.forEach((run) => {
      const stars = Math.max(0, Math.min(3, run.stars ?? 0));
      counts.set(stars, (counts.get(stars) ?? 0) + 1);
    });

    return [3, 2, 1, 0]
      .filter((stars) => counts.has(stars))
      .map((stars) => ({
        label: stars === 1 ? "1 star" : `${stars} stars`,
        value: counts.get(stars) ?? 0,
        accent: stars === 3 ? ("sun" as const) : ("canopy" as const),
      }));
  }, [scores.data]);

  const standings = useMemo<Standing[]>(() => {
    const bestByPlayer = new Map<string, Standing>();

    scores.data.forEach((run) => {
      const uid = run.userId;
      if (!uid) return;

      const current = bestByPlayer.get(uid);
      const score = run.score ?? 0;

      if (!current || score > current.score) {
        bestByPlayer.set(uid, {
          uid,
          username: run.username || "Unnamed player",
          score,
          level: run.level ?? 0,
        });
      }
    });

    return Array.from(bestByPlayer.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);
  }, [scores.data]);

  const recent = useMemo(() => {
    return [...scores.data]
      .sort((a, b) => (toDate(b.timestamp)?.getTime() ?? 0) - (toDate(a.timestamp)?.getTime() ?? 0))
      .slice(0, 6);
  }, [scores.data]);

  if (failure) {
    return (
      <div className="space-y-6">
        <HeroBand
          eyebrow="Live from Firestore"
          title="Eco Hero mission control"
          stats={[]}
        />
        <ErrorState error={failure} />
      </div>
    );
  }

  const noData = !loading && players.data.length === 0 && scores.data.length === 0;

  return (
    <Reveal className="space-y-6">
      <HeroBand
        eyebrow="Live from Firestore"
        title="Eco Hero mission control"
        loading={loading}
        stats={[
          { label: "Players", value: stats.players, format: formatNumber },
          { label: "Runs", value: stats.runs, format: formatNumber },
          { label: "Stars", value: stats.starsAwarded, format: formatCompact },
        ]}
      />

      {loading ? (
        <SkeletonMetrics />
      ) : (
        <MetricGrid>
          <MetricCard
            label="Registered players"
            value={stats.players}
            format={formatNumber}
            icon={Users}
            tone="canopy"
          />

          <MetricCard
            label="Playing now"
            value={stats.active}
            format={formatNumber}
            icon={Radio}
            tone="tide"
          />

          <MetricCard
            label="Runs completed"
            value={stats.runs}
            format={formatNumber}
            icon={Flag}
            tone="berry"
          />

          <MetricCard
            label="Best run"
            value={stats.best?.score ?? 0}
            format={formatCompact}
            icon={Crown}
            tone="sun"
          />
        </MetricGrid>
      )}

      {noData ? (
        <EmptyState
          collection={`${COLLECTIONS.players} and ${COLLECTIONS.scores}`}
          title="The game has not written anything yet"
        />
      ) : (
        <>
          <Panel className="reveal-item">
            <PanelHeader
              title="Standings"
              icon={Trophy}
              tone="sun"
            />

            {loading ? <SkeletonList rows={5} /> : <Leaderboard standings={standings} />}
          </Panel>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <Panel className="reveal-item">
              <PanelHeader
                title="Where players are"
                icon={Gauge}
                tone="tide"
              />

              {loading ? (
                <SkeletonBars rows={3} />
              ) : (
                <BarList rows={progression} showShare emptyNote="No player accounts exist yet." />
              )}
            </Panel>

            <Panel className="reveal-item">
              <PanelHeader
                title="How well they play"
                icon={Star}
                tone="sun"
                action={<Chip tone="sun">{formatNumber(stats.starsAwarded)} total</Chip>}
              />

              {loading ? (
                <SkeletonBars rows={3} />
              ) : (
                <>
                  <BarList rows={starSpread} showShare emptyNote="No runs have been scored yet." />

                  {scores.data.length > 0 ? (
                    <div className="grid grid-cols-2 gap-px border-t border-line bg-line">
                      <Footnote
                        label="Perfect runs"
                        value={`${formatNumber(stats.perfect)} of ${formatNumber(stats.runs)}`}
                      />
                      <Footnote
                        label="Sessions completed"
                        value={`${Math.round(stats.clearRate * 100)}%`}
                      />
                    </div>
                  ) : null}
                </>
              )}
            </Panel>
          </div>

          <Panel className="reveal-item" lift={false}>
            <PanelHeader
              title="Latest runs"
              icon={Flag}
              tone="berry"
            />

            {loading ? (
              <SkeletonList rows={4} />
            ) : recent.length === 0 ? (
              <EmptyState
                collection={COLLECTIONS.scores}
                title="No runs have been recorded"
              />
            ) : (
              <ul className="divide-y divide-line">
                {recent.map((run) => (
                  <li
                    key={run.id}
                    className="flex items-center gap-4 px-5 py-3.5 transition-colors duration-300 hover:bg-surface-high"
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-canopy-soft font-display text-[13px] font-semibold text-canopy-deep">
                      {levelBadge(run.level)}
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13.5px] font-medium text-ink">
                        {run.username || "Unnamed player"}
                      </p>
                      <p className="text-[12px] text-ink-faint">
                        {levelLabel(run.level)} · {formatRelative(run.timestamp)}
                      </p>
                    </div>

                    <div
                      className="flex shrink-0 items-center gap-1"
                      aria-label={`${run.stars ?? 0} of 3 stars`}
                    >
                      {[0, 1, 2].map((index) => (
                        <Star
                          key={index}
                          size={14}
                          strokeWidth={2}
                          className={index < (run.stars ?? 0) ? "text-sun" : "text-line-strong"}
                          fill={index < (run.stars ?? 0) ? "currentColor" : "none"}
                        />
                      ))}
                    </div>

                    <p className="w-16 shrink-0 text-right font-display text-[15px] font-semibold text-canopy-deep tabular-nums">
                      {formatNumber(run.score)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </>
      )}
    </Reveal>
  );
}

function Footnote({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface px-5 py-3.5">
      <p className="text-[12px] text-ink-faint">{label}</p>
      <p className="mt-1 font-display text-[16px] font-semibold text-ink tabular-nums">{value}</p>
    </div>
  );
}
