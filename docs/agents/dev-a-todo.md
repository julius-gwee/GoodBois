# Dev A — Concrete TODO

**Lane:** Orchestration & agent pipeline. Frontend kiosk UX.
**Subagent helper:** `.claude/agents/accessibility-voice-agent.md`
**Canonical spec:** `docs/refactor/2026-05-09-llm-turn-decision.md` (read §2, §3, §6, §10).

This file lists what's left given the current state of the code (verified 2026-05-10). Tick items off as you land them.

---

## Current state

The orchestrator at `workers/src/orchestrator/index.ts` still runs the **old 8-step flow** (STT → translate → inquiry → triage → processing → respond → translate → TTS). It imports `runInquiry`, `runTriage`, `runProcessing` and emits the old `TurnResponse` shape (`triage`, `case`, `agencyContact`, `nearbyResources`, `routeOptions` fields). The new classifier + main agents do not exist yet.

Tool registry is now correct (3 tools: `signpost`, `reportHazard`, `generateReceipt`) — landed 2026-05-10.

---

## 1. Land the canonical contracts

`workers/src/types/contracts.ts` is the bottleneck — every other lane depends on these. Coordinate the change with Dev B (Receipt shape) and Dev C (`AgencyContact`).

- [ ] Add `LLMTurnDecision`, `ClassifierDecision`, `STTResult`, `GenerateReceiptArgs` (spec §3).
- [ ] Rewrite `TurnRequest` to spec §3: `{ sessionId, audioBase64 }`. Drop `language`, `mode`, `text`, `scriptedStep`.
- [ ] Rewrite `TurnResponse` to spec §3: `{ sessionId, state, transcript: { english, srcLang }, kioskMessage, audioUrl?, receiptUrl?, error? }`. Drop `triage`, `agencyContact`, `case`, `receipt`, `nearbyResources`, `routeOptions`.
- [ ] Mark `TriageResult`, `BookingConfirmation`, `TriageOutcome` deprecated (or delete once no consumers).
- [ ] Mirror the new types in `src/types/goodbois.ts` (frontend twin).
- [ ] Update `docs/standards/data-contracts.md` first per the contract-change rule.

## 2. Build the new agents

- [ ] Create `workers/src/agents/classifier/index.ts` — LLM call #1, owns the followup loop, returns `ClassifierDecision`.
- [ ] Create `workers/src/agents/main/index.ts` — LLM call #2, returns `LLMTurnDecision`. Retry-on-missing-`generateReceipt` guard (spec §2 stage 3).
- [ ] Delete `workers/src/agents/{inquiry,triage,processing}/` and their tests.
- [ ] Once `processing/` is gone, delete `workers/src/tools/findNearby.ts` + `workers/src/tools/escalateToMpRc.ts` + their tests (currently orphaned from the registry but still imported by `processing/`).

## 3. Rewrite the orchestrator

- [ ] Replace `workers/src/orchestrator/index.ts` with the six-stage flow per spec §2.
- [ ] Loop A (classifier) lives inside the orchestrator until `requestType !== "ask_followup"`.
- [ ] Tool dispatch: walk `decision.toolCalls[]` in array order via `registry.invokeTool(...)`. No business logic here.
- [ ] KV reset on terminal turn (spec §2 stage 6).

## 4. Update the AI adapters

- [ ] `workers/src/ai/sttAdapter.ts` — return `{ transcript_en, srcLang }`. If the underlying model only transcribes, layer translate + detect inside the adapter.
- [ ] `workers/src/ai/llmAdapter.ts` — expose two entry points: `classify(transcript, history)` and `decide(requestType, transcript, history, retryHint?)`.
- [ ] `workers/src/ai/translateAdapter.ts`, `ttsAdapter.ts` — keep as-is (spec §10 "keep").

## 5. Update the route handler

- [ ] `workers/src/index.ts` `POST /turn` — validate the new `TurnRequest` shape; drop `language`/`mode`/`scriptedStep` checks.
- [ ] Drop the `/export/cases.csv` route and the `casesCsv.ts` import (out of scope per spec §10).
- [ ] Decide what to do with `/resources` and `/routes` (currently call `findMapResources` / `oneMapRouting`). If the kiosk no longer needs them, drop the routes and the two tool files.

## 6. Frontend cleanup

- [ ] `src/components/kiosk/ListeningState.tsx` — drop language-tile dependency.
- [ ] `src/app/page.tsx` — drop language-tile gating on mic open.
- [ ] `src/components/kiosk/ChatState.tsx` — surface the followup loop visually (state can re-enter listening).
- [ ] `src/components/kiosk/ReceiptState.tsx` — render the receipt iframe full-screen; no schema change.
- [ ] Frontend state machine: `idle → listening → followup → … → speaking → receipt → idle`.
- [ ] Update `src/lib/mock-turn-fixtures.ts` to mirror the new `TurnResponse` shape.

## 7. Fixtures

- [ ] Replace `workers/src/fixtures/golden-demo.ts` with the three scenarios from spec §8 (routing / hazard / MP escalation).

---

## Coordination

- **Dev B** depends on you to land `GenerateReceiptArgs` in contracts.ts and the new `Receipt` shape.
- **Dev C** owns `AgencyContact`. If you need to extend it (e.g. for receipt hydration), edit through them; update `docs/standards/data-contracts.md` first.
- The retry guard for missing `generateReceipt` (spec §2 stage 3) is your responsibility, not the registry's.
