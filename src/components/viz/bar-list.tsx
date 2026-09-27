"use client";

export type BarAccent = "canopy" | "tide" | "sun" | "coral" | "berry";

export interface BarRow {
  label: string;
  value: number;
  note?: string;
  accent?: BarAccent;
}

const TONE: Record<BarAccent, string> = {
  canopy: "#2fa84f",
  tide: "#1c9ce0",
  sun: "#f5b323",
  coral: "#f0603c",
  berry: "#7c5cf0",
};

export function BarList({
  rows,
  emptyNote = "Nothing recorded yet.",
  showShare = false,
}: {
  rows: BarRow[];
  emptyNote?: string;
  showShare?: boolean;
}) {
  const total = rows.reduce((sum, row) => sum + row.value, 0);

  if (!rows.length || total === 0) {
    return <p className="px-5 py-10 text-center text-[13px] text-ink-faint">{emptyNote}</p>;
  }

  const largest = Math.max(...rows.map((row) => row.value), 1);

  return (
    <ul className="space-y-4 px-5 py-5">
      {rows.map((row, index) => {
        const colour = TONE[row.accent ?? "canopy"];

        return (
          <li key={row.label}>
            <div className="mb-2 flex items-baseline justify-between gap-4">
              <div className="min-w-0">
                <span className="text-[13.5px] font-medium text-ink">{row.label}</span>
                {row.note ? (
                  <span className="ml-2 text-[12px] text-ink-faint">{row.note}</span>
                ) : null}
              </div>

              <span className="shrink-0 font-display text-[14px] font-semibold text-ink tabular-nums">
                {row.value}
                {showShare && total ? (
                  <span className="ml-1.5 text-[12px] font-medium text-ink-faint">
                    {Math.round((row.value / total) * 100)}%
                  </span>
                ) : null}
              </span>
            </div>

            <div className="h-3 overflow-hidden rounded-full bg-base-deep">
              <div
                className="grow-bar h-full rounded-full"
                style={{
                  width: `${Math.max((row.value / largest) * 100, 3)}%`,
                  backgroundColor: colour,
                  animationDelay: `${index * 90}ms`,
                  boxShadow: `0 0 0 1px ${colour}22`,
                }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
