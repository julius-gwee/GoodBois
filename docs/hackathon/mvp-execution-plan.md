# Hackathon MVP Execution Plan

> Canonical agent flow lives in `docs/refactor/2026-05-09-llm-turn-decision.md`. This file is the build / demo / cut-rules wrapper around it.

## Target Demo

The demo carries three scenarios that together prove the triage thesis: an elderly resident arrives with a colloquially worded request and walks away with a structured handoff (printed receipt) so they don't have to retell the story to anyone.

### Scenario 1 — Routing

> Mandarin-speaking resident: *"Where do I get my eye checked?"*

- STT detects `zh-SG`.
- Classifier asks one bounded follow-up ("polyclinic or hospital eye clinic?"); resident says polyclinic.
- Main LLM emits `signpost(polyclinic-bedok)` + `generateReceipt(...)`.
- Receipt prints with address, opening hours, and things to bring (NRIC, Medisave card, current glasses).

### Scenario 2 — Hazard reporting

> English-speaking resident: *"The void deck light is broken, someone will fall."*

- STT detects `en-SG`.
- Classifier emits `report_hazard` with no follow-up.
- Main LLM emits `reportHazard(...)` + `signpost(town-council-east-coast)` + `generateReceipt(...)`.
- `reportHazard` returns a stub reference ID (no D1 write in the demo).
- Receipt prints with reference ID + town council contact.

### Scenario 3 — MP escalation (the no-retell handoff)

> Mandarin-speaking resident: *"My wife and I keep fighting about the flat."*

- Classifier asks 2–3 bounded follow-ups to gather ownership / living-arrangement / prior-action context.
- Main LLM emits `signpost(mp-bedok-east)` + `generateReceipt(...)` with a full `caseSummary`.
- Receipt prints with the MP's Meet-the-People session details, things to bring (marriage cert, HDB ownership docs, income statements), and the case summary so the volunteer can skip the retell.

A scripted demo path is rehearsed and bookmarked as a fallback if dialect STT misfires.

Full JSON for each scenario lives in `docs/refactor/2026-05-09-llm-turn-decision.md` §8.

## First Integration Checkpoint

Before chasing real AI quality, get the smallest end-to-end skeleton working against the mock-first contract in `docs/hackathon/agent-launch-packet.md`:

1. Kiosk UI loads.
2. Mock `POST /turn` works.
3. Mock STT returns `{ transcript_en, srcLang }`.
4. Mock classifier returns either a terminal `requestType` or one `ask_followup`.
5. Mock main LLM returns a complete `LLMTurnDecision` (with `generateReceipt`).
6. Tool registry stubs respond for `signpost`, `reportHazard`, `generateReceipt`.
7. Receipt screen appears.
8. Demo script is rehearsable.

This checkpoint is intentionally smaller than the full PRD. It lets the team build against the same shape while Cloudflare, SEALion, D1, and KV are still being wired.

## Build Order

### Phase 1: Shared Foundation

- Stand up Cloudflare account, Wrangler auth, free-tier verification.
- Create D1 database; ship the schema migrations driven from `data-contracts.md` (focus: `AgencyContact`, `Receipt`, optional `ToolInvocation`).
- Seed `AgencyContact` directory: 15–25 entries covering polyclinic, hospital, MP, RC, town council, hazard authorities (LTA / HDB / MOM). English + Mandarin blurbs minimum.
- Land mock `POST /turn` fixtures and one canned `LLMTurnDecision` per demo scenario.
- Frontend scaffold: kiosk shell route + listening + followup + speaking + receipt states. No language picker.
- Worker scaffold: orchestrator skeleton + classifier agent + main LLM agent + tool registry + D1 client.

### Phase 2: Parallel Build

The lane split is gone. Pick whichever component is on the critical path. Independent surfaces:

- **STT adapter** returning `{ transcript_en, srcLang }`. Stub first.
- **Classifier agent** + followup loop in the orchestrator.
- **Main LLM agent** with `generateReceipt` retry guard.
- **Tool registry** with three real tools; `reportHazard` stays stubbed.
- **Receipt HTML render** with bilingual copy + things-to-bring checklist + case summary block.
- **Translate + TTS** path on `kioskMessage`.
- **Frontend states** (listening / followup / speaking / receipt) without language tile gating.

### Phase 3: Integration

- Wire frontend → Worker (`POST /turn` + `GET /receipts/:id`).
- KV-backed single-shot session that wipes on every terminal turn.
- Run all three demo scenarios end-to-end on the demo laptop.

### Phase 4: Demo Hardening

- Seed at least one canned conversation for each of the three scenarios.
- Pre-warm AI weights; verify P50 latency on demo network.
- Polish kiosk visuals (font sizes, animation, consent banner copy).
- Rehearse scripted fallback path.
- Freeze scope.

### Phase 5 (only if MVP is solid): NTH Map Lane

- Layer a map render on top of the `signpost` result for routing scenarios — reuse the agency record's lat/long fields.
- Wire OneMap tiles + Barrier-Free routing behind `mapAdapter`.
- One demo route ("nearest exercise corner") rendered with a walking polyline.

## Minimum Seed Data

- **`AgencyContact`:** 15–25 entries across categories (housing, healthcare, social services, legal, financial assistance, elderly activity, digital help, MP, RC, town council, hazard authority).
- **Multilingual blurbs:** at minimum English + Mandarin for every agency; Hokkien when SEALion's coverage allows.
- **Receipt fixtures:** one bilingual receipt per demo scenario.
- **Mock `LLMTurnDecision`:** one per scenario, each with `generateReceipt` populated.

## Demo Cut Rules

If time is tight, keep:

- STT with language detection (or a mock that returns srcLang).
- Classifier loop with one ask_followup branch.
- Main LLM emitting all required tool calls including `generateReceipt`.
- Three tools: `signpost`, `reportHazard` (stub), `generateReceipt`.
- Kiosk shell + listening / followup / speaking / receipt states.
- Multilingual: English + Mandarin (Hokkien can drop to Phase 5).

Cut or simplify:

- Real map render (NTH).
- Real hazard filing (stay with the stub).
- Webhook / email export channels (nothing exports in MVP — the receipt is the artifact).
- Grab handoff, route safety, mode switch.

## End-of-Day Checklist

- All three scenarios run on the demo laptop.
- Worker is deployed; AI weights are pre-warmed.
- KV session cleanup verified (no PII bleeds across sessions).
- D1 has demo seed data.
- No obvious console errors.
- Demo script and scripted fallback both rehearsed.
