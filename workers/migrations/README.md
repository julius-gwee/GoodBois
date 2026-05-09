# D1 Migrations

Cloudflare D1 SQL migrations live here, applied in numeric order via `npx wrangler d1 migrations apply goodbois --local` (or `--remote` for prod).

## Current schema

| Migration | Purpose |
|---|---|
| `0001_initial.sql` | Creates `locations`, `receipts`, `cases` (in that order — `cases.receipt_id` FKs `receipts`). Includes CHECK constraints, indexes, and `ON DELETE SET NULL` on the FKs. |
| `0002_seed_locations.sql` | Generated seed data for the `locations` table. Source of truth: `src/db/seeds/agencies.ts`. Re-run `npm run db:gen-seed` after editing the TS seed. |

`KioskSession` lives in **KV** (single-shot, wiped after each terminal turn) — not D1. See refactor SSOT invariant #9 in `docs/refactor/2026-05-09-llm-turn-decision.md`.

`ToolInvocation`, `Utterance`, and `HazardReport` are explicitly out of scope for the MVP per `docs/standards/data-contracts.md`. Add them as `0003_*.sql` if/when needed.

## Adding a migration

1. Create `0003_<descriptive_name>.sql`.
2. If the schema change affects TypeScript types, update `src/db/d1/types.ts` and `src/types/contracts.ts` in the same PR.
3. If it affects the data contract, update `docs/standards/data-contracts.md`.
4. Apply locally and verify with `wrangler d1 execute goodbois --local --command="..."`.

The repo's CLAUDE.md flags schema drift between the refactor spec and code as the #1 source of integration breakage — keep contracts and SQL in sync.
