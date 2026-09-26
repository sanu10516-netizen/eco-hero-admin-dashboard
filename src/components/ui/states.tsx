"use client";

import { Sprout, TriangleAlert } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";

export function Skeleton({
  className = "",
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) {
  return <div className={`skeleton rounded-lg ${className}`} style={style} />;
}

export function SkeletonTable({
  rows = 6,
  columns = 5,
}: {
  rows?: number;
  columns?: number;
}) {
  return (
    <div className="divide-y divide-line">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex items-center gap-4 px-5 py-4">
          <Skeleton className="size-9 shrink-0 rounded-xl" />

          {Array.from({ length: columns }).map((_, cellIndex) => (
            <Skeleton
              key={cellIndex}
              className="h-3.5"
              style={{
                width: cellIndex === 0 ? "22%" : `${9 + ((rowIndex + cellIndex) % 4) * 3}%`,
                animationDelay: `${rowIndex * 70}ms`,
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonMetrics({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="relative overflow-hidden rounded-2xl border border-line bg-surface p-5"
        >
          <span aria-hidden className="absolute inset-x-0 top-0 h-1 bg-line-strong" />

          <div className="flex items-start justify-between">
            <Skeleton className="h-3 w-24" style={{ animationDelay: `${index * 90}ms` }} />
            <Skeleton className="size-9 rounded-xl" style={{ animationDelay: `${index * 90}ms` }} />
          </div>

          <Skeleton className="mt-4 h-8 w-24" style={{ animationDelay: `${index * 90}ms` }} />
          <Skeleton className="mt-3 h-2.5 w-32" style={{ animationDelay: `${index * 90}ms` }} />
        </div>
      ))}
    </div>
  );
}

export function SkeletonChart({ height = 168 }: { height?: number }) {
  const heights = [38, 54, 46, 68, 58, 78, 64, 88, 72, 96, 84, 100, 90, 76];

  return (
    <div className="flex items-end gap-2 px-5 pb-2" style={{ height }}>
      {heights.map((value, index) => (
        <Skeleton
          key={index}
          className="min-w-0 flex-1 rounded-md"
          style={{ height: `${value}%`, animationDelay: `${index * 55}ms` }}
        />
      ))}
    </div>
  );
}

export function SkeletonBars({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-5 px-5 py-5">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index}>
          <div className="mb-2 flex items-center justify-between">
            <Skeleton className="h-3 w-28" style={{ animationDelay: `${index * 90}ms` }} />
            <Skeleton className="h-3 w-12" style={{ animationDelay: `${index * 90}ms` }} />
          </div>

          <Skeleton
            className="h-2.5 rounded-full"
            style={{ width: `${90 - index * 16}%`, animationDelay: `${index * 90}ms` }}
          />
        </div>
      ))}
    </div>
  );
}

export function SkeletonList({ rows = 6 }: { rows?: number }) {
  return (
    <div className="divide-y divide-line">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex items-center gap-3.5 px-5 py-3.5">
          <Skeleton className="size-8 shrink-0 rounded-xl" style={{ animationDelay: `${index * 70}ms` }} />
          <Skeleton className="size-9 shrink-0 rounded-xl" style={{ animationDelay: `${index * 70}ms` }} />

          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-3 w-32" style={{ animationDelay: `${index * 70}ms` }} />
            <Skeleton
              className="h-1.5 rounded-full"
              style={{ width: `${88 - index * 12}%`, animationDelay: `${index * 70}ms` }}
            />
          </div>

          <Skeleton className="h-4 w-14 shrink-0" style={{ animationDelay: `${index * 70}ms` }} />
        </div>
      ))}
    </div>
  );
}

export function SkeletonPage({ panels = 2 }: { panels?: number }) {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-6 w-28 rounded-full" />
        <Skeleton className="mt-3 h-8 w-64" />
        <Skeleton className="mt-3 h-3.5 w-[min(560px,90%)]" />
      </div>

      <SkeletonMetrics />

      {Array.from({ length: panels }).map((_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-2xl border border-line bg-surface"
        >
          <div className="flex items-center gap-3 border-b border-line px-5 py-4">
            <Skeleton className="size-9 rounded-xl" />

            <div className="space-y-2">
              <Skeleton className="h-3.5 w-36" />
              <Skeleton className="h-2.5 w-52" />
            </div>
          </div>

          <SkeletonBars rows={3} />
        </div>
      ))}
    </div>
  );
}

export function EmptyState({
  collection,
  title,
  detail,
  action,
}: {
  collection: string;
  title: string;
  detail?: string;
  action?: ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-line bg-surface">
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-28 bg-[linear-gradient(180deg,transparent,rgba(47,168,79,0.09))]"
      />

      <div className="relative flex flex-col items-center px-6 py-14 text-center">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-canopy-soft text-canopy-deep">
          <Sprout size={24} strokeWidth={2} />
        </span>

        <h3 className="mt-5 font-display text-[17px] font-semibold text-ink">{title}</h3>

        <p className="mt-2 max-w-md text-[13.5px] leading-relaxed text-ink-soft">
          {detail ??
            "Nothing has been written here yet. This is what the view looks like before the game produces data."}
        </p>

        <code className="mt-4 rounded-lg border border-line bg-base-deep px-3 py-1.5 font-mono text-[12px] text-ink-soft">
          {collection} returned 0 documents
        </code>

        {action ? <div className="mt-6">{action}</div> : null}
      </div>
    </div>
  );
}

export function ErrorState({
  title = "The database refused this request",
  error,
  hint,
}: {
  title?: string;
  error: unknown;
  hint?: string;
}) {
  const asRecord = error as { code?: string; message?: string } | null;
  const code = asRecord?.code ?? "unknown";
  const message = asRecord?.message ?? String(error ?? "No detail provided.");

  const isPermission = code.includes("permission-denied");

  return (
    <div className="overflow-hidden rounded-2xl border border-coral/30 bg-surface">
      <div className="flex items-start gap-4 p-6">
        <span className="mt-0.5 flex size-11 shrink-0 items-center justify-center rounded-2xl bg-coral-soft text-coral-deep">
          <TriangleAlert size={20} strokeWidth={2} />
        </span>

        <div className="min-w-0 flex-1">
          <h3 className="font-display text-[17px] font-semibold text-ink">{title}</h3>

          <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-soft">
            {hint ??
              (isPermission
                ? "The signed in account does not satisfy the Firestore rule protecting this path. Confirm the admins document exists and the rules grant it read access."
                : "The query did not complete. The technical response is below.")}
          </p>

          <div className="mt-4 overflow-x-auto rounded-xl border border-line bg-base-deep p-3.5">
            <p className="font-mono text-[12px] font-medium text-coral-deep">{code}</p>
            <p className="mt-1 font-mono text-[12px] leading-relaxed break-words text-ink-soft">
              {message}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
