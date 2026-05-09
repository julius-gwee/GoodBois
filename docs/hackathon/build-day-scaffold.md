# Build Day Scaffold

This file describes the scaffold prepared before build day. It is intentionally not a completed implementation.

## Ready for Agents

- `workers/` now exists as the target Cloudflare Worker backend folder.
- `workers/src/types/contracts.ts` defines the build-day `TurnRequest` and `TurnResponse` contract.
- `workers/src/agents/` documents the inquiry, triage, and processing runtime roles from the whiteboard.
- `workers/src/fixtures/golden-demo.ts` contains the golden demo fixture data.
- `src/types/goodbois.ts` gives the frontend a matching type surface.
- `src/lib/mock-turn-fixtures.ts` gives the kiosk lane a mock response source before the Worker is live.
- `workers/src/*/README.md` files mark the intended ownership boundaries.
- `workers/wrangler.toml.example` documents the intended Cloudflare bindings without requiring real resource IDs yet.

## Not Implemented Yet

- Real `POST /turn` orchestration.
- Real inquiry, triage, and processing agent implementations.
- Hono routing.
- D1 migrations.
- R2 receipt upload.
- KV session management.
- Workers AI STT/TTS/LLM.
- SEALion translation.
- Full kiosk UI replacement of the temporary GoodBois scaffold page.

## Recommended First Agent Tasks

1. Dev A: replace starter page with kiosk shell that reads `src/lib/mock-turn-fixtures.ts`.
2. Dev B: create D1 migration and seed 15-25 `AgencyContact` rows.
3. Dev A/B: wire Worker `/turn` to return `workers/src/fixtures/golden-demo.ts` through the orchestrator/agent folder shape.
4. Dev D: create demo runbook and pre-warm checklist.
5. Keep the removed Supabase/FastAPI scaffold out of the repo while the kiosk shell lands.

## Guardrail

Do not reintroduce the old Supabase/FastAPI scaffold. The active backend path is `workers/`.
