type Prefix = "GBR";

const counters = new Map<string, number>();

export function generateId(prefix: Prefix, now: Date = new Date()): string {
  const ymd = sgYmd(now);
  const key = `${prefix}-${ymd}`;
  const next = (counters.get(key) ?? 0) + 1;
  counters.set(key, next);
  return `${prefix}-${ymd}-${String(next).padStart(3, "0")}`;
}

/**
 * Bumps the in-isolate counter for `prefix` on the given day up to at least
 * `value`, so the next `generateId` call returns `value + 1` (or higher).
 *
 * Workers gives each isolate its own module-level `counters` map, so a freshly
 * spun-up isolate restarts at `-001` and collides with rows a previous isolate
 * already wrote. Durable repos call this to reseed the counter from the
 * database before allocating. See `D1ReceiptRepo.create`.
 */
export function ensureCounterAtLeast(
  prefix: Prefix,
  value: number,
  now: Date = new Date(),
): void {
  const key = `${prefix}-${sgYmd(now)}`;
  if ((counters.get(key) ?? 0) < value) counters.set(key, value);
}

export function sgYmd(d: Date = new Date()): string {
  const sg = new Date(d.getTime() + 8 * 60 * 60 * 1000);
  const y = sg.getUTCFullYear();
  const m = String(sg.getUTCMonth() + 1).padStart(2, "0");
  const day = String(sg.getUTCDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

export function _resetCounters(): void {
  counters.clear();
}
