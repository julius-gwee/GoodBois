import type { ReceiptRepo, NewReceiptInput } from "../repos";
import type { Receipt } from "../../types/contracts";
import type { ReceiptRow } from "./types";
import { rowToReceipt, receiptToRow } from "./mappers";
import { generateId } from "../ids";

export class D1ReceiptRepo implements ReceiptRepo {
  constructor(private readonly db: D1Database) {}

  async create(input: NewReceiptInput): Promise<Receipt> {
    const id = generateId("GBR");
    const generatedAt = new Date().toISOString();
    const r: Receipt = { ...input, id, generatedAt };
    const row = receiptToRow(r);
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

  async getById(id: string): Promise<Receipt | null> {
    const row = await this.db
      .prepare("SELECT * FROM receipts WHERE id = ?")
      .bind(id)
      .first<ReceiptRow>();
    return row ? rowToReceipt(row) : null;
  }
}
