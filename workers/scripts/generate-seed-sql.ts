// Generates workers/migrations/0002_seed_locations.sql from
// src/db/seeds/agencies.ts. Run with `npm run db:gen-seed`.
//
// The TS file is the source of truth — re-run this script whenever
// seed data changes.

import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { agencies } from "../src/db/seeds/agencies";

const __dirname = dirname(fileURLToPath(import.meta.url));

function sqlString(value: unknown): string {
  if (value === undefined || value === null) return "NULL";
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "1" : "0";
  // SQLite uses '' to escape single quotes inside strings.
  return `'${String(value).replace(/'/g, "''")}'`;
}

function sqlJson(value: unknown): string {
  return sqlString(JSON.stringify(value));
}

const header = `-- 0002_seed_locations.sql
-- Generated from src/db/seeds/agencies.ts by scripts/generate-seed-sql.ts.
-- Do not edit by hand. Re-run \`npm run db:gen-seed\` after changing the seed.
-- Source-of-truth count: ${agencies.length} rows.

`;

const rows = agencies.map((a) => {
  const cols = [
    sqlString(a.key),
    sqlString(a.name),
    sqlString(a.category),
    sqlString(a.hotline),
    sqlString(a.address),
    sqlString(a.url),
    sqlString(a.openingHours),
    sqlJson(a.multilingualBlurb ?? {}),
    sqlString(a.latitude),
    sqlString(a.longitude),
    sqlString(a.walkingDirectionsHint),
    sqlString(a.active),
    sqlString(a.source),
    sqlString(a.updatedAt),
  ].join(", ");
  return `INSERT INTO locations (
  key, name, category, hotline, address, url, opening_hours,
  multilingual_blurb, latitude, longitude, walking_directions,
  active, source, updated_at
) VALUES (${cols});`;
});

const out = header + rows.join("\n") + "\n";
const path = resolve(__dirname, "..", "migrations", "0002_seed_locations.sql");
writeFileSync(path, out, "utf-8");
console.log(`Wrote ${rows.length} INSERTs to ${path}`);
