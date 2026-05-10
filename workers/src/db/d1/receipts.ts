import type { ReceiptRepo, NewReceiptInput } from "../repos";
import type { Receipt } from "../../types/contracts";
import type { ReceiptRow } from "./types";
import { rowToReceipt, receiptToRow } from "./mappers";
import { generateId, ensureCounterAtLeast, sgYmd } from "../ids";

// `generateId` keeps its counter in module scope, which on Workers means
// per-isolate. A cold-started isolate restarts at `-001` and its `INSERT`s
// collide with the PRIMARY KEY of receipts a previous isolate already wrote.
// We reseed from D1 before allocating (covers the common cold-start case) and
// retry on the residual race window where two isolates pick the same id at once.
const MAX_ID_ATTEMPTS = 8;

function isUniqueConstraintError(e: unknown): boolean {
  const msg = e instanceof Error ? e.message : String(e);
  return /UNIQUE constraint failed/i.test(msg);
}

export class D1ReceiptRepo implements ReceiptRepo {
  constructor(private readonly db: D1Database) {}

  async create(input: NewReceiptInput): Promise<Receipt> {
    const generatedAt = new Date().toISOString();
    await this.seedIdCounter();

    let lastErr: unknown;
    for (let attempt = 0; attempt < MAX_ID_ATTEMPTS; attempt++) {
      const id = generateId("GBR");
      const row = receiptToRow({ ...input, id, generatedAt });
      try {
        await this.db
          .prepare(
            `INSERT INTO receipts (
              id, session_id, language, body, things_to_bring_json,
              case_summary, signposted_agency_key, hazard_reference_id, generated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          )
          .bind(
            row.id,
            row.session_id,
            row.language,
            row.body,
            row.things_to_bring_json,
            row.case_summary,
            row.signposted_agency_key,
            row.hazard_reference_id,
            row.generated_at,
          )
          .run();
        return { ...input, id, generatedAt };
      } catch (e) {
        lastErr = e;
        if (!isUniqueConstraintError(e)) throw e;
        // Collision — `generateId` has already advanced the counter, so the
        // next attempt picks a fresh id. Loop.
      }
    }
    throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
  }

  /**
   * Pulls the highest `GBR-<today SGT>-NNN` already in D1 and bumps the
   * in-isolate counter past it, so a cold-started isolate doesn't replay ids
   * from `-001`. Fixed-width ids make `ORDER BY id DESC` the numeric max.
   */
  private async seedIdCounter(): Promise<void> {
    const ymd = sgYmd();
    const last = await this.db
      .prepare("SELECT id FROM receipts WHERE id GLOB ? ORDER BY id DESC LIMIT 1")
      .bind(`GBR-${ymd}-???`)
      .first<{ id: string }>();
    if (!last?.id) return;
    const n = Number.parseInt(last.id.slice(-3), 10);
    if (Number.isFinite(n)) ensureCounterAtLeast("GBR", n);
  }

  async getById(id: string): Promise<Receipt | null> {
    const row = await this.db
      .prepare("SELECT * FROM receipts WHERE id = ?")
      .bind(id)
      .first<ReceiptRow>();
    return row ? rowToReceipt(row) : null;
  }
}
