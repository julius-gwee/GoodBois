# Refactor — LLM Turn Decision Pipeline

**Date:** 2026-05-09 (flow); dev breakdown added 2026-05-10
**Status:** SSOT for the post-pivot agent flow. All other docs in this repo defer to this one.
**Scope:** Backend orchestrator + tool surface + receipt + agent prompts. Frontend changes are limited to dropping the language tile and aligning the kiosk states to the new pipeline.

This document supersedes the prior triage→processing dispatch model and the previous four-lane (A/B/C/D) plan. The current dev breakdown is **three lanes** (see §13). Existing markdown referencing the old four-lane structure is obsolete on contact and should be brought into line with this doc.

---

## 1. Why the rebuild

The original flow split cognition across three runtime agents (`inquiry` → `triage` → `processing`) and an implicit dispatch table inside the orchestrator (e.g. *"if outcome == escalate, call escalateToMpRc + generateReceipt"*). That hid behaviour in code that should be expressed by the LLM.

The new flow makes everything the LLM decides explicit, and makes the orchestrator a dumb dispatcher.

The pitch is the same: **a triaging platform for elderly residents to arrive with a colloquially worded problem and walk away with a full who/what/when/where/why/how solution on paper.** The kiosk is the visible front; the receipt is the artifact that minimises trips and lets MP/RC volunteers skip the retell.

---

## 2. The new flow

```
┌─ FRONTEND ──────────────────────────────────────────────────────────┐
│  user approaches kiosk → mic opens → captures audio                │
│  POST /turn { sessionId, audioBase64 }            ──────────────────┼─┐
└─────────────────────────────────────────────────────────────────────┘ │
                                                                        ▼
┌─ WORKER /turn (orchestrator) ─────────────────────────────────────────┐
│                                                                       │
│ STAGE 1 — STT (with language detection)                               │
│   { transcript_en, srcLang } = sttAdapter(audio)                      │
│      └─ STT detects source language AND returns English transcript    │
│                                                                       │
│ STAGE 2 — Classifier loop  (LLM call #1, cheap/fast)                  │
│   loop:                                                               │
│     classification = classifierLLM(transcript_en, history)            │
│     if classification.requestType == "ask_followup":                  │
│        speak(classification.followupPrompt) via TTS in srcLang        │
│        history.append({ user: transcript_en, kiosk: followupPrompt }) │
│        wait for next audio → STT → loop                               │
│     else:                                                             │
│        requestType = classification.requestType                       │
│        break                                                          │
│                                                                       │
│ STAGE 3 — Main LLM  (LLM call #2, full reasoning, retry guard)        │
│   decision = mainLLM(requestType, transcript_en, history)             │
│   while "generateReceipt" not in [tc.name for tc in decision.toolCalls]│
│      decision = mainLLM(retry=True, ...)                              │
│   ──→ decision = LLMTurnDecision {                                    │
│         requestType,                                                  │
│         kioskMessage:    <EN, conversational>,                        │
│         toolCalls: [                                                  │
│            { name: "signpost",        args: {...} },     // optional  │
│            { name: "reportHazard",    args: {...} },     // optional  │
│            { name: "generateReceipt", args: {...} }      // REQUIRED  │
│         ]                                                             │
│       }                                                               │
│                                                                       │
│ STAGE 4 — Tool dispatch                                               │
│   toolResults = {}                                                    │
│   for tc of decision.toolCalls:                                       │
│      toolResults[tc.name] = await registry.invoke(tc.name, tc.args)   │
│                                                                       │
│ STAGE 5 — Translate + speak                                           │
│   kioskMessage_user = translateAdapter(decision.kioskMessage,         │
│                                         "en" → srcLang)                │
│   audioUrl = ttsAdapter(kioskMessage_user, srcLang)                   │
│                                                                       │
│ STAGE 6 — Respond + reset                                             │
│   return TurnResponse {                                                │
│     transcript: transcript_en,                                        │
│     srcLang,                                                          │
│     kioskMessage: kioskMessage_user,                                  │
│     audioUrl,                                                         │
│     receiptUrl: toolResults.generateReceipt.url,                      │
│     state: "done"                                                     │
│   }                                                                   │
│   KV.delete(sessionId)              // hard reset for next user       │
└───────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─ FRONTEND ────────────────────────────────────────────────────────────┐
│  play audioUrl                                                        │
│  render <ReceiptIframe src={receiptUrl} /> full-screen                │
│  hold for ~30s → return to idle                                       │
└───────────────────────────────────────────────────────────────────────┘
```

### Stages in plain English

1. **STT does two jobs:** transcribe the audio AND detect the source language. No language tile is required on the frontend — the kiosk speaks back in whatever language the user spoke in.
2. **Classifier loop** owns the followup loop. If the resident's request is underspecified, the classifier returns `requestType: "ask_followup"` with a `followupPrompt`. The kiosk speaks the prompt, listens again, re-classifies. Loop continues until the classifier returns a terminal `requestType`.
3. **Main LLM** is called exactly once per conversation (with a retry guard). It receives the full conversation history plus the classifier's terminal `requestType`, and emits the `LLMTurnDecision` JSON described below.
4. **Tool dispatch** is a dumb loop. The orchestrator walks `toolCalls[]` in array order and invokes each via the tool registry. No business logic lives here.
5. **Translate + TTS** turn the English `kioskMessage` into spoken audio in the user's language.
6. **Respond + reset.** The session is single-shot. KV state is wiped after one terminal turn so the next person starts fresh.

---

## 3. Schemas

### `LLMTurnDecision` (output of the main LLM)

```ts
type LLMTurnDecision = {
  requestType: "signpost" | "report_hazard" | "out_of_scope";
  // ask_followup is handled by the classifier loop in Stage 2; the main LLM
  // never sees it.

  kioskMessage: string;
  // English, short, conversational. This is the chat-bubble text and the
  // source string for TTS. NOT the receipt body. The orchestrator translates
  // it from English into srcLang before TTS.

  toolCalls: Array<
    | { name: "signpost";        args: { agencyKey: string } }
    | { name: "reportHazard";    args: { category: string; location: string; description: string } }
    | { name: "generateReceipt"; args: GenerateReceiptArgs }
  >;
  // Order matters: tools execute in array order. The LLM is responsible for
  // ordering — e.g. reportHazard before generateReceipt so the reference id
  // can be hydrated into the receipt.
  // generateReceipt MUST be present. The orchestrator re-prompts the LLM if
  // it isn't.
};
```

### `ClassifierDecision` (output of the classifier)

```ts
type ClassifierDecision = {
  requestType: "signpost" | "report_hazard" | "out_of_scope" | "ask_followup";
  followupPrompt?: string;   // English; only when requestType === "ask_followup"
};
```

### `GenerateReceiptArgs`

```ts
type GenerateReceiptArgs = {
  body: string;                      // English; the printed content
  thingsToBring?: string[];          // structured checklist; rendered as bullets
  caseSummary?: string;              // who/what/when/where/why/how, English
  signpostedAgencyKey?: string;      // hydrated from the directory at render time
  hazardReferenceId?: string;        // hydrated from a prior reportHazard result
  language: string;                  // BCP-47; orchestrator passes srcLang
};
```

### `STTResult`

```ts
type STTResult = {
  transcript_en: string;   // English transcript (translated if necessary)
  srcLang: string;         // BCP-47 detected source language
};
```

The STT adapter is responsible for both steps. If the underlying model only does transcription, the adapter layers detection + translation internally. Callers see a single returned object.

### `TurnResponse` (Worker → frontend)

```ts
type TurnResponse = {
  sessionId: string;
  state: "listening" | "followup" | "done";
  transcript: { english: string; srcLang: string };
  kioskMessage: string;    // already translated into srcLang
  audioUrl?: string;       // signed URL for TTS audio
  receiptUrl?: string;     // present only on the terminal turn
  error?: { code: string; message: string; fallbackAvailable: boolean };
};
```

`state` semantics:
- `listening` — initial mic open before any STT result.
- `followup` — classifier asked for clarification; mic re-opens.
- `done` — terminal turn; receipt rendered; session reset on the next idle tick.

---

## 4. Tool allowlist

Three tools, no exceptions for MVP.

### `signpost`

```ts
args:    { agencyKey: string }
returns: { agency: AgencyContact }
```

Validates `agencyKey` against the agency directory; rejects unknown / inactive entries with `AGENCY_NOT_ALLOWED`. The directory is the canonical source of agency name, phone, address, opening hours, multilingual blurbs, and location/wayfinding fields. Wayfinding (formerly `findNearby`) is now folded into the agency record.

### `reportHazard`

```ts
args:    { category: string; location: string; description: string }
returns: { referenceId: string; routedTo: string }
```

For the demo, this is a **stub** — generates a reference ID like `HZ-20260509-012` and logs to console. No D1 row, no export. See §7 for why and when to upgrade.

### `generateReceipt`

```ts
args:    GenerateReceiptArgs   (see §3)
returns: { receiptId: string; url: string }   // url = /receipts/:id (HTML)
```

Renders bilingual HTML (English + `language` arg) with the receipt body, the things-to-bring checklist, the case summary, and an agency contact block hydrated from the directory using `signpostedAgencyKey`. Hazard reference ID rendered if `hazardReferenceId` is supplied. **Mandatory in every terminal turn's `toolCalls`.**

### Removed from MVP

- `findNearby` — folded into `signpost`. Wayfinding lives on the agency record.
- `escalateToMpRc` — folded into `signpost` + `generateReceipt`. The receipt **is** the escalation; the signpost points the resident at the MP / Community Club; the receipt's case summary lets them skip the retell.
- `simulateBooking` — out of scope.

---

## 5. Tool registry contract

```ts
// workers/src/tools/registry.ts (target shape — code rebuild pending)
type ToolName = "signpost" | "reportHazard" | "generateReceipt";

invokeTool(name: ToolName, args: object): Promise<ToolResult>;
```

`invokeTool` is the single surface between the orchestrator and the tool layer. The orchestrator never imports a specific tool file. Errors are returned in a `ToolResult.error` envelope; tools never throw.

Inter-tool data flow (e.g. `generateReceipt` needs the hazard reference ID from a prior `reportHazard`) happens through **orchestrator hydration** — the LLM emits keys (`signpostedAgencyKey`, `hazardReferenceId`), and the registry / receipt template hydrates the structured values from prior `toolResults` and the agency directory at render time.

---

## 6. Agent runtime model (replaces the inquiry/triage/processing split)

| Agent | Lives in | Role |
|---|---|---|
| `classifier` | `workers/src/agents/classifier/` *(new)* | LLM call #1. Tags `requestType`. Owns the followup loop. |
| `main` | `workers/src/agents/main/` *(replaces `triage/`)* | LLM call #2. Emits the full `LLMTurnDecision`. |

The previous `inquiry`, `triage`, and `processing` agent folders are **deprecated**. Their READMEs point here. The dispatch table that used to live in `processing` is gone — the orchestrator walks `toolCalls[]` directly through the tool registry.

---

## 7. Hazard persistence — scope decision

The `reportHazard` tool is intentionally stubbed for the MVP demo. Three layers exist for a real deployment, all optional for the hackathon:

1. **Write a row** to a hazard table in D1 capturing `{ id, category, location, description, srcLang, transcript, createdAt, status }`.
2. **Reference ID** the kiosk reads back to the resident and prints on the receipt.
3. **Export path** (CSV / webhook) for town councils / HDB / LTA to actually pull the report out.

For the 5-minute pitch: only (2) is visible. A reference ID + believable acknowledgement is indistinguishable from real persistence on stage. The `signpost` (town council contact) + `generateReceipt` (artifact) do the visible work; `reportHazard` is theatre.

**Demo build:** stub that returns `{ referenceId, routedTo }`. No D1 write. ~10 lines.

**Post-demo upgrade trigger:** GTM conversations with town councils that ask "show us the data flow", or aggregate-data narratives in the pitch. Upgrade is a 30-minute add when needed.

---

## 8. Demo scenarios — three worked examples

Each example shows the JSON the main LLM emits and the dispatch order.

### 8.1 Routing — *"where do I get my eye checked"*

```
Turn 1 (after STT): transcript_en="where do I get my eye checked", srcLang="zh-SG"

Classifier → { requestType: "ask_followup",
               followupPrompt: "Are you looking for a polyclinic or a hospital eye clinic?" }
Speak the followup. Wait.

Turn 2: transcript_en="polyclinic"
Classifier → { requestType: "signpost" }

Main LLM → {
  requestType: "signpost",
  kioskMessage: "Bedok Polyclinic handles eye checks. They're open until 5pm today.
                 I've printed a receipt with the address and what to bring.",
  toolCalls: [
    { name: "signpost", args: { agencyKey: "polyclinic-bedok" } },
    { name: "generateReceipt", args: {
        body: "Bedok Polyclinic — Eye Check\nWalk-in until 4pm, by appointment after.",
        thingsToBring: ["NRIC", "Medisave card", "current glasses"],
        signpostedAgencyKey: "polyclinic-bedok",
        language: "zh-SG"
    } }
  ]
}

Dispatch:
  signpost("polyclinic-bedok") → AgencyContact { name, phone, address, hours, location }
  generateReceipt({...}) → { receiptId, url: "/receipts/GBR-20260509-001" }

Translate kioskMessage EN → zh-SG. TTS. Render receipt iframe. Reset session.
```

### 8.2 Hazard — *"void deck light is broken"*

```
Turn 1: transcript_en="the light at my void deck is broken, someone will fall", srcLang="en-SG"
Classifier → { requestType: "report_hazard" }

Main LLM → {
  requestType: "report_hazard",
  kioskMessage: "I've filed a report with the East Coast Town Council. Your reference
                 is on the receipt. The town council usually acts within 3 working days.",
  toolCalls: [
    { name: "reportHazard", args: {
        category: "lighting", location: "void deck", description: "broken light, trip hazard"
    } },
    { name: "signpost", args: { agencyKey: "town-council-east-coast" } },
    { name: "generateReceipt", args: {
        body: "Hazard report filed.\nCategory: Lighting\nLocation: Void deck\nExpected response: 3 working days",
        thingsToBring: [],
        signpostedAgencyKey: "town-council-east-coast",
        hazardReferenceId: "<filled by orchestrator hydration>",
        language: "en-SG"
    } }
  ]
}

Dispatch (in order):
  reportHazard({...})  → { referenceId: "HZ-20260509-012", routedTo: "town-council-east-coast" }
  signpost("town-council-east-coast") → AgencyContact
  generateReceipt({..., hazardReferenceId: "HZ-20260509-012"}) → { url }

Render receipt with reference number + town council contact. Reset.
```

### 8.3 MP escalation — *"my wife and I keep fighting about the flat"*

```
Turn 1: transcript_en="my wife and I keep fighting about the flat", srcLang="zh-SG"
Classifier → { requestType: "ask_followup",
               followupPrompt: "Can you tell me a bit more — is it about ownership, or
                                living arrangement?" }

Turn 2: transcript_en="we want to sell but she won't agree"
Classifier → { requestType: "ask_followup",
               followupPrompt: "Have you spoken to anyone about this — a lawyer, or HDB?" }

Turn 3: transcript_en="no, I don't know who to talk to"
Classifier → { requestType: "signpost" }

Main LLM (with full 3-turn history) → {
  requestType: "signpost",
  kioskMessage: "Your MP holds Meet-the-People sessions every Monday evening at the
                 community club. They can connect you with a free legal clinic. I've
                 printed your reference notes — please bring them so you don't have to
                 explain everything again.",
  toolCalls: [
    { name: "signpost", args: { agencyKey: "mp-bedok-east" } },
    { name: "generateReceipt", args: {
        body: "Meet-the-People session — Bedok East MP\nMonday evenings, walk-in",
        thingsToBring: ["marriage cert", "HDB ownership docs", "income statements", "this receipt"],
        caseSummary: "Resident and spouse disagree on flat sale. Resident wants to sell;
                      spouse refuses. No legal advice sought yet. Seeking guidance on
                      next steps.",
        signpostedAgencyKey: "mp-bedok-east",
        language: "zh-SG"
    } }
  ]
}

Render receipt with case summary (the no-repeat-the-story payload). Reset.
```

---

## 9. Invariants

1. **STT detects language.** No language tile required on the frontend.
2. **Classifier owns the followup loop.** Main LLM never sees `ask_followup`.
3. **Main LLM is called exactly once per conversation** (modulo retry guard for missing `generateReceipt`).
4. **Tool calls run serially in array order.** The LLM is responsible for ordering.
5. **`generateReceipt` is mandatory in `toolCalls`.** Server-side guard re-prompts if missing.
6. **`kioskMessage` is short + conversational.** It is what the user hears and sees in the chat bubble. It is NOT the receipt body.
7. **Receipt body lives in `generateReceipt.args.body`.** The LLM writes it explicitly.
8. **Inter-tool data flow happens through orchestrator hydration**, not LLM prediction. The LLM emits keys; the registry / receipt template hydrates structured values at render time.
9. **Session is single-shot.** KV deleted after one terminal turn. Next user starts fresh.
10. **Frontend state machine is linear:** idle → listening → followup-listening → … → speaking → receipt → idle.

---

## 10. File rebuild list

This is a doc-only spec; no code changes are made by adopting this document. The list below names the source files that must be rebuilt or removed when implementation begins.

### Rewrite

| File | Why |
|---|---|
| `workers/src/types/contracts.ts` | `TriageResult` → `LLMTurnDecision`. New `ClassifierDecision`, `STTResult`. Drop `BookingConfirmation`. |
| `src/types/goodbois.ts` | Frontend twin of the above. |
| `workers/src/ai/sttAdapter.ts` | Must return `{ transcript_en, srcLang }`. |
| `workers/src/ai/llmAdapter.ts` | Two entry points: `classify(transcript, history)` and `decide(requestType, transcript, history, retryHint?)`. |
| `workers/src/orchestrator/index.ts` | Six-stage flow per §2. Loop A in classifier, retry guard for `generateReceipt`, dumb tool dispatch. |
| `workers/src/tools/registry.ts` | Narrow allowlist to 3 tools. Public `invokeTool(name, args)`. |
| `workers/src/tools/signpost.ts` | Carry location/wayfinding fields on the agency record. |
| `workers/src/tools/generateReceipt.ts` | Accept `GenerateReceiptArgs`. Orchestrator hydrates `hazardReferenceId` from prior tool results. |
| `workers/src/receipt/render.ts` | Bilingual HTML; `body` + `thingsToBring` checklist + agency block + hazard reference. |
| `workers/src/fixtures/golden-demo.ts` | Three new scenarios (routing / hazard / MP escalation). |
| `src/lib/mock-turn-fixtures.ts` | Frontend twin of the fixtures. |

### New

| File | Why |
|---|---|
| `workers/src/agents/classifier/index.ts` | LLM call #1. Owns the followup loop. |
| `workers/src/agents/main/index.ts` | LLM call #2. Replaces the old `triage/` agent. |
| `workers/src/tools/reportHazard.ts` | Stub for demo (see §7). |
| `workers/src/db/seeds/agencies.ts` *(updates)* | Add MP / RC / hazard-authority entries. |

### Delete

| File | Why |
|---|---|
| `workers/src/tools/findNearby.ts` (+ test) | Folded into `signpost`. |
| `workers/src/tools/escalateToMpRc.ts` (+ test) | Receipt **is** the escalation. |
| `workers/src/agents/inquiry/index.ts` | Followup loop now in classifier. |
| `workers/src/agents/triage/index.ts` | Replaced by `agents/main/`. |
| `workers/src/agents/processing/index.ts` | Dispatch lives in orchestrator. |
| `workers/src/export/casesCsv.ts` (+ tests) | MP/RC CSV export was paired with `escalateToMpRc`. Out of scope unless a real export channel is requested post-demo. |

### Light touch

| File | Change |
|---|---|
| `workers/src/index.ts` | Drop `/export/cases.csv` route if export is cut. Hono app shell otherwise unchanged. |
| `src/components/kiosk/ListeningState.tsx` | Loses language-tile dependency. |
| `src/components/kiosk/ChatState.tsx` | Surface the followup loop visually. |
| `src/components/kiosk/ReceiptState.tsx` | Renders the iframe; no schema changes. |
| `src/app/page.tsx` | Drop language-tile gating on mic open. |

### Keep as-is

`workers/src/ai/translateAdapter.ts`, `workers/src/ai/ttsAdapter.ts`, `workers/src/db/{repos,memory,ids}.ts`, Hono shell, `env.ts`, all kiosk frontend components except those listed above.

> **2026-05-10 update:** D1 schema landed in `workers/migrations/0001_initial.sql` with three tables (`locations`, `cases`, `receipts`). The `cases` table is the new session-history audit log — distinct from the deprecated `Case` entity. Repo implementations live in `workers/src/db/d1/`. See `docs/standards/data-contracts.md`.

---

## 11. Implementation order (suggested)

1. **Lock contracts.** Land `LLMTurnDecision`, `ClassifierDecision`, `STTResult`, `GenerateReceiptArgs` in `workers/src/types/contracts.ts` and `src/types/goodbois.ts`. Everything downstream depends on these.
2. **Rebuild the registry.** Three tools, one `invokeTool(name, args)` surface. Mock returns are fine.
3. **STT adapter returning `{ transcript_en, srcLang }`.** Stub if the real model isn't hooked up yet.
4. **Classifier agent.** Cheap LLM, returns `ClassifierDecision`. Stub with deterministic mocks first.
5. **Main LLM agent + retry guard.** Returns `LLMTurnDecision`. Guard re-prompts on missing `generateReceipt`.
6. **Orchestrator.** Wire the six stages. Use mocks for everything else.
7. **Swap mocks for real models** one adapter at a time.
8. **Frontend cleanup.** Remove tile gating; simplify state machine to: idle → listening → followup → listening → … → speaking → receipt → idle.

Each step is independently demoable behind mocks.

---

## 12. Cross-doc impact

The following docs are obsolete on the dimensions noted and should be brought into line with this spec:

- `AGENTS.md` — drop "Four-Dev Workstreams"; replace tool allowlist with the three above; reference this spec.
- `README.md` — replace pipeline section.
- `docs/system-design/architecture.md` — replace pipeline + runtime agent diagrams; drop dispatch table.
- `docs/system-design/tech-stack.md` — note STT must support language detection; receipt is HTML (already noted); two LLM calls now.
- `docs/standards/data-contracts.md` — add `LLMTurnDecision`, `ClassifierDecision`, `STTResult`, `GenerateReceiptArgs`. Remove `BookingConfirmation`. Mark `TriageResult` deprecated.
- `docs/hackathon/agent-launch-packet.md` — replace `TurnRequest` / `TurnResponse` shapes; drop `mode` and `scriptedStep` fields; drop the four-lane ownership table.
- `docs/hackathon/mvp-execution-plan.md` — replace target demo (single Mandarin lift scenario) with the three demo scenarios from §8.
- `docs/agents/handoff-dev-b-to-dev-a.md` — superseded; the lane split is gone.
- `docs/agents/subagents.md` — drop ownership lanes; reframe as topic helpers.
- `docs/agents/team-operating-model.md` — drop the four-lane table; coordination rules stay.
- `.claude/agents/accessibility-voice-agent.md` — drop "do not touch" boundaries; topic helper for voice/orchestrator/frontend work.
- `.claude/agents/hazard-admin-agent.md` — drop "do not touch" boundaries; promote hazard reporting from NTH to MVP (stubbed); topic helper for tools/receipt/agency work.
- `workers/src/agents/{inquiry,triage,processing}/README.md` — mark deprecated.
- `workers/src/agents/README.md` — describe the new classifier + main split.
- `workers/src/orchestrator/README.md` — six stages.
- `workers/src/tools/README.md` — three-tool allowlist with signatures.
- `workers/src/ai/README.md` — STT now returns `srcLang`; two LLM calls.
- `docs/superpowers/specs/2026-05-09-dev-b-tools-cases-design.md` — superseded (predates this spec).
- `docs/superpowers/plans/2026-05-09-dev-b-tools-and-cases.md` — superseded.
- `CLAUDE.md` — subagent recommendations updated to match the three lanes in §13.

---

## 13. Dev breakdown (added 2026-05-10)

The "no lanes" position from earlier is replaced by a **three-lane split**. Lanes are ownership defaults — anyone can edit any file, but coordinate before crossing lanes.

### Dev A — Orchestration & agent pipeline (no tools)

Owns:

- `workers/src/orchestrator/` — the six-stage flow + retry guard + KV reset.
- `workers/src/agents/classifier/` — LLM call #1; owns the followup loop.
- `workers/src/agents/main/` — LLM call #2; emits `LLMTurnDecision` with mandatory `generateReceipt`.
- `workers/src/ai/sttAdapter.ts` — STT with language detection, returning `{ transcript_en, srcLang }`.
- `workers/src/ai/llmAdapter.ts` — both `classify(...)` and `decide(...)` entry points.
- `workers/src/ai/translateAdapter.ts` — English ↔ srcLang.
- `workers/src/ai/ttsAdapter.ts` — TTS in srcLang.
- `workers/src/db/memory.ts` (KV-backed turn state) and the `KioskSession` reads/writes from the orchestrator.
- The `POST /turn` route handler.
- Frontend kiosk UX in `src/` — listening / followup / speaking / receipt states; touch fallback; idle reset. (No language picker — STT detects.)

Does NOT touch tool implementations. Calls them through `registry.invokeTool(name, args)` only.

### Dev B — Receipt & Hazard tools + external integrations

Owns:

- `workers/src/tools/generateReceipt.ts` — the receipt tool.
- `workers/src/tools/reportHazard.ts` — the hazard tool.
- `workers/src/receipt/render.ts` and `GET /receipts/:id` — bilingual HTML render.
- **External integration adapters** for receipt and hazard delivery:
  - **Printer adapter** for the receipt (POS / thermal / HTML-to-print). Demo may stub the device call; the seam must exist.
  - **Email adapter** (Cloudflare Email Routing or equivalent) for receipt emailing and hazard report dispatch to town councils / authorities. Demo may stub the send; the seam must exist.
- D1 entries for `Receipt` and (post-stub) `HazardReport`.
- Receipt fixtures and hazard category → routing-authority map.

Tool contract: `signpost`, `reportHazard`, `generateReceipt` go through the shared `workers/src/tools/registry.ts` (see "Shared" below). Dev B registers the two tools they own.

### Dev C — Routing tool (signpost) + agency directory

Owns:

- `workers/src/tools/signpost.ts` — the signpost tool. Includes the wayfinding fields (lat/long + walking direction hints) folded in from the retired `findNearby`.
- `workers/src/db/seeds/agencies.ts` and the `AgencyContact` directory in D1 — 15–25 entries covering polyclinic, hospital, MP, RC, town council, hazard authorities (LTA / HDB / MOM).
- The `AgencyContact` schema in `workers/src/types/contracts.ts` (Dev C is primary; coordinate cross-lane edits via the shared rule below).
- (NTH, Phase 5) Map render layered on top of `signpost` results — reuse the agency record's lat/long.

### Shared

- `workers/src/tools/registry.ts` — the `invokeTool(name, args)` surface. Dev A consumes; Dev B + Dev C register tools into it. Edit with PR coordination.
- `workers/src/types/contracts.ts` — schemas. The default rule still applies: update `docs/standards/data-contracts.md` first.
- Demo orchestration / scripted-fallback / pre-warm checklist — no fixed owner. Shared, but typically picked up by whoever's blocked.

### Default lane mapping for Claude/Codex subagents

| Lane | Subagent file | Topic helper |
|---|---|---|
| Dev A | `.claude/agents/accessibility-voice-agent.md` | Orchestration, agents, STT/translate/TTS, KV, frontend UX |
| Dev B | `.claude/agents/hazard-admin-agent.md` | Receipt + hazard tools + printer/email integration |
| Dev C | `.claude/agents/map-discovery-agent.md` | Signpost tool, agency directory, NTH map overlay |

`safety-demo-agent` stays available as a topic helper for end-to-end demo orchestration but is no longer a fixed lane.

### Cross-lane integration order

For two devs to be unblocked at all times, land in this order:

1. Dev C lands the agency directory seed + `signpost` returning a static `AgencyContact`.
2. Dev B lands `generateReceipt` returning a stub URL + `reportHazard` returning a stub reference ID.
3. Dev A's orchestrator now has a real registry to dispatch into; mocks for the LLMs are sufficient.
4. Dev A swaps mocks for real STT / classifier / main LLM / translate / TTS, one adapter at a time.
5. Dev B layers in the printer / email adapters behind their stubs.
6. Dev C extends `AgencyContact` with location/wayfinding fields once `signpost` callers ask for them.
