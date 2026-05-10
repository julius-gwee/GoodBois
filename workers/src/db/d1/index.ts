import type { KioskSession } from "../../types/contracts";
import type { Repos, SessionRepo } from "../repos";
import { D1AgencyRepo } from "./agencies";
import { D1ReceiptRepo } from "./receipts";

const d1FallbackSessions = new Map<string, KioskSession>();

const sessionRepo: SessionRepo = {
  async get(id) {
    const row = d1FallbackSessions.get(id);
    if (!row) return null;
    return {
      ...row,
      history: row.history.map((message) => ({ ...message })),
    };
  },
  async put(session) {
    d1FallbackSessions.set(session.id, {
      ...session,
      history: session.history.map((message) => ({ ...message })),
    });
  },
  async delete(id) {
    d1FallbackSessions.delete(id);
  },
};

/**
 * Creates the D1-backed slice of the worker's `Repos` contract. Per the
 * refactor SSOT (invariant #9), `KioskSession` lives in KV — NOT D1 — so the
 * `sessions` repo is intentionally absent from this return value. The caller
 * (see `getRepos` in workers/src/index.ts) composes D1 with `KVSessionRepo`
 * to produce a full `Repos`.
 *
 * SQLite has foreign keys disabled by default per connection — D1 uses a
 * fresh connection per request, so we enable them here. The PRAGMA must
 * complete before any repo methods are called, hence the async signature.
 *
 * IMPORTANT: This function is async. Always `await makeD1Repos(env.DB)`.
 *
 * The `toolInvocations` repo is a no-op for now — main's tool layer doesn't
 * write to it, and the audit table isn't part of the MVP D1 schema.
 */
export async function makeD1Repos(
  db: D1Database,
): Promise<Omit<Repos, "sessions">> {
  await db.prepare("PRAGMA foreign_keys = ON").run();
  return {
    agencies: new D1AgencyRepo(db),
    receipts: new D1ReceiptRepo(db),
    sessions: sessionRepo,
    toolInvocations: { record: async () => { /* no-op for MVP */ } },
  };
}
