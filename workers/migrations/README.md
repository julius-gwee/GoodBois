# D1 Migrations

Cloudflare D1 schema lives here. D1 is SQLite — same syntax, same caveats.

## Files

| File | What it does |
|---|---|
| `0001_schema.sql` | Creates all 7 MVP tables (`AgencyContact`, `KioskSession`, `Utterance`, `TriageResult`, `ToolInvocation`, `Case`, `Receipt`) and supporting indexes. Idempotent. |
| `0002_seed_agencies.sql` | Inserts the 18 curated agencies. Mirrors `workers/src/db/seeds/agencies.ts`. Idempotent (`INSERT OR REPLACE`). |

When seed data changes in `workers/src/db/seeds/agencies.ts`, regenerate `0002_seed_agencies.sql` so the in-memory and D1 paths stay aligned.

## One-time Cloudflare setup

Do this once per Cloudflare account.

```bash
# 1. Install wrangler (if not already a project dev-dep)
npm install -D wrangler@latest

# 2. Authenticate against your Cloudflare account
npx wrangler login

# 3. Create the D1 database
npx wrangler d1 create goodbois
# Copy the database_id from the output.

# 4. Paste the database_id into workers/wrangler.toml
#    (copy from workers/wrangler.toml.example first if wrangler.toml does not exist)
```

The `[[d1_databases]]` block in `wrangler.toml` should look like:

```toml
[[d1_databases]]
binding = "DB"
database_name = "goodbois"
database_id = "PASTE-THE-UUID-HERE"
```

## Apply migrations

Local dev (writes to `.wrangler/state/v3/d1/`):

```bash
cd workers
npx wrangler d1 execute goodbois --local --file=./migrations/0001_schema.sql
npx wrangler d1 execute goodbois --local --file=./migrations/0002_seed_agencies.sql
```

Remote (production / preview Cloudflare D1 instance):

```bash
cd workers
npx wrangler d1 execute goodbois --remote --file=./migrations/0001_schema.sql
npx wrangler d1 execute goodbois --remote --file=./migrations/0002_seed_agencies.sql
```

Verify a migration applied:

```bash
npx wrangler d1 execute goodbois --local --command="SELECT key, name FROM AgencyContact ORDER BY key;"
```

Expected: 18 rows.

## Adding a new migration

1. Create `0003_<descriptive-name>.sql` (sequential number prefix).
2. Use `IF NOT EXISTS` / `INSERT OR REPLACE` so re-runs are safe.
3. Apply locally first, verify, then apply remote.
4. If the migration changes a data contract, update `docs/standards/data-contracts.md` and the type files (`workers/src/types/contracts.ts`, `src/types/goodbois.ts`) in the same PR.
