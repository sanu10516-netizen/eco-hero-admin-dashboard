export const TOTAL_LEVELS = 6;

export function levelLabel(number: number | undefined | null): string {
  if (typeof number !== "number" || !Number.isFinite(number) || number < 1) return "Unknown";
  return number === 1 ? "Tutorial" : `Level ${number - 1}`;
}

export function levelBadge(number: number | undefined | null): string {
  if (typeof number !== "number" || !Number.isFinite(number) || number < 1) return "?";
  return number === 1 ? "T" : String(number - 1);
}

export function progressLabel(currentLevel: number | undefined | null): string {
  const n = typeof currentLevel === "number" && currentLevel >= 1 ? currentLevel : 1;
  return n > TOTAL_LEVELS ? "All levels complete" : levelLabel(n);
}

export function sessionCompleted(session: { result?: string; endTime?: unknown }): boolean {
  return session.result ? session.result === "completed" : Boolean(session.endTime);
}