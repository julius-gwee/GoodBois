# Dev B — Tools & Cases — Design Spec  *(SUPERSEDED 2026-05-09)*

> **This spec is superseded by `docs/refactor/2026-05-09-llm-turn-decision.md`** (landed the same day as a follow-up refactor).
>
> Headline differences:
> - The four-dev lane split (Dev A / Dev B / etc.) was scrapped. Anyone can edit any file; there is no Dev B branch ownership.
> - The tool allowlist is **three** tools, not four: `signpost`, `reportHazard` (new, demo stub), `generateReceipt`. `findNearby` and `escalateToMpRc` are removed (folded into `signpost` + receipt).
> - The processing agent that this spec describes is **deprecated**. Tool dispatch lives in the orchestrator, walking `LLMTurnDecision.toolCalls[]` directly through the registry.
> - The `Case` entity and CSV export route are out of scope for the MVP demo. The receipt is the handoff artifact; no separate export channel.
> - Hazard reporting is promoted from NTH to a real `requestType` with a stubbed tool implementation.
>
> Read the refactor spec instead. The historical content below is preserved as context only.

---

**Branch:** `jacksonB/tools-and-cases`
**Owner:** Dev B (`hazard-admin-agent` lane)
**Date:** 2026-05-09
**Status:** SUPERSEDED — see notice above.

This document was the agreed scope, architecture, and verification plan for the Dev B branch. It is no longer authoritative; see the superseding refactor spec above.

## 1. Scope

### In scope

- Four allowlisted Worker tools: `signpost`, `findNearby` (text-first stub), `generateReceipt`, `escalateToMpRc`.
- Processing agent that dispatches the right tool based on a triage outcome.
- Repository interfaces (`AgencyRepo`, `CaseRepo`, `ReceiptRepo`, `ToolInvocationRepo`) with in-memory mock implementations, designed so a real Cloudflare D1 implementation can drop in behind the same interface.
- Agency directory seed data: 15–25 `AgencyContact` rows, every category covered, English + `zh-Hans` (Mandarin) blurbs minimum.
- Bilingual HTML receipt rendered server-side at `GET /receipts/:id`.
- MP/RC case export as CSV at `GET /export/cases.csv`, gated by an env-configured token.
- Hono router around the existing Worker.
- Vitest unit tests for the pure-logic surfaces (registry, allowlist, CSV, repos, processing dispatch).

### Out of scope, deferred

- `simulateBooking` tool — dropped entirely from this branch. The registry rejects it.
- Real Cloudflare D1 wiring — interfaces only. D1 migrations are a follow-up branch.
- Cloudflare R2 storage and signed URLs.
- Receipt PDF rendering via `pdf-lib` — replaced with HTML for MVP. **This deviates from the "Done means" criteria in `.claude/agents/hazard-admin-agent.md` (which requires PDF + R2). The team has accepted HTML-for-MVP, with PDF as a fast-follow.**
- Webhook and email export channels.
- Hazard reporting (NTH, low priority).
- `POST /turn` orchestration — Dev A's territory. This branch only exposes the processing-agent contract.

## 2. Architecture

### File layout

```
workers/src/
├── index.ts                 # Hono app, route registration
├── types/
│   └── contracts.ts         # already exists, do not modify schemas
├── db/
│   ├── repos.ts             # interfaces: AgencyRepo, CaseRepo, ReceiptRepo, ToolInvocationRepo
│   ├── memory.ts            # in-memory implementations
│   ├── ids.ts               # GBC-/GBR- id generation with daily counter
│   └── seeds/
│       └── agencies.ts      # 15-25 AgencyContact rows
├── tools/
│   ├── registry.ts          # allowlist + dispatcher
│   ├── signpost.ts
│   ├── findNearby.ts        # text-first stub: top-3 by category
│   ├── generateReceipt.ts
│   └── escalateToMpRc.ts
├── agents/processing/
│   └── index.ts             # runProcessing(input, deps): ProcessingOutput
├── receipt/
│   └── render.ts            # bilingual HTML receipt template
├── export/
│   └── casesCsv.ts          # cases -> RFC 4180 CSV
└── fixtures/golden-demo.ts  # already exists, do not modify
```

### Routes (Hono)

- `GET /health` — keep existing behaviour.
- `POST /turn` — leave existing 501 stub. Dev A wires the orchestrator.
- `GET /receipts/:id` — bilingual HTML receipt. `Receipt.pdfUrl` field is reused, populated with this URL.
- `GET /export/cases.csv?token=...` — gated CSV download. Token is `env.EXPORT_TOKEN`. After successful response, marks every returned case as `exported`.
- `POST /admin/cases/:id/export` — optional. Marks a single case as exported. Folded into CSV path if simpler.

### Boundaries

This branch must not edit:

- `src/components/**`, `src/app/**` — Dev A.
- `src/lib/mapAdapter/**` — Dev C.
- `docs/hackathon/**` — Dev D.
- `workers/src/index.ts` `/turn` body or `workers/src/orchestrator/**` — Dev A.
- Schema definitions in `workers/src/types/contracts.ts` or `src/types/goodbois.ts` — flag in PR if a change is needed.

The two type files duplicate each other (frontend + worker copy). Keeping them in sync is Dev B's responsibility for the duration of this branch; extracting a shared package is out of scope.

## 3. Components and data flow

### Repository interfaces

```ts
interface AgencyRepo {
  list(filter?: { category?: AgencyCategory; activeOnly?: boolean }): Promise<AgencyContact[]>;
  getByKey(key: string): Promise<AgencyContact | null>;
  exists(key: string): Promise<boolean>;
}

interface CaseRepo {
  create(input: NewCaseInput): Promise<Case>;
  getById(id: string): Promise<Case | null>;
  listForExport(): Promise<Case[]>;
  markExported(id: string, at: string): Promise<void>;
}

interface ReceiptRepo {
  create(input: NewReceiptInput): Promise<Receipt>;
  getById(id: string): Promise<Receipt | null>;
}

interface ToolInvocationRepo {
  record(invocation: ToolInvocation): Promise<void>;
}
```

`memory.ts` backs each interface with `Map<string, T>`. Agencies are seeded at construction time. Cases and receipts start empty.

Ids:

- Cases: `GBC-YYYYMMDD-NNN`, counter resets per Singapore-day (UTC+8).
- Receipts: `GBR-YYYYMMDD-NNN`, same rule.

### Processing agent contract

```ts
type ProcessingInput = {
  sessionId: string;
  language: string;
  triage: TriageResult;
  transcriptEnglish: string;
  resident?: { block?: string; unit?: string; alias?: string };
};

type ProcessingOutput = {
  toolName: string;
  agencyContact?: AgencyContact;
  agencyContacts?: AgencyContact[]; // findNearby returns up to 3
  case?: Case;
  receipt?: Receipt;
  toolInvocation: ToolInvocation;
  error?: { code: ProcessingErrorCode; message: string; fallbackAvailable: boolean };
};

async function runProcessing(input: ProcessingInput, deps: Deps): Promise<ProcessingOutput>;
```

### Dispatch table

| `triage.outcome`   | Tool called                              | Returns                                 |
|--------------------|------------------------------------------|-----------------------------------------|
| `signpost`         | `signpost`                               | `agencyContact`                         |
| `find_nearby`      | `findNearby`                             | `agencyContacts` (up to 3)              |
| `escalate`         | `escalateToMpRc` then `generateReceipt`  | `case`, `receipt`                       |
| `out_of_scope`     | `signpost` (curated hotline e.g. 995)    | `agencyContact`                         |
| `simulate_booking` | rejected — out of scope this branch      | `error.code = TOOL_NOT_ALLOWED`         |
| `ask_followup`     | not handled here — orchestrator's loop   | n/a                                     |

### `generateReceipt` flow

1. Receives `{ caseId?, sessionId, language }`.
2. Builds the receipt row, persists via `ReceiptRepo.create()`.
3. Sets `pdfUrl` to `${WORKER_URL}/receipts/${id}` (HTML endpoint).
4. Actual HTML render happens at request time in `GET /receipts/:id`.

This keeps storage cheap and lets us swap to PDF later by changing one route handler — the data contract does not move.

### Receipt HTML template

- Bilingual: user-language summary on top, English mirror below.
- Includes: case ID (if linked), session ID, generated-at timestamp, agency contact, suggested next steps, disclaimer "This is not an official agency dispatch."
- Print-friendly CSS via `@media print`. Large font, high contrast, kiosk-friendly defaults.
- No external CSS or JS — single inline `<style>`.

### CSV export

- Header per `docs/standards/data-contracts.md`:
  `id,createdAt,language,summaryEnglish,transcript,suggestedNextSteps,residentBlock,residentUnit,residentNameAlias,kioskId,status,sessionId`
- `suggestedNextSteps` joined with `;`.
- All fields RFC 4180-quoted; embedded quotes doubled; newlines preserved inside quotes.
- After successful response, calls `caseRepo.markExported(id, now)` for every row. Idempotent.

## 4. Error handling and validation

### Error codes (surfaced through `TurnResponse.error` by the orchestrator)

| Code                  | Trigger                                                                 | `fallbackAvailable` |
|-----------------------|-------------------------------------------------------------------------|---------------------|
| `AGENCY_NOT_ALLOWED`  | `signpost`/`escalate` references unknown or `active=false` agency       | `true`              |
| `TOOL_NOT_ALLOWED`    | Triage selects a tool not in the registry (incl. `simulateBooking`)     | `true`              |
| `PROCESSING_FAILED`   | Repo throw, JSON serialization, anything unexpected                     | `true`              |

The processing agent never throws to the orchestrator. Every code path returns a `ProcessingOutput` (with or without `error`).

### Allowlist enforcement (`tools/registry.ts`)

```ts
const ALLOWLIST = ['signpost', 'findNearby', 'generateReceipt', 'escalateToMpRc'] as const;
type ToolName = typeof ALLOWLIST[number];

export function isAllowedTool(name: string): name is ToolName;
export async function callTool(name: string, args: unknown, deps: Deps): Promise<unknown>;
```

Anything outside the allowlist (including `simulateBooking`) returns `TOOL_NOT_ALLOWED` before per-tool code runs. This is the server-side enforcement called for in `.claude/agents/hazard-admin-agent.md`.

### Suggested-next-steps validation

In `escalateToMpRc`, before persisting the `Case`:

- Scan `suggestedNextSteps[]` with regex `/\b\d{4}-?\d{4}\b/` and `/\b1800-?\d{3}-?\d{4}\b/`.
- If a step contains a phone number that does not appear in any `AgencyContact.hotline` — flag it. v1 logs and keeps the step; v2 (post-MVP) strips.
- Natural-language steps without numbers pass through unchanged.

### Input validation

- All endpoints accept JSON only — reject other content types with 415.
- All path params validated against `^GB[CR]-\d{8}-\d{3}$`; mismatch → 400 `INVALID_ID`.
- CSV `token` query: constant-time compare against `env.EXPORT_TOKEN`; mismatch → 401.
- No CORS on `/admin/*`. Permissive CORS on `/receipts/:id` (kiosk full-screen render).

### Logging

Every tool call writes a `ToolInvocation` row via `ToolInvocationRepo`. The data is kept even though no UI displays it. The orchestrator reads it for audit when needed.

## 5. Testing and verification

Vitest is added as a dev dependency for `workers/`. Tests live next to source.

### Test surface

| File                            | Asserts                                                                |
|---------------------------------|------------------------------------------------------------------------|
| `db/memory.test.ts`             | repo CRUD round-trips; id format; per-day counter resets               |
| `db/seeds/agencies.test.ts`     | every category covered; every row has `en` + `zh-Hans` blurb; 15-25 rows |
| `tools/registry.test.ts`        | allowlist accepts 4, rejects `simulateBooking`, rejects unknown        |
| `tools/signpost.test.ts`        | unknown key → AGENCY_NOT_ALLOWED; inactive agency → AGENCY_NOT_ALLOWED |
| `agents/processing.test.ts`     | each triage outcome → expected tool + output shape                     |
| `export/casesCsv.test.ts`       | header order matches contract; quote-escape; `;`-join steps            |

### Manual verification checklist (PR)

1. `npm run lint` clean.
2. `cd workers && npx wrangler dev` starts, `/health` returns 200.
3. `POST /turn` still returns the existing 501 stub — Dev A's surface unbroken.
4. `GET /receipts/GBR-20260509-001` renders the bilingual fixture receipt.
5. `GET /export/cases.csv?token=$EXPORT_TOKEN` returns valid CSV with the seeded golden-demo case.
6. Wrong token → 401; missing token → 401; wrong path id → 400.
7. Direct `runProcessing()` call with a `signpost` triage returns expected `agencyContact`.
8. Direct `runProcessing()` call with an `escalate` triage returns both `case` and `receipt`; receipt URL renders.

### Explicitly NOT verified by this branch

- Real D1 reads.
- STT, TTS, SEALion translation.
- End-to-end voice flow.

## 6. Deviations the team should know about

| Deviation                       | From                                                  | Reason                                          | Plan                                                       |
|---------------------------------|-------------------------------------------------------|-------------------------------------------------|------------------------------------------------------------|
| HTML receipt instead of PDF + R2 | `.claude/agents/hazard-admin-agent.md` "Done means" + `docs/system-design/integration-boundaries.md` "Receipt PDF — MVP" | Cuts pdf-lib + CJK font + R2 wiring out of MVP scope | PDF + R2 lands in a follow-up branch once MVP is stable    |
| `simulateBooking` dropped       | `AGENTS.md` Dev B lane lists it                       | Cut Rules in launch packet allow dropping it    | Tool stays in the registry as `TOOL_NOT_ALLOWED` until reintroduced |
| In-memory repos instead of D1   | `docs/system-design/tech-stack.md`                    | Mock-first per `agent-launch-packet.md` build rule | D1 implementation is a follow-up branch; interface seam preserved |
| Static `EXPORT_TOKEN` instead of signed URL | `docs/standards/data-contracts.md` "signed URL" | Signing infrastructure not worth MVP cost      | Real signing lands when D1 + R2 do                          |

These are the only deviations. Everything else conforms to `AGENTS.md`, `data-contracts.md`, and `integration-boundaries.md`.
