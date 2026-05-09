import type { Repos } from "../repos";
import { D1AgencyRepo } from "./agencies";
import { D1ReceiptRepo } from "./receipts";

/**
 * Creates concrete D1-backed repositories that satisfy the worker's `Repos`
 * contract (defined in ../repos.ts). SQLite has foreign keys disabled by
 * default per connection — D1 uses a fresh connection per request, so we
 * enable them here. The PRAGMA must complete before any repo methods are
 * called, hence the async signature.
 *
 * IMPORTANT: This function is async. Always `await makeD1Repos(env.DB)`.
 *
 * The `toolInvocations` repo is a no-op for now — main's tool layer doesn't
 * write to it, and the audit table isn't part of the MVP D1 schema.
 */
export async function makeD1Repos(db: D1Database): Promise<Repos> {
  await db.prepare("PRAGMA foreign_keys = ON").run();
  return {
    agencies: new D1AgencyRepo(db),
    receipts: new D1ReceiptRepo(db),
    toolInvocations: { record: async () => { /* no-op for MVP */ } },
  };
}
