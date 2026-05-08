# GoodBois Worker Scaffold

This directory is the target Cloudflare Worker backend for GoodBois.

Do not put new backend work in `server/`; that directory is legacy FastAPI/Supabase scaffold scheduled for decommission.

## Build-Day Goal

The first Worker checkpoint is a mock-compatible `POST /turn` endpoint that matches `docs/hackathon/agent-launch-packet.md`.

Build in this order:

1. Keep `workers/src/types/contracts.ts` aligned with `docs/standards/data-contracts.md`.
2. Return the golden demo fixtures from `workers/src/fixtures/golden-demo.ts`.
3. Add D1 access under `workers/src/db/`.
4. Add allowlisted tools under `workers/src/tools/`.
5. Replace fixture orchestration with real STT, translation, LLM, tool calls, TTS, receipt, and export.

## Ownership

- Dev A may read Worker contracts and fixtures, but should avoid editing Worker internals unless coordinating.
- Dev B owns Worker tools, D1 migrations, receipt generation, CSV export, and agency seed data.
- Dev D owns scripted fallback fixture content and demo safety paths.

## Planned Runtime

- Cloudflare Workers, TypeScript.
- Hono by default once dependencies are installed.
- Workers AI for STT, TTS, and triage LLM.
- SEALion for translation.
- D1 for database.
- KV for session state.
- R2 for receipt PDFs.

See `docs/system-design/tech-stack.md` for locked stack details.
