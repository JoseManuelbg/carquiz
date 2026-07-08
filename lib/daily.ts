// Deterministic daily selection: everyone gets the same car on a given date,
// with no randomness and no need to store today's answer anywhere.

/** Local calendar day as "YYYY-MM-DD". */
export function todayKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Stable hash of the date string -> index into the candidate list. */
export function dailyIndex(dateKey: string, length: number): number {
  if (length <= 0) return 0;
  let h = 2166136261;
  for (let i = 0; i < dateKey.length; i++) {
    h ^= dateKey.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h) % length;
}
