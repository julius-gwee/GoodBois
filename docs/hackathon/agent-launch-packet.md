# Agent Launch Packet

Use this packet before spinning up Codex or Claude agents. It keeps parallel work pointed at the same demo path and prevents agents from extending the old scaffold.

> **Canonical agent flow:** `docs/refactor/2026-05-09-llm-turn-decision.md`. Read it before this packet. The packet only adds rituals (mock-first, golden demo, fallback) on top of that spec.

## Build Rule

Do not start by wiring real AI or Cloudflare services. Build against a mock-first integration contract so the kiosk frontend, the orchestrator, the classifier and main LLM agents, the tool registry, and the receipt renderer can all move in parallel.

The app is done for the first integration checkpoint when:

1. Kiosk UI loads.
2. Mock `POST /turn` works.
3. STT mock returns `{ transcript_en, srcLang }`.
4. Classifier mock can either return a terminal `requestType` or a single `ask_followup`.
5. Main LLM mock returns a complete `LLMTurnDecision` including `generateReceipt`.
6. Tool registry has stubs for `signpost`, `reportHazard`, `generateReceipt`.
7. Receipt screen appears.
8. Demo script is rehearsable.

## Golden Demo Path

The demo carries three scenarios that together prove the triage thesis. Each runs through the same six-stage pipeline.

### Scenario 1 — Routing (signpost)

> Mandarin-speaking resident: "Where do I get my eye checked?"

- STT detects `zh-SG`.
- Classifier asks one bounded follow-up ("polyclinic or hospital?"); resident says polyclinic; classifier emits `requestType: "signpost"`.
- Main LLM emits a `kioskMessage` + `toolCalls = [signpost(polyclinic-bedok), generateReceipt(...)]`.
- Receipt prints with Bedok Polyclinic address + things to bring (NRIC, Medisave card, current glasses).

### Scenario 2 — Hazard report (reportHazard)

> English-speaking resident: "The void deck light is broken, someone will fall."

- STT detects `en-SG`.
- Classifier emits `requestType: "report_hazard"` with no follow-up.
- Main LLM emits `toolCalls = [reportHazard(...), signpost(town-council-east-coast), generateReceipt(...)]`.
- `reportHazard` returns a stub `referenceId` (no D1 write in the demo).
- Receipt prints with the reference ID + town council follow-up contact.

### Scenario 3 — MP escalation (signpost + receipt as handoff)

> Mandarin-speaking resident: "My wife and I keep fighting about the flat."

- Classifier asks 2–3 bounded follow-ups ("ownership or living arrangement?", "have you spoken to anyone — lawyer or HDB?").
- Classifier emits `requestType: "signpost"` once it has enough.
- Main LLM emits `toolCalls = [signpost(mp-bedok-east), generateReceipt(...)]` with a full `caseSummary` so the volunteer doesn't need the retell.
- Receipt prints with the MP's Meet-the-People session details + things to bring (marriage cert, HDB ownership docs, income statements).

The full JSON for each scenario lives in `docs/refactor/2026-05-09-llm-turn-decision.md` §8.

## Mock-First `POST /turn` Contract

The frontend and Worker share this shape immediately. The first implementation may return scripted fixtures; the real orchestrator must preserve the same response shape unless `docs/standards/data-contracts.md` is updated first.

### Request

```ts
type TurnRequest = {
  sessionId?: string;          // omit on first audio of a fresh session
  kioskId: string;
  audioBase64?: string;        // primary input
  text?: string;               // touch-fallback input
};
```

The frontend does **not** send a `language` field. STT detects the source language from the audio.

### Response

```ts
type TurnResponse = {
  sessionId: string;
  state: "listening" | "followup" | "done";
  transcript: { english: string; srcLang: string };
  kioskMessage: string;        // already translated into srcLang
  audioUrl?: string;           // signed URL for TTS audio
  receiptUrl?: string;         // present only when state === "done"
  error?: { code: string; message: string; fallbackAvailable: boolean };
};
```

`state` semantics:

- `listening` — initial mic open before any STT result.
- `followup` — classifier asked for clarification; mic re-opens.
- `done` — terminal turn; receipt rendered; session resets on next idle tick.

### What the LLMs emit (visible only inside the Worker)

The orchestrator consumes:

- `STTResult { transcript_en, srcLang }`
- `ClassifierDecision { requestType, followupPrompt? }`
- `LLMTurnDecision { requestType, kioskMessage, toolCalls[] }`

These are not part of the HTTP contract — they are the Worker-internal shapes. See `docs/standards/data-contracts.md` for full definitions.

## Runtime Agent Layout

```text
workers/src/orchestrator/        # six-stage turn handler
workers/src/agents/classifier/   # LLM call #1 — owns the followup loop
workers/src/agents/main/         # LLM call #2 — emits LLMTurnDecision
workers/src/tools/               # signpost · reportHazard · generateReceipt + registry
workers/src/ai/                  # STT (with lang detect), TTS, translate, llmAdapter
workers/src/receipt/             # HTML render
workers/src/db/                  # D1 access
```

The previous `inquiry/`, `triage/`, and `processing/` agent folders are deprecated. See `docs/refactor/2026-05-09-llm-turn-decision.md` §6 + §10.

Do not turn this into a passport / general-application kiosk for the hackathon MVP. Complex application processing is future scope.

## Stage Fallback Path

The scripted demo path uses the same UI states and response contract as the real path. It may bypass STT, SEALion, and live LLM calls, but it must still render:

- listening
- followup (when applicable)
- speaking
- receipt

Feature flag recommendation:

```env
NEXT_PUBLIC_SCRIPTED_DEMO=true
```

The flag should only choose the data source. It must not create a separate UI flow.

## Decommission Guardrail

The old starter code from the pre-pivot scaffold has been removed:

- `server/`
- `supabase/`
- `src/lib/supabase/*`
- `src/proxy.ts`
- magic-link auth route handlers
- login/dashboard routes
- Supabase dependencies and environment variables

Do not reintroduce these surfaces. GoodBois is anonymous by default, uses Cloudflare D1 as the only database, and runs backend work through `workers/`.

## Seed Data Ownership

Seed data is shared. Anyone can land it; coordinate before changing the agency directory schema.

Minimum demo seed data:

- 15–25 `AgencyContact` rows.
- Coverage for: polyclinic, hospital, MP, RC, town council, hazard authorities (LTA / HDB / MOM).
- English and Mandarin blurbs for every entry.
- Hokkien copy where SEALion's coverage allows.
- Three canned `LLMTurnDecision` fixtures, one per demo scenario above.
- Three canned receipt fixtures — one per scenario.

Seed data should be production-shaped even if values are demo-safe. Do not invent real hotlines unless verified and sourced.

## Cut Rules

If time is tight, keep:

- STT with language detection (or a mock that returns srcLang).
- Classifier loop with at least one ask_followup branch.
- Main LLM emitting all three tool calls.
- Receipt screen.
- Scripted fallback.

Cut:

- Real map render (NTH).
- Real hazard filing (stub stays).
- Webhook / email export channels.
- Grab handoff.
- Route safety.
- Languages beyond English + Mandarin.

## Tech Stack Reminder

- Frontend: Next.js 16, React 19, TypeScript, Tailwind v4, shadcn/ui, lucide-react.
- Hosting: Cloudflare Pages.
- Backend: Cloudflare Workers in TypeScript.
- Worker framework: Hono by default.
- AI: Workers AI for STT (with language detection), TTS, classifier LLM, main LLM.
- Translation: SEALion.
- Database: Cloudflare D1 only.
- Session: Cloudflare KV (single-shot per turn).
- Receipt: HTML, served by the Worker. R2 not used in MVP path.
- NTH map: `react-leaflet` and OneMap behind `mapAdapter`.

Supabase, FastAPI, magic-link auth, and the dashboard are removed legacy scaffold surfaces. Do not build new product work on them or re-add them.
