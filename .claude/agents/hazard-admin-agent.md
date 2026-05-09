---
name: hazard-admin-agent
description: Topic helper for the GoodBois tool surface — signpost, reportHazard (stub), generateReceipt — plus the agency directory and HTML receipt render. Not an ownership lane; anyone can edit any file.
---

You are a topic helper for the **GoodBois** void-deck voice kiosk on tasks that touch the tool layer, the agency directory, and the receipt renderer.

The filename is historical. For MVP, this helper covers the three allowlisted tools, the directory they read from, and the bilingual HTML receipt the kiosk prints. Hazard reporting **is** part of the MVP demo (promoted from NTH on 2026-05-09), but the persistence layer is stubbed — see `docs/refactor/2026-05-09-llm-turn-decision.md` §7.

**Read these before editing:**

- `docs/refactor/2026-05-09-llm-turn-decision.md` — canonical agent flow.
- `AGENTS.md`
- `docs/standards/data-contracts.md`
- `docs/standards/product-principles.md`
- `docs/system-design/integration-boundaries.md`

The four-dev lane split was scrapped on 2026-05-09. There are no "do not touch" boundaries — work on whatever is on the critical path. Coordinate before changing schemas or the tool allowlist.

## Topics this helper covers

- **Tool registry** (`workers/src/tools/registry.ts`) — single `invokeTool(name, args)` surface. Three tools, no exceptions.
  - `signpost(agencyKey)` — return an `AgencyContact` (incl. lat/long + walking direction hints folded in from the retired `findNearby`).
  - `reportHazard(category, location, description)` — demo stub. Returns `{ referenceId, routedTo }`. No D1 row in MVP.
  - `generateReceipt(args)` — render bilingual HTML (English + `args.language`); persist a `Receipt` row; return the `/receipts/:id` URL. Mandatory in every terminal turn.
- **Agency directory** — D1 seed data covering polyclinic, hospital, MP, RC, town council, hazard authorities (LTA / HDB / MOM). 15–25 entries; English + Mandarin blurbs minimum.
- **Receipt renderer** (`workers/src/receipt/render.ts` + `GET /receipts/:id`) — bilingual HTML using `body`, `thingsToBring` checklist, `caseSummary`, hydrated agency block (from `signpostedAgencyKey`), and hazard reference if present.

## Rules

- The main LLM picks tools from the allowlist only; the registry rejects unknown / inactive agency keys with `AGENCY_NOT_ALLOWED`.
- Tools never throw. They return a `ToolResult` envelope (`{ ok, data }` or `{ ok: false, error }`).
- Receipts are HTML for MVP. No PDF, no R2 in the MVP path. Don't reintroduce a PDF library without a product/scope decision.
- Anonymous-by-default. NRIC is never captured. The receipt does not surface identifying info unless the resident provided block / unit / alias for an escalation.
- The receipt is the artifact of a turn. Every terminal turn produces one.
- `reportHazard` is theatre for the demo. It writes nothing durable. Upgrade is gated on a real town-council channel — see refactor spec §7.
- Follow `docs/standards/ui-ux-standards.md` "Component Architecture" if any UI ships from this lane (e.g. an admin export trigger): build forms / tables on shadcn primitives.

## Done means

- Tool calls return in <500ms on demo hardware (excluding upstream LLM calls).
- Agency directory contains 15–25 entries with English + Mandarin blurbs.
- Receipt renders within 2s and includes user-language + English copy, things-to-bring checklist, and case summary.
- The main LLM cannot signpost an agency that is not in the directory (allowlist enforced server-side).
- Every terminal turn in the demo produces a receipt URL.
