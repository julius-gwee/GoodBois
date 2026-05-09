import type { SessionCaseRepo, NewSessionCaseInput } from "./contracts";
import type { SessionCase, SessionCaseRow } from "./types";
import { rowToSessionCase, sessionCaseToRow } from "./mappers";

export class D1SessionCaseRepo implements SessionCaseRepo {
  constructor(private readonly db: D1Database) {}

  async create(
    input: NewSessionCaseInput,
    id: string,
    createdAt: string,
  ): Promise<SessionCase> {
    const c: SessionCase = { ...input, id, createdAt };
    const row = sessionCaseToRow(c);
    await this.db.prepare(`
      INSERT INTO cases (
        id, session_id, kiosk_id, src_lang, request_type,
        history_json, tool_calls_json, kiosk_message,
        receipt_id, hazard_reference_id, signposted_agency_key, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      row.id, row.session_id, row.kiosk_id, row.src_lang, row.request_type,
      row.history_json, row.tool_calls_json, row.kiosk_message,
      row.receipt_id, row.hazard_reference_id, row.signposted_agency_key, row.created_at,
    ).run();
    return c;
  }

  async getById(id: string): Promise<SessionCase | null> {
    const row = await this.db
      .prepare("SELECT * FROM cases WHERE id = ?")
      .bind(id)
      .first<SessionCaseRow>();
    return row ? rowToSessionCase(row) : null;
  }

  async getBySessionId(sessionId: string): Promise<SessionCase | null> {
    const row = await this.db
      .prepare("SELECT * FROM cases WHERE session_id = ? ORDER BY created_at DESC LIMIT 1")
      .bind(sessionId)
      .first<SessionCaseRow>();
    return row ? rowToSessionCase(row) : null;
  }
}
