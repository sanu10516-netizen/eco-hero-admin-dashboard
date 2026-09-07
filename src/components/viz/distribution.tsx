"use client";

export interface Tally {
  answer: string;
  count: number;
}

/** Cycled so adjacent answers never share a colour. */
const PALETTE = ["#2fa84f", "#1c9ce0", "#7c5cf0", "#f5b323", "#f0603c"];

/**
 * Proportion bars for one survey question.
 *
 * Bars are drawn against the largest response rather than the total, so a
 * question where the answers are close together still shows a readable
 * difference. The percentage label always reports the share of all responses,
 * which is the figure that belongs in a report.
 */
export function Distribution({
  prompt,
  tallies,
  total,
}: {
  prompt: string;
  tallies: Tally[];
  total: number;
}) {
  if (!total) {
    return (
      <div className="rounded-2xl border border-line bg-surface p-5">
        <p className="text-[14px] font-medium text-ink">{prompt}</p>
        <p className="mt-2 text-[12.5px] text-ink-faint">
          No responses recorded for this question.
        </p>
      </div>
    );
  }

  const largest = Math.max(...tallies.map((entry) => entry.count), 1);

  return (
    <div className="rounded-2xl border border-line bg-surface p-5 card-lift">
      <p className="font-display text-[15px] font-semibold leading-snug text-ink">{prompt}</p>

      <p className="mt-1.5 text-[12px] text-ink-faint">
        {total} {total === 1 ? "response" : "responses"} across {tallies.length}{" "}
        {tallies.length === 1 ? "option" : "distinct options"}
      </p>

      <ul className="mt-5 space-y-3.5">
        {tallies.map((entry, index) => {
          const share = Math.round((entry.count / total) * 100);
          const width = (entry.count / largest) * 100;
          const colour = PALETTE[index % PALETTE.length];

          return (
            <li key={entry.answer}>
              <div className="mb-1.5 flex items-baseline justify-between gap-4">
                <span className="min-w-0 truncate text-[13px] text-ink-soft">{entry.answer}</span>

                <span className="shrink-0 font-display text-[13px] font-semibold text-ink tabular-nums">
                  {share}%
                  <span className="ml-1 text-[12px] font-medium text-ink-faint">
                    ({entry.count})
                  </span>
                </span>
              </div>

              <div className="h-2.5 overflow-hidden rounded-full bg-base-deep">
                <div
                  className="grow-bar h-full rounded-full"
                  style={{
                    width: `${Math.max(width, 3)}%`,
                    backgroundColor: colour,
                    animationDelay: `${index * 80}ms`,
                  }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
