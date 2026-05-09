import type { SessionReceiptRepo, NewSessionReceiptInput } from "./contracts";
import type { SessionReceipt, SessionReceiptRow } from "./types";
import { rowToSessionReceipt, sessionReceiptToRow } from "./mappers";

export class D1SessionReceiptRepo implements SessionReceiptRepo {
  constructor(private readonly db: D1Database) {}

  async create(
    input: NewSessionReceiptInput,
    id: string,
    generatedAt: string,
  ): Promise<SessionReceipt> {
    const r: SessionReceipt = { ...input, id, generatedAt };
    const row = sessionReceiptToRow(r);
    await this.db.prepare(`
      INSERT INTO receipts (
        id, session_id, language, body, things_to_bring_json,
        case_summary, signposted_agency_key, hazard_reference_id, generated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      row.id, row.session_id, row.language, row.body, row.things_to_bring_json,
      row.case_summary, row.signposted_agency_key, row.hazard_reference_id, row.generated_at,
    ).run();
    return r;
  }

  async getById(id: string): Promise<SessionReceipt | null> {
    const row = await this.db
      .prepare("SELECT * FROM receipts WHERE id = ?")
      .bind(id)
      .first<SessionReceiptRow>();
    return row ? rowToSessionReceipt(row) : null;
  }
}
