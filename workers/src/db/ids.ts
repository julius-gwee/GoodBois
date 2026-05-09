type Prefix = "GBC" | "GBR";

const counters = new Map<string, number>();

export function generateId(prefix: Prefix, now: Date = new Date()): string {
  const ymd = sgYmd(now);
  const key = `${prefix}-${ymd}`;
  const next = (counters.get(key) ?? 0) + 1;
  counters.set(key, next);
  return `${prefix}-${ymd}-${String(next).padStart(3, "0")}`;
}

function sgYmd(d: Date): string {
  const sg = new Date(d.getTime() + 8 * 60 * 60 * 1000);
  const y = sg.getUTCFullYear();
  const m = String(sg.getUTCMonth() + 1).padStart(2, "0");
  const day = String(sg.getUTCDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

export function _resetCounters(): void {
  counters.clear();
}
