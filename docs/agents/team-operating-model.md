# Four-Agent Team Operating Model

## Goal

Let four developers and multiple AI agents work concurrently on **GoodBois** — a void-deck voice kiosk for elderly residents — without duplicating work or breaking each other's changes. (The product previously described as "Care Access Map" pivoted on 2026-05-09.)

## Workstream Ownership

| Lane | Owner | Scope | Primary Files |
| --- | --- | --- | --- |
| A | `accessibility-voice-agent` | Voice pipeline, AI adapters, runtime orchestrator, inquiry/triage agent logic, and kiosk frontend UX | `workers/src/orchestrator/*`, `workers/src/agents/inquiry/*`, `workers/src/agents/triage/*`, `workers/src/ai/*`, `src/components/kiosk/*`, `src/components/atoms/*`, `src/app/*` |
| B | `hazard-admin-agent` / Tools & Cases | Processing agent, Worker tool surface (`signpost`, `findNearby` MVP stub, `simulateBooking`, `generateReceipt`, `escalateToMpRc`), agency directory, receipt PDF, MP/RC export | `workers/src/agents/processing/*`, `workers/src/tools/*`, `workers/src/db/*`, `workers/src/pdf/*`, `workers/migrations/*` |
| C | `map-discovery-agent` | NTH map + resource discovery + OneMap Barrier-Free wheelchair-friendly routing | `src/components/map/*`, `workers/src/tools/findNearby.ts` (real impl, replacing the MVP stub) |
| D | `safety-demo-agent` | End-to-end demo orchestration, scripted-fallback path, pre-warm checklist; route safety / Grab handoff (NTH low priority) | `src/demo/*`, `src/components/safety/*` (NTH) |

The path layout (`workers/`, `workers/src/agents/`, `src/components/kiosk/`, etc.) is the active post-pivot layout. The legacy FastAPI/Supabase scaffold has been removed and must not be reintroduced.

## Daily Hackathon Rhythm

1. **Start sync, 10 minutes**
   - Each dev states target outcome, files owned, and blockers.

2. **Build block, 90–120 minutes**
   - Work on separate lanes.
   - Commit small changes.
   - Update contracts before dependent UI / Worker code.

3. **Integration checkpoint, 20 minutes**
   - Pull latest.
   - Resolve interface mismatches at the frontend ↔ Worker boundary.
   - Verify the end-to-end kiosk demo path on the demo laptop.

4. **Demo hardening**
   - Freeze new scope.
   - Only fix bugs, seed data, copy, multilingual rendering, and visual clarity.
   - Pre-warm AI weights from the demo laptop.

## Coordination Rules

- If a change affects shared data shape, update `docs/standards/data-contracts.md` first.
- If a change affects positioning or claims, update `docs/standards/product-principles.md`.
- If a change affects UI patterns, update `docs/standards/ui-ux-standards.md`.
- If a change affects the locked stack or architecture rules, update `docs/system-design/tech-stack.md` first, then `architecture.md`.
- If two lanes need the same file, pair briefly and split the file by responsibility.

## Handoff Format

Use this in chat or PR descriptions:

```md
Lane:
Files changed:
Behavior changed:
How to verify (kiosk demo step):
Known gaps:
Needs from other lanes:
```

## Integration Priorities

1. Worker `POST /turn` endpoint accepts user audio/text + language and returns the next kiosk state.
2. KV-backed multi-turn session survives the bounded follow-up loop.
3. `signpost` returns an `AgencyContact` from D1; kiosk renders it.
4. `escalateToMpRc` writes a `Case` and the export adapter fires.
5. `generateReceipt` writes a PDF to R2 and the kiosk shows it full-screen.
6. Idle reset clears KV without breaking the next session.
7. (NTH) `findNearby` returns `Resource` rows; the map renders inside the response card.
