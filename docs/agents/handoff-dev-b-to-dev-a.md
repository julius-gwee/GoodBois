# Handoff — Dev B (Tools & Cases) → Dev A (Voice + Orchestrator)

**Date:** 2026-05-09
**Branch in flight:** `jacksonB/tools-and-cases`
**Companion spec:** `docs/superpowers/specs/2026-05-09-dev-b-tools-cases-design.md`

This document is the contract between Dev B's branch and Dev A's orchestrator work. Read it before wiring `/turn` to anything Dev B owns. The goal is zero merge conflicts and zero "I assumed you'd do that" moments.

## TL;DR

- Dev B owns the **processing agent** (`runProcessing`), 4 allowlisted tools, the agency directory, the receipt HTML endpoint, and the CSV export endpoint.
- Dev A owns the **orchestrator**, STT/TTS/translation adapters, the inquiry agent, the triage agent, `POST /turn`, session/KV, and all kiosk frontend.
- Receipts in MVP are **HTML, not PDF.** R2 is not wired. `Receipt.pdfUrl` points to `${WORKER_URL}/receipts/${id}` — a regular HTTP route. Treat the field as opaque.
- `simulateBooking` is **dropped** for MVP. If triage selects it, expect `TOOL_NOT_ALLOWED`.
- The Worker is moving to **Hono**. Dev A's orchestrator should hang off the same Hono app, not a parallel `fetch()` handler.
- The two type files (`workers/src/types/contracts.ts` and `src/types/goodbois.ts`) duplicate each other. Until someone extracts a shared package, both must be edited together — Dev B will hold this line for the duration of this branch.

## File ownership boundary

Use this table when in doubt about who edits what.

| Path                                              | Owner | Notes                                          |
|---------------------------------------------------|-------|------------------------------------------------|
| `workers/src/index.ts`                            | shared | Dev B adds Hono routes; Dev A wires `/turn` body. Coordinate on the Hono app handle. |
| `workers/src/types/contracts.ts`                  | shared | Schema is locked by `docs/standards/data-contracts.md`. Either dev edits with PR coordination. |
| `workers/src/orchestrator/**`                     | Dev A | Dev B will not touch. |
| `workers/src/agents/inquiry/**`                   | Dev A | Dev B will not touch. |
| `workers/src/agents/triage/**`                    | Dev A | Dev B will not touch. |
| `workers/src/agents/processing/**`                | Dev B | Dev A imports from here, does not edit. |
| `workers/src/tools/**`                            | Dev B | Dev A does not call these directly — go through `runProcessing`. |
| `workers/src/db/**`                               | Dev B | Repos and seeds. |
| `workers/src/receipt/**`                          | Dev B |                                                |
| `workers/src/export/**`                           | Dev B |                                                |
| `workers/src/ai/**`                               | Dev A | STT / TTS / SEALion / triage LLM adapters.     |
| `workers/src/fixtures/golden-demo.ts`             | Dev D | Read-only for both Dev A and Dev B.            |
| `src/types/goodbois.ts`                           | shared | Frontend twin of `contracts.ts`. Stay in sync. |
| `src/components/**`, `src/app/**`                 | Dev A | Dev B does not touch.                          |

## How Dev A integrates with the processing agent

Dev A's orchestrator imports a single function from Dev B's lane:

```ts
import { runProcessing } from "../agents/processing";
import type { ProcessingInput, ProcessingOutput } from "../agents/processing";
```

### Input shape

```ts
type ProcessingInput = {
  sessionId: string;
  language: string;            // BCP-47 of the user-language conversation
  triage: TriageResult;        // already classified by Dev A's triage agent
  transcriptEnglish: string;   // for case summary if escalating
  resident?: { block?: string; unit?: string; alias?: string };
};
```

### Output shape

```ts
type ProcessingOutput = {
  toolName: string;
  agencyContact?: AgencyContact;
  agencyContacts?: AgencyContact[];   // findNearby returns up to 3
  case?: Case;
  receipt?: Receipt;
  toolInvocation: ToolInvocation;
  error?: { code: ProcessingErrorCode; message: string; fallbackAvailable: boolean };
};
```

### Dispatch the orchestrator can rely on

| `triage.outcome`   | What `runProcessing` does                                    | What you get back                |
|--------------------|--------------------------------------------------------------|----------------------------------|
| `signpost`         | Calls `signpost` tool with `triage.selectedAgencyKey`        | `agencyContact`                  |
| `find_nearby`      | Calls `findNearby` with the implied category                 | `agencyContacts` (up to 3)       |
| `escalate`         | Calls `escalateToMpRc` then `generateReceipt`                | `case`, `receipt`                |
| `out_of_scope`     | Calls `signpost` with a curated hotline (e.g. SCDF 995)      | `agencyContact`                  |
| `simulate_booking` | Returns `error.code = "TOOL_NOT_ALLOWED"`                   | error envelope                   |
| `ask_followup`     | **Not handled here.** Dev A's orchestrator owns the loop.   | n/a — don't call `runProcessing` |

### Contract guarantees

- `runProcessing` **never throws** to the caller. It always returns a `ProcessingOutput`. If something fails, `error` is populated and the other fields are absent.
- The function is fast: target < 500ms on demo hardware (no AI calls inside it).
- It writes a `ToolInvocation` row internally for audit. Dev A does not need to log tool calls again.
- It does **not** translate kiosk-language responses. Translation is Dev A's job — Dev B returns English-or-curated copy in `agencyContact.multilingualBlurb` and the receipt template.

## Error codes the orchestrator must handle

Map these into `TurnResponse.error` when present:

| Code                  | When                                                        | Suggested orchestrator behaviour            |
|-----------------------|-------------------------------------------------------------|---------------------------------------------|
| `AGENCY_NOT_ALLOWED`  | Triage picked an agency key not in the directory or inactive | Re-prompt triage with a hint, or fall back to `out_of_scope` curated hotline |
| `TOOL_NOT_ALLOWED`    | Triage picked a tool not in the allowlist (incl. `simulate_booking`) | Surface to user as "I can't do that yet" and offer escalation |
| `PROCESSING_FAILED`   | Unexpected internal error                                    | Hand off to scripted-fallback path (Dev D)  |

All three carry `fallbackAvailable: true`.

## Endpoints Dev B exposes

These are routed in the same Hono app Dev A will share. They run alongside `/turn`.

### `GET /receipts/:id`

- Returns bilingual HTML, full-screen friendly.
- `id` must match `^GBR-\d{8}-\d{3}$` or you get 400 `INVALID_ID`.
- The kiosk frontend opens this URL in an iframe or as a full-screen page when the orchestrator returns a `Receipt` in the turn response.
- Dev A does not call this from the orchestrator — the URL flows through `Receipt.pdfUrl` → `TurnResponse.receipt.pdfUrl` → frontend.

### `GET /export/cases.csv?token=...`

- Token is `env.EXPORT_TOKEN` (configured in `wrangler.toml`).
- Wrong/missing token → 401.
- Marks every returned case as `exported`. Idempotent.
- Dev A does not need to wire this in the kiosk flow. It is for MP/RC operators or admin tooling.

### `POST /admin/cases/:id/export`

- Optional, may collapse into the CSV path. If present, marks a single case `exported`.
- Token-gated, same `EXPORT_TOKEN`.

## Hono migration

The current `workers/src/index.ts` is a vanilla `fetch()` handler. Dev B's branch migrates it to Hono so route handlers stay clean as the surface grows.

**What this means for Dev A:**

- After the merge, `workers/src/index.ts` exports a Hono app. Dev A's `/turn` becomes `app.post('/turn', handler)`.
- Existing `/health` behaviour is preserved.
- Existing `/turn` 501 stub stays in place until Dev A wires the orchestrator. Dev B's branch does not touch the `/turn` body.
- Hono is added to `workers/package.json` as a dependency. No version pin negotiation needed.

If Dev A starts before this branch lands: write the orchestrator as a plain function and invoke it from whatever handler exists. Wiring it into Hono is a 5-line refactor.

## Type-file duplication

`workers/src/types/contracts.ts` and `src/types/goodbois.ts` currently hold **identical** schemas. Both are imported around the codebase and there is no shared package yet.

Rules for this hackathon window:

- If you add or change a field, update **both** files in the same commit.
- Do not change schemas without flagging in PR — they are the cross-lane contract.
- Extracting a shared package is a post-MVP refactor. Don't start it now.

## Things Dev A might worry about that are already handled

- **Allowlist enforcement on signpost:** the `signpost` tool itself rejects unknown or inactive agency keys. The orchestrator does not need to pre-check.
- **Suggested-next-steps validation:** `escalateToMpRc` scans for unknown phone numbers and flags them. The orchestrator does not need to validate.
- **Receipt id generation:** `generateReceipt` assigns the id, timestamp, and URL. The orchestrator passes in `caseId?`, `sessionId`, `language`.
- **Case id generation:** same — `escalateToMpRc` assigns `id`, `createdAt`, `status='queued'`.
- **Tool invocation audit log:** `runProcessing` writes the row. Don't re-log.

## Things Dev A still owns end-to-end

- STT, TTS, SEALion translation, triage LLM, inquiry agent, KV session state.
- Translating tool outputs (especially `agencyContact.multilingualBlurb` lookup) into the user-language `kioskMessage`.
- All `TurnResponse` assembly. Dev B returns building blocks; Dev A composes the final response.
- The bounded follow-up loop (≤3 follow-ups). `runProcessing` is not in this loop.
- All frontend kiosk UX — listening state, language picker, transcript, receipt full-screen render, idle reset.

## Open coordination points

If any of these change during implementation, Dev A and Dev B should sync:

1. Whether the receipt becomes a real PDF before the demo (would change `Receipt.pdfUrl` semantics — currently HTML).
2. Whether D1 lands before the demo (would change error surface — repos can fail with network errors).
3. Whether `simulateBooking` is reintroduced (would change the dispatch table).
4. Whether the type-duplication is consolidated into a shared package (would change import paths in both lanes).

Bring up any of these in chat; do not surprise the other lane in a PR.
