import type { LocationRepo, LocationFilter } from "./contracts";
import type { Location, LocationRow } from "./types";
import { rowToLocation } from "./mappers";

export class D1LocationRepo implements LocationRepo {
  constructor(private readonly db: D1Database) {}

  async list(filter: LocationFilter = {}): Promise<Location[]> {
    const where: string[] = [];
    const binds: unknown[] = [];
    if (filter.activeOnly) where.push("active = 1");
    if (filter.category) {
      where.push("category = ?");
      binds.push(filter.category);
    }
    const sql = `SELECT * FROM locations${where.length ? " WHERE " + where.join(" AND ") : ""} ORDER BY name`;
    const { results } = await this.db.prepare(sql).bind(...binds).all<LocationRow>();
    return (results ?? []).map(rowToLocation);
  }

  async getByKey(key: string): Promise<Location | null> {
    const row = await this.db
      .prepare("SELECT * FROM locations WHERE key = ?")
      .bind(key)
      .first<LocationRow>();
    return row ? rowToLocation(row) : null;
  }

  async exists(key: string): Promise<boolean> {
    const row = await this.db
      .prepare("SELECT 1 AS one FROM locations WHERE key = ?")
      .bind(key)
      .first<{ one: number }>();
    return row !== null;
  }
}
