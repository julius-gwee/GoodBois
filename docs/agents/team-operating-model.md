# Team Operating Model

> Three-lane dev breakdown. Lanes are ownership defaults; coordinate before crossing lanes. Full detail in `docs/refactor/2026-05-09-llm-turn-decision.md` §13.

## Goal

Let three developers and their AI agents work concurrently on **GoodBois** — a void-deck voice kiosk for elderly residents — without duplicating work or breaking each other's changes.

## Canonical references

Always defer to:

1. `docs/refactor/2026-05-09-llm-turn-decision.md` — agent flow + dev breakdown.
2. `docs/standards/data-contracts.md` — schemas.
3. `AGENTS.md` — operating manual + lane summary.

## Workstream Ownership

| Lane | Owner | Scope | Primary Files |
|---|---|---|---|
| **A** | `accessibility-voice-agent` | Orchestrator, classifier + main LLM agents, AI adapters (STT with language detection, translate, TTS, llmAdapter), KV session, `POST /turn` handler, kiosk frontend UX. Does **not** touch tool implementations. | `workers/src/orchestrator/*`, `workers/src/agents/classifier/*`, `workers/src/agents/main/*`, `workers/src/ai/*`, `workers/src/db/memory.ts`, `src/components/kiosk/*`, `src/components/atoms/*`, `src/app/*` |
| **B** | `hazard-admin-agent` | Receipt + hazard tools and their external integrations (printer, email). Includes the bilingual HTML receipt render at `GET /receipts/:id`, and the integration adapters for printer + email delivery. | `workers/src/tools/generateReceipt.ts`, `workers/src/tools/reportHazard.ts`, `workers/src/receipt/*`, printer + email adapter modules |
| **C** | `map-discovery-agent` | Routing tool (`signpost`), agency directory seed, `AgencyContact` schema (incl. wayfinding fields). NTH (Phase 5): map render layered on signpost. | `workers/src/tools/signpost.ts`, `workers/src/db/seeds/agencies.ts`, NTH `src/components/map/*` |

The path layout is the active post-refactor layout. The deprecated `workers/src/agents/{inquiry,triage,processing}/` folders are scheduled for deletion. The legacy FastAPI/Supabase scaffold has been removed and must not be reintroduced.

## Shared

- `workers/src/tools/registry.ts` — `invokeTool(name, args)` surface. Dev A consumes; Dev B + Dev C register tools. Edit with PR coordination.
- `workers/src/types/contracts.ts` — schemas. Update `docs/standards/data-contracts.md` first.
- Demo orchestration / scripted-fallback / pre-warm checklist — no fixed lane. Shared, picked up by whoever's blocked. Use `safety-demo-agent` as a topic helper.

## Daily Hackathon Rhythm

1. **Start sync, 10 minutes**
   - Each dev states target outcome, files they intend to touch, and blockers.

2. **Build block, 90–120 minutes**
   - Work on independent surfaces. Lanes A / B / C are mostly independent once the registry is in place.
   - Commit small changes.
   - Update `docs/standards/data-contracts.md` before any code that depends on a new shape.

3. **Integration checkpoint, 20 minutes**
   - Pull latest.
   - Resolve interface mismatches at the orchestrator ↔ registry ↔ tool boundary.
   - Verify the three demo scenarios on the demo laptop.

4. **Demo hardening**
   - Freeze new scope.
   - Only fix bugs, seed data, copy, multilingual rendering, and visual clarity.
   - Pre-warm AI weights from the demo laptop.

## Coordination Rules

- If a change affects shared data shape, update `docs/standards/data-contracts.md` first.
- If a change affects the agent flow or stage list, update `docs/refactor/2026-05-09-llm-turn-decision.md` first.
- If a change affects positioning or claims, update `docs/standards/product-principles.md`.
- If a change affects UI patterns, update `docs/standards/ui-ux-standards.md`.
- If a change affects the locked stack, update `docs/system-design/tech-stack.md` first, then `architecture.md`.
- If two devs need the same file, pair briefly and split the file by responsibility.
- Cross-lane edits go through a PR with mention; never silently land in another lane's primary file.

## Handoff Format

Use this in chat or PR descriptions:

```md
Lane:
Files changed:
Behavior changed:
How to verify (which demo scenario):
Known gaps:
Needs from other lanes:
```

## Cross-lane integration order

To keep everyone unblocked, land in this order:

1. **Dev C** — agency directory seed + `signpost` returning a static `AgencyContact`.
2. **Dev B** — `generateReceipt` returning a stub URL + `reportHazard` returning a stub reference ID.
3. **Dev A** — orchestrator dispatches into the registry; LLM mocks fine.
4. **Dev A** — swap mocks for real STT / classifier / main LLM / translate / TTS, one at a time.
5. **Dev B** — layer printer + email adapters behind the stubs.
6. **Dev C** — extend `AgencyContact` with location/wayfinding fields once `signpost` callers ask for them.
