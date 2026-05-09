import type { D1Repos } from "./contracts";
import { D1LocationRepo } from "./locations";
import { D1SessionCaseRepo } from "./cases";
import { D1SessionReceiptRepo } from "./receipts";

/**
 * Creates concrete D1-backed repositories. SQLite has foreign keys
 * disabled by default per connection — D1 uses a fresh connection per
 * request, so we enable them here. The PRAGMA must complete before
 * any repo methods are called, hence the async signature.
 *
 * IMPORTANT: This function is async. Always `await makeD1Repos(env.DB)`.
 * Forgetting to await returns a Promise<D1Repos> instead of the repos
 * object — TypeScript will catch this at the call site, but the
 * symptom (".locations is undefined") is unhelpful without context.
 */
export async function makeD1Repos(db: D1Database): Promise<D1Repos> {
  await db.prepare("PRAGMA foreign_keys = ON").run();
  return {
    locations: new D1LocationRepo(db),
    cases: new D1SessionCaseRepo(db),
    receipts: new D1SessionReceiptRepo(db),
  };
}

export type { D1Repos } from "./contracts";
