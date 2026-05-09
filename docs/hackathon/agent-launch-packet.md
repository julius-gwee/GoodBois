# Agent Launch Packet

Use this packet before spinning up Codex or Claude agents. It keeps parallel work pointed at the same demo path and prevents agents from extending the old scaffold.

## Build Rule

Do not start by wiring real AI or Cloudflare services. Build against a mock-first integration contract so frontend, Worker tools, seed data, receipt, and demo fallback can move in parallel.

The app is done for the first integration checkpoint when:

1. Kiosk UI loads.
2. Mock `POST /turn` works.
3. One seeded agency response renders.
4. Escalation writes or simulates a `Case`.
5. Receipt screen appears.
6. CSV export exists.
7. Demo script is rehearsable.

## Golden Demo Path

This path is sacred until the MVP is stable. Every lane should make this flow stronger before broadening scope.

1. Resident taps Mandarin or Hokkien language tile.
2. Resident says: "My lift is broken and I cannot go to the hospital for dialysis."
3. Kiosk shows listening state and transcript.
4. Worker translates to English and triages two needs: lift repair plus dialysis transport support.
5. Kiosk asks one bounded follow-up: "Which block and floor?"
6. Resident answers: "Block 123, level 8."
7. Worker signposts HDB Essential Services and offers MP/RC escalation for transport-aid help.
8. Resident accepts escalation.
9. Worker creates a structured `Case`, fires CSV export, and generates a receipt.
10. Kiosk shows bilingual receipt full-screen.
11. Idle reset clears the session and returns to language picker.

## Mock-First `POST /turn` Contract

Frontend and Worker lanes should share this shape immediately. The first implementation may return scripted fixture data; the real orchestrator must preserve the same response shape unless `docs/standards/data-contracts.md` is updated first.

### Request

```ts
type TurnRequest = {
  sessionId?: string;
  kioskId: string;
  language: string;
  mode: "voice" | "touch" | "scripted_demo";
  text?: string;
  audioBase64?: string;
  scriptedStep?: "initial_request" | "followup_answer" | "accept_escalation";
};
```

### Response

```ts
type TurnResponse = {
  sessionId: string;
  state: "listening" | "thinking" | "followup" | "response" | "receipt" | "error";
  transcript?: {
    original: string;
    english?: string;
    language: string;
  };
  kioskMessage: {
    original: string;
    english: string;
    language: string;
  };
  triage?: {
    outcome:
      | "signpost"
      | "find_nearby"
      | "simulate_booking"
      | "ask_followup"
      | "escalate"
      | "out_of_scope";
    confidence: "high" | "medium" | "low";
    selectedToolName?: string;
    selectedAgencyKey?: string;
  };
  agencyContact?: AgencyContact;
  case?: Case;
  receipt?: Receipt;
  audioUrl?: string;
  nextActions: Array<
    | "listen"
    | "type"
    | "accept_escalation"
    | "decline_escalation"
    | "show_receipt"
    | "reset"
  >;
  error?: {
    code: string;
    message: string;
    fallbackAvailable: boolean;
  };
};
```

## Stage Fallback Path

The scripted demo path must use the same UI states and response contract as the real path. It may bypass STT, SEALion, and live LLM calls, but it must still show:

- language picker
- consent
- listening/transcript
- thinking
- follow-up
- response card
- escalation
- receipt
- idle reset

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

Dev B owns seed data unless the team explicitly reassigns it.

Minimum demo seed data:

- 15-25 `AgencyContact` rows.
- At least one agency per category in `docs/standards/data-contracts.md`.
- English and Mandarin blurbs for every MVP agency.
- Hokkien copy where the translation lane validates it.
- One canned escalation case for the golden demo.
- One CSV export fixture.
- One receipt fixture.

Seed data should be production-shaped even if values are demo-safe. Do not invent real hotlines unless verified and sourced.

## Agent File Ownership

Use these ownership lanes by default:

| Lane | Agent | Owns | Avoids |
|---|---|---|---|
| Dev A | `accessibility-voice-agent` | `src/app`, `src/components/kiosk`, `src/components/atoms`, kiosk state, voice/touch client UX | D1 schema, receipt rendering, export adapter |
| Dev B | `hazard-admin-agent` | `workers/src/tools`, `workers/src/db`, D1 migrations, agency seeds, receipt/export tools | Kiosk visual layout except data contract needs |
| Dev C | `map-discovery-agent` | `src/lib/mapAdapter` research/stub, NTH resource discovery notes | MVP kiosk flow unless explicitly asked |
| Dev D | `safety-demo-agent` | `docs/hackathon`, demo script, scripted fallback fixtures, pre-warm checklist | Core Worker tool internals unless fixing demo breakage |

When a lane must touch another lane's files, coordinate in team chat first and mention the reason in the PR description.

## Cut Rules

If time is tight, keep:

- language picker
- mock/real `POST /turn`
- one signpost path
- one escalation path
- receipt screen
- CSV export
- scripted fallback

Cut:

- real map render
- real booking integrations
- webhook/email export
- hazard reporting
- Grab handoff
- route safety
- extra languages beyond English and Mandarin

## Tech Stack Reminder

- Frontend: Next.js 16, React 19, TypeScript, Tailwind v4, shadcn/ui, lucide-react.
- Hosting: Cloudflare Pages.
- Backend: Cloudflare Workers in TypeScript.
- Worker framework: Hono by default.
- AI: Workers AI for STT, TTS, and triage LLM.
- Translation: SEALion.
- Database: Cloudflare D1 only.
- Session: Cloudflare KV.
- Receipt storage: Cloudflare R2.
- PDF: likely `@pdf-lib/pdf-lib`.
- NTH map: `react-leaflet` and OneMap behind `mapAdapter`.

Supabase, FastAPI, magic-link auth, and the dashboard are removed legacy scaffold surfaces. Do not build new product work on them or re-add them.
