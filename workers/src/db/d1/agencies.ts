import type { AgencyRepo, AgencyListFilter } from "../repos";
import type { AgencyContact } from "../../types/contracts";
import type { LocationRow } from "./types";
import { rowToAgency } from "./mappers";

export class D1AgencyRepo implements AgencyRepo {
  constructor(private readonly db: D1Database) {}

  async list(filter: AgencyListFilter = {}): Promise<AgencyContact[]> {
    const where: string[] = [];
    const binds: unknown[] = [];
    if (filter.activeOnly) where.push("active = 1");
    if (filter.category) {
      where.push("category = ?");
      binds.push(filter.category);
    }
    const sql = `SELECT * FROM locations${where.length ? " WHERE " + where.join(" AND ") : ""} ORDER BY name`;
    const { results } = await this.db.prepare(sql).bind(...binds).all<LocationRow>();
    return (results ?? []).map(rowToAgency);
  }

  async getByKey(key: string): Promise<AgencyContact | null> {
    const row = await this.db
      .prepare("SELECT * FROM locations WHERE key = ?")
      .bind(key)
      .first<LocationRow>();
    return row ? rowToAgency(row) : null;
  }

  async exists(key: string): Promise<boolean> {
    const row = await this.db
      .prepare("SELECT 1 AS one FROM locations WHERE key = ?")
      .bind(key)
      .first<{ one: number }>();
    return row !== null;
  }
}
