# Dev B — Concrete TODO

**Lane:** Receipt + Hazard tools, plus printer/email integration adapters.
**Subagent helper:** `.claude/agents/hazard-admin-agent.md`
**Canonical spec:** `docs/refactor/2026-05-09-llm-turn-decision.md` (read §3, §4, §7, §13).

This file lists what's left given the current state of the code (verified 2026-05-10). Tick items off as you land them.

---

## Current state

- Registry now allowlists `signpost`, `reportHazard`, `generateReceipt` (3 tools). Landed 2026-05-10.
- `workers/src/tools/reportHazard.ts` — **demo stub landed 2026-05-10.** Returns `{ referenceId, routedTo }` where `routedTo` is currently a category slug (`town-council`, `lta`, `hdb`, `mom`).
- `workers/src/tools/generateReceipt.ts` — **needs rewrite.** Currently takes `{ sessionId, caseId, language, workerUrl }` (old shape); spec wants `GenerateReceiptArgs` with `body`, `thingsToBring`, `caseSummary`, `signpostedAgencyKey`, `hazardReferenceId`, `language`.
- `workers/src/receipt/render.ts` — **needs rewrite.** Currently renders a `Case` block with `suggestedNextSteps`. Spec wants body + things-to-bring checklist + hydrated agency block + hazard reference.
- `Receipt` type in contracts has `pdfUrl` only — needs body/thingsToBring/etc.
- No printer adapter, no email adapter, no `HazardReport` type or D1 row.

---

## 1. Update `generateReceipt`

Depends on Dev A landing `GenerateReceiptArgs` in `workers/src/types/contracts.ts` (their TODO #1). Once that's there:

- [ ] Rewrite `workers/src/tools/generateReceipt.ts` to accept `GenerateReceiptArgs`.
- [ ] Persist a `Receipt` row containing `body`, `thingsToBring`, `caseSummary`, `signpostedAgencyKey`, `hazardReferenceId`, `language`.
- [ ] Return `{ receiptId, url: "/receipts/:id" }`.
- [ ] Update `workers/src/db/repos.ts` `receipts` repo if its create signature needs new fields.
- [ ] Update `workers/src/tools/generateReceipt.test.ts` to cover the new args.

## 2. Update `Receipt` schema

Coordinate with Dev A. Update `docs/standards/data-contracts.md` first.

- [ ] Add `body: string`, `thingsToBring?: string[]`, `caseSummary?: string`, `signpostedAgencyKey?: string`, `hazardReferenceId?: string` to the `Receipt` type.
- [ ] Decide whether `pdfUrl` stays (spec uses `url` returned by the tool, not stored on the row) or is replaced.

## 3. Rewrite the receipt render

- [ ] Rewrite `workers/src/receipt/render.ts`:
  - Bilingual HTML (English + `receipt.language`).
  - Render `body` as the main content.
  - Render `thingsToBring` as a bulleted checklist.
  - Render `caseSummary` block (the no-repeat-the-story payload — spec §8.3).
  - **Hydrated agency block:** read Dev C's directory by `signpostedAgencyKey` at render time. Show name, phone, address, opening hours, multilingual blurb in user's language.
  - Hazard reference if `hazardReferenceId` present.
  - Drop the existing `Case` block (suggestedNextSteps is gone with `escalateToMpRc`).
- [ ] Receipt id format stays `GBR-YYYYMMDD-NNN` (matches the regex in `workers/src/index.ts`).

## 4. Build the printer adapter

- [ ] New file `workers/src/integrations/printerAdapter.ts`:
  ```ts
  export type PrinterAdapter = {
    printReceipt(html: string, opts: { receiptId: string; language: string }): Promise<void>;
  };
  ```
- [ ] Demo stub: `console.log("[printer:stub] receiptId=...", html.length)`. Real impl swaps to thermal/POS via env flag.

## 5. Build the email adapter

- [ ] New file `workers/src/integrations/emailAdapter.ts`:
  ```ts
  export type EmailAdapter = {
    sendReceipt(args: { to: string; html: string; receiptId: string }): Promise<void>;
    sendHazardReport(args: { to: string; report: HazardReport }): Promise<void>;
  };
  ```
- [ ] Demo stub: console-log payload. Real impl: Cloudflare Email Routing or equivalent.

## 6. Promote `reportHazard` from stub (post-demo)

- [ ] Add `HazardReport` type to `workers/src/types/contracts.ts`: `{ id, category, location, description, srcLang, transcript, createdAt, status, routedTo }`.
- [ ] Add `hazards` repo to `workers/src/db/repos.ts` and the in-memory impl.
- [ ] Update `reportHazard.ts` to write a `HazardReport` row and call `emailAdapter.sendHazardReport(...)`.
- [ ] Replace category-slug `routedTo` with the `AgencyContact.key` (see Coordination below).

---

## Coordination

### Hazard routing — seam with Dev C

The current stub returns `routedTo` as a category slug (`town-council`, `lta`, `hdb`, `mom`). Spec §8.2 example uses a specific agency key (`town-council-east-coast`). Before promoting the stub:

- Decide with Dev C: is `routedTo` a category slug or an `AgencyContact.key`?
- The canonical convention (per spec §8.2 + Dev C's prompt) is the specific agency key.
- Ensure Dev C has seeded at least one agency entry per hazard category your map emits.

### Receipt hydration — seam with Dev C

The receipt block reads `AgencyContact` by `signpostedAgencyKey`. You consume Dev C's directory schema; if you need new fields on the agency record (e.g. wayfinding shown on the receipt), coordinate with Dev C and update `docs/standards/data-contracts.md` first.

### Receipt schema — seam with Dev A

Dev A drives `GenerateReceiptArgs` through to the orchestrator hydration. Don't ship the new generateReceipt impl until that contract is locked.
