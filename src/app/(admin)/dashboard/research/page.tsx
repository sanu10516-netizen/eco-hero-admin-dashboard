"use client";

import { useMemo, useState } from "react";
import { Download, Search } from "lucide-react";

import { useLiveCollection } from "@/lib/use-collection";
import { COLLECTIONS, RESEARCH_QUESTIONS, type ResearchDoc } from "@/lib/schema";
import { formatDateTime, formatNumber, shortId, toDate } from "@/lib/format";
import { downloadCsv, stampedFilename, toCsv, type Column } from "@/lib/csv";
import { PageHeading, Panel, PanelHeader } from "@/components/ui/panel";
import { EmptyState, ErrorState, Skeleton, SkeletonTable } from "@/components/ui/states";
import { Distribution, type Tally } from "@/components/viz/distribution";
import { Reveal } from "@/components/reveal";

type Row = ResearchDoc & { id: string };

export default function ResearchPage() {
  const { data, loading, error } = useLiveCollection<ResearchDoc>(COLLECTIONS.research);

  const [mission, setMission] = useState<string>("all");
  const [search, setSearch] = useState("");

  const missions = useMemo(() => {
    const found = new Set<number>();
    data.forEach((row) => {
      if (typeof row.missionNumber === "number") found.add(row.missionNumber);
    });
    return Array.from(found).sort((a, b) => a - b);
  }, [data]);

  const filtered = useMemo<Row[]>(() => {
    const term = search.trim().toLowerCase();

    return data
      .filter((row) => {
        if (mission !== "all" && String(row.missionNumber ?? "") !== mission) return false;

        if (!term) return true;

        return [row.userId, row.answer1, row.answer2, row.answer3]
          .filter(Boolean)
          .some((field) => String(field).toLowerCase().includes(term));
      })
      .sort(
        (a, b) =>
          (toDate(b.submittedAt)?.getTime() ?? 0) - (toDate(a.submittedAt)?.getTime() ?? 0),
      );
  }, [data, mission, search]);

  const distributions = useMemo(() => {
    return RESEARCH_QUESTIONS.map(({ key, prompt }) => {
      const counts = new Map<string, number>();

      filtered.forEach((row) => {
        const answer = (row[key] ?? "").toString().trim();
        if (!answer) return;
        counts.set(answer, (counts.get(answer) ?? 0) + 1);
      });

      const tallies: Tally[] = Array.from(counts.entries())
        .map(([answer, count]) => ({ answer, count }))
        .sort((a, b) => b.count - a.count);

      const total = tallies.reduce((sum, entry) => sum + entry.count, 0);

      return { key, prompt, tallies, total };
    });
  }, [filtered]);

  function exportRows() {
    const columns: Column<Row>[] = [
      { header: "Response ID", value: (row) => row.id },
      { header: "Player ID", value: (row) => row.userId ?? "" },
      { header: "Mission", value: (row) => row.missionNumber ?? "" },
      { header: "Answer 1", value: (row) => row.answer1 ?? "" },
      { header: "Answer 2", value: (row) => row.answer2 ?? "" },
      { header: "Answer 3", value: (row) => row.answer3 ?? "" },
      {
        header: "Submitted",
        value: (row) => toDate(row.submittedAt)?.toISOString() ?? "",
      },
    ];

    downloadCsv(stampedFilename("eco-hero-research"), toCsv(filtered, columns));
  }

  if (error) {
    return (
      <div className="space-y-7">
        <PageHeading eyebrow="Survey" title="Research" detail="Questionnaire responses collected in game." />
        <ErrorState error={error} />
      </div>
    );
  }

  return (
    <Reveal className="space-y-6">
      <PageHeading
        eyebrow="Survey" title="Research"
        detail="Questionnaire responses collected after missions. This is the measured output of the study, so nothing here is rounded, grouped or inferred."
        action={
          <button
            type="button"
            onClick={exportRows}
            disabled={loading || filtered.length === 0}
            className="inline-flex items-center gap-2 rounded-xl border border-line-strong px-3.5 py-2 text-[13px] text-ink-soft transition-colors duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-surface hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Download size={15} strokeWidth={2} />
            Export {filtered.length ? `${formatNumber(filtered.length)} rows` : "CSV"}
          </button>
        }
      />

      <section className="reveal-item">
        {loading ? (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {[0, 1, 2].map((index) => (
              <Skeleton key={index} className="h-52" />
            ))}
          </div>
        ) : filtered.length === 0 ? null : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {distributions.map((entry) => (
              <Distribution
                key={entry.key}
                prompt={entry.prompt}
                tallies={entry.tallies}
                total={entry.total}
              />
            ))}
          </div>
        )}
      </section>

      <Panel className="reveal-item overflow-hidden">
        <PanelHeader
          title="Individual responses"
          detail={
            loading
              ? "Reading responses"
              : `${formatNumber(filtered.length)} of ${formatNumber(data.length)} shown`
          }
          action={
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search
                  size={15}
                  strokeWidth={2}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
                />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search answers"
                  aria-label="Search responses"
                  className="w-44 rounded-xl border border-line-strong bg-base py-1.5 pl-9 pr-3 text-[13px] text-ink outline-none transition-colors duration-300 placeholder:text-ink-faint focus:border-canopy focus:bg-surface focus:shadow-[0_0_0_4px_rgba(47,168,79,0.14)]"
                />
              </div>

              <select
                value={mission}
                onChange={(event) => setMission(event.target.value)}
                aria-label="Filter by mission"
                className="rounded-xl border border-line-strong bg-base px-2.5 py-1.5 text-[13px] text-ink-soft outline-none transition-colors duration-300 focus:border-canopy focus:bg-surface focus:shadow-[0_0_0_4px_rgba(47,168,79,0.14)]"
              >
                <option value="all">All missions</option>
                {missions.map((value) => (
                  <option key={value} value={String(value)}>
                    Mission {value}
                  </option>
                ))}
              </select>
            </div>
          }
        />

        {loading ? (
          <SkeletonTable rows={7} columns={5} />
        ) : data.length === 0 ? (
          <EmptyState
            collection={COLLECTIONS.research}
            title="No questionnaire responses yet"
            detail="The game writes a document here each time a player completes the questionnaire shown after a mission. If players have finished missions and this is still empty, the questionnaire screen is most likely not built into the client yet."
          />
        ) : filtered.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <p className="text-[14px] text-ink">Nothing matches those filters</p>
            <p className="mt-2 text-[13px] text-ink-soft">
              {formatNumber(data.length)} responses exist in total.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left">
              <thead>
                <tr className="border-b border-line">
                  {["Submitted", "Mission", "Player", "Answer 1", "Answer 2", "Answer 3"].map(
                    (heading) => (
                      <th
                        key={heading}
                        scope="col"
                        className="px-5 py-3 text-[12px] font-medium tracking-wide text-ink-soft"
                      >
                        {heading}
                      </th>
                    ),
                  )}
                </tr>
              </thead>

              <tbody className="divide-y divide-line">
                {filtered.map((row) => (
                  <tr
                    key={row.id}
                    className="transition-colors duration-300 hover:bg-surface-high"
                  >
                    <td className="whitespace-nowrap px-5 py-3.5 text-[12.5px] text-ink-soft">
                      {formatDateTime(row.submittedAt)}
                    </td>

                    <td className="px-5 py-3.5">
                      <span className="rounded-lg bg-base-deep px-2 py-0.5 font-mono text-[11.5px] text-ink-faint">
                        {row.missionNumber ?? "?"}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 font-mono text-[12px] text-ink-faint">
                      {shortId(row.userId)}
                    </td>

                    <td className="max-w-[200px] truncate px-5 py-3.5 text-[13px] text-ink">
                      {row.answer1 || "No answer"}
                    </td>

                    <td className="max-w-[200px] truncate px-5 py-3.5 text-[13px] text-ink">
                      {row.answer2 || "No answer"}
                    </td>

                    <td className="max-w-[200px] truncate px-5 py-3.5 text-[13px] text-ink">
                      {row.answer3 || "No answer"}
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
