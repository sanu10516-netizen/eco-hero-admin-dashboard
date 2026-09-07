import { Timestamp } from "firebase/firestore";

/**
 * Firestore hands back a Timestamp, but a document written by an older build,
 * or one still holding a pending server timestamp, can arrive as null, a raw
 * seconds object, or a date string. Everything funnels through here so a single
 * malformed row cannot take a whole page down.
 */
export function toDate(value: unknown): Date | null {
  if (!value) return null;

  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;

  if (typeof value === "object" && value !== null && "seconds" in value) {
    const seconds = (value as { seconds?: unknown }).seconds;
    if (typeof seconds === "number") return new Date(seconds * 1000);
  }

  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  return null;
}

const DATE_TIME = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const DATE_ONLY = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export function formatDateTime(value: unknown): string {
  const date = toDate(value);
  return date ? DATE_TIME.format(date) : "No record";
}

export function formatDate(value: unknown): string {
  const date = toDate(value);
  return date ? DATE_ONLY.format(date) : "No record";
}

/** Compact relative wording for activity columns. */
export function formatRelative(value: unknown): string {
  const date = toDate(value);
  if (!date) return "No record";

  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 0) return "Just now";
  if (seconds < 60) return `${seconds}s ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;

  return DATE_ONLY.format(date);
}

/** Duration between two points, written for scanning rather than precision. */
export function formatDuration(from: unknown, to: unknown): string {
  const start = toDate(from);
  const end = toDate(to);
  if (!start || !end) return "Incomplete";

  const seconds = Math.max(0, Math.round((end.getTime() - start.getTime()) / 1000));
  if (seconds < 60) return `${seconds}s`;

  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  if (minutes < 60) return rest ? `${minutes}m ${rest}s` : `${minutes}m`;

  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}

const NUMBER = new Intl.NumberFormat("en-GB");

export function formatNumber(value: number | undefined | null): string {
  if (typeof value !== "number" || Number.isNaN(value)) return "0";
  return NUMBER.format(value);
}

/** Shortens large counts for metric tiles so the type size can stay fixed. */
export function formatCompact(value: number | undefined | null): string {
  if (typeof value !== "number" || Number.isNaN(value)) return "0";
  if (Math.abs(value) < 10_000) return NUMBER.format(value);
  if (Math.abs(value) < 1_000_000) return `${(value / 1000).toFixed(1)}k`;
  return `${(value / 1_000_000).toFixed(1)}M`;
}

export function formatPercent(part: number, whole: number): string {
  if (!whole) return "0%";
  return `${Math.round((part / whole) * 100)}%`;
}

/** Short, stable identifier for tables. Full ids are too wide to scan. */
export function shortId(id: string | undefined | null): string {
  if (!id) return "unknown";
  return id.length <= 10 ? id : `${id.slice(0, 6)}…${id.slice(-4)}`;
}

export function initialsFrom(name: string | undefined, fallback = "??"): string {
  const cleaned = (name ?? "").trim();
  if (!cleaned) return fallback;

  const parts = cleaned.split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("") || fallback;
}
