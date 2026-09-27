"use client";

import { useId, useMemo, type CSSProperties } from "react";

export interface SeriesPoint {
  label: string;
  value: number;
}

export function SparkLine({
  data,
  height = 190,
  stroke = "#2fa84f",
  fill = "rgba(47,168,79,0.28)",
  showAxis = true,
}: {
  data: SeriesPoint[];
  height?: number;
  stroke?: string;
  fill?: string;
  showAxis?: boolean;
}) {
  const gradientId = useId();

  const geometry = useMemo(() => {
    if (data.length < 2) return null;

    const width = 1000;
    const padTop = 16;
    const padBottom = showAxis ? 26 : 10;
    const usable = height - padTop - padBottom;

    const values = data.map((point) => point.value);
    const highest = Math.max(...values);
    const lowest = Math.min(...values, 0);
    const span = highest - lowest || 1;

    const points = data.map((point, index) => ({
      x: (index / (data.length - 1)) * width,
      y: padTop + usable - ((point.value - lowest) / span) * usable,
      value: point.value,
    }));

    let line = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;

    for (let i = 0; i < points.length - 1; i += 1) {
      const previous = points[i - 1] ?? points[i];
      const current = points[i];
      const next = points[i + 1];
      const after = points[i + 2] ?? next;

      const c1x = current.x + (next.x - previous.x) / 6;
      const c1y = current.y + (next.y - previous.y) / 6;
      const c2x = next.x - (after.x - current.x) / 6;
      const c2y = next.y - (after.y - current.y) / 6;

      line += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${next.x.toFixed(2)} ${next.y.toFixed(2)}`;
    }

    const baseline = height - padBottom;
    const area = `${line} L ${width} ${baseline} L 0 ${baseline} Z`;

    return { width, line, area, points, highest, baseline };
  }, [data, height, showAxis]);

  if (!geometry) {
    return (
      <div
        style={{ height }}
        className="flex items-center justify-center text-[13px] text-ink-faint"
      >
        Not enough readings to plot a trend yet.
      </div>
    );
  }

  const { width, line, area, points, baseline, highest } = geometry;
  const last = points[points.length - 1];

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className="w-full"
      style={{ height }}
      role="img"
      aria-label={`Trend across ${data.length} points, peaking at ${highest}`}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={fill} />
          <stop offset="100%" stopColor="rgba(47,168,79,0)" />
        </linearGradient>
      </defs>

      {[0.25, 0.5, 0.75].map((ratio) => (
        <line
          key={ratio}
          x1="0"
          x2={width}
          y1={baseline * ratio + 12}
          y2={baseline * ratio + 12}
          stroke="rgba(20,48,28,0.07)"
          strokeWidth="1"
          strokeDasharray="4 6"
          vectorEffect="non-scaling-stroke"
        />
      ))}

      <path d={area} fill={`url(#${gradientId})`} />

      <path
        d={line}
        className="draw-line"
        pathLength={1}
        style={{ "--draw-length": "1" } as CSSProperties}
        fill="none"
        stroke={stroke}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />

      <g>
        <line
          x1={last.x}
          x2={last.x}
          y1={last.y}
          y2={baseline}
          stroke={stroke}
          strokeWidth="1.5"
          strokeDasharray="3 4"
          strokeOpacity="0.5"
          vectorEffect="non-scaling-stroke"
        />

        <line
          x1={last.x - 14}
          x2={last.x}
          y1={last.y}
          y2={last.y}
          stroke={stroke}
          strokeWidth="6"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </g>
    </svg>
  );
}
