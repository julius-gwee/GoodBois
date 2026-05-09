import type { D1Repos } from "./contracts";
import { D1LocationRepo } from "./locations";
import { D1SessionCaseRepo } from "./cases";
import { D1SessionReceiptRepo } from "./receipts";

/**
 * Creates concrete D1-backed repositories. SQLite has foreign keys
 * disabled by default per connection — D1 uses a fresh connection per
 * request, so we enable them here. If perf ever matters, move the
 * PRAGMA into a one-time worker init path.
 */
export function makeD1Repos(db: D1Database): D1Repos {
  // Fire-and-forget — D1 batches it before the next prepared statement.
  void db.prepare("PRAGMA foreign_keys = ON").run();
  return {
    locations: new D1LocationRepo(db),
    cases: new D1SessionCaseRepo(db),
    receipts: new D1SessionReceiptRepo(db),
  };
}

export type { D1Repos } from "./contracts";
