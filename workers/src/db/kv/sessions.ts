// workers/src/db/kv/sessions.ts
//
// KV-backed SessionRepo. Per refactor SSOT invariant #9, KioskSession is
// ephemeral, single-shot session state — wiped after each terminal /turn.
// KV is a good fit because:
//   - Writes are infrequent (once per followup turn)
//   - Reads are eventually-consistent globally, but each session is read by
//     the same kiosk that wrote it, so consistency isn't a concern in practice
//   - Built-in expiration covers abandoned sessions (user walks away mid-flow)
//
// Cloudflare KV docs: https://developers.cloudflare.com/kv/api/

import type { SessionRepo } from "../repos";
import type { KioskSession } from "../../types/contracts";

// 15 min covers realistic elderly-user pauses; abandoned sessions auto-expire.
const SESSION_TTL_SECONDS = 900;

export class KVSessionRepo implements SessionRepo {
  constructor(private readonly kv: KVNamespace) {}

  async get(id: string): Promise<KioskSession | null> {
    return await this.kv.get<KioskSession>(id, "json");
  }

  async put(session: KioskSession): Promise<void> {
    await this.kv.put(session.id, JSON.stringify(session), {
      expirationTtl: SESSION_TTL_SECONDS,
    });
  }

  async delete(id: string): Promise<void> {
    await this.kv.delete(id);
  }
}
