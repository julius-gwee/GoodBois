# Team Operating Model

> The four-dev lane split was scrapped on 2026-05-09. There is no longer a fixed ownership table — anyone can edit any file. The coordination rituals below still apply.

## Goal

Let multiple developers and AI agents work concurrently on **GoodBois** — a void-deck voice kiosk for elderly residents — without duplicating work or breaking each other's changes.

## Canonical references

Always defer to:

1. `docs/refactor/2026-05-09-llm-turn-decision.md` — agent flow.
2. `docs/standards/data-contracts.md` — schemas.
3. `AGENTS.md` — operating manual.

The path layout (`workers/`, `workers/src/agents/classifier/`, `workers/src/agents/main/`, `src/components/kiosk/`, etc.) is the active post-refactor layout. The legacy FastAPI/Supabase scaffold has been removed and must not be reintroduced. The deprecated `workers/src/agents/{inquiry,triage,processing}/` folders are scheduled for deletion.

## Daily Hackathon Rhythm

1. **Start sync, 10 minutes**
   - Each dev states target outcome, files they intend to touch, and blockers.

2. **Build block, 90–120 minutes**
   - Work on independent surfaces.
   - Commit small changes.
   - Update `docs/standards/data-contracts.md` before any code that depends on a new shape.

3. **Integration checkpoint, 20 minutes**
   - Pull latest.
   - Resolve interface mismatches at the frontend ↔ Worker boundary.
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

## Handoff Format

Use this in chat or PR descriptions:

```md
Surface area:
Files changed:
Behavior changed:
How to verify (which demo scenario):
Known gaps:
Needs from someone else:
```

## Integration Priorities

These are the order in which the system becomes demoable end-to-end:

1. Worker `POST /turn` accepts user audio + returns the next kiosk state.
2. STT adapter returns `{ transcript_en, srcLang }` (mock or real).
3. Classifier agent returns `ClassifierDecision` (mock or real); orchestrator loops on `ask_followup`.
4. Main LLM agent returns `LLMTurnDecision` (mock or real) with mandatory `generateReceipt`.
5. Tool registry dispatches `signpost`, `reportHazard` (stub), `generateReceipt`.
6. Translate + TTS produce audio in `srcLang`.
7. Frontend renders listening / followup / speaking / receipt states.
8. KV reset on terminal turn.
9. (NTH) Map render layered on `signpost` results.
