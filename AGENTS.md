# GoodBois Agent Guide

This file is the shared operating manual for Codex, Claude Code, and human developers working on the **GoodBois** elderly voice kiosk. (The product previously described as "Care Access Map" — the pivot to the kiosk landed on 2026-05-09.)

## Project Context

GoodBois is a voice-first kiosk installed at HDB void decks for less tech-savvy elderly residents who live alone or with limited family support, speak Mandarin / Hokkien / other SEA languages, and currently rely on weekly MP Meet-the-People sessions or RC visits to navigate basic government and social services.

The kiosk **triages** their requests in their language, **signposts** them to the right agency / hotline / local resource, and **escalates complex cases** to MP/RC volunteers as structured cases. Unlike the AIC hotline or LifeSG app, the kiosk meets them where they already are, speaks dialect, runs 24/7, and routes complex cases with structured context.

**Demo:** runs on laptops, kiosk-style UI. No real printer (PDF receipt shown full-screen). Bookings simulated if time allows, otherwise scripted.

Read first:

1. `docs/START_HERE_FOR_NEW_AGENTS.md`
2. `docs/care-access-map-prd-and-backlog.md` — kiosk PRD (filename predates the pivot)
3. `docs/standards/product-principles.md`
4. `docs/system-design/tech-stack.md`
5. `docs/system-design/architecture.md`
6. `docs/strategy/judging-criteria-alignment.md` — the rubric we're optimising for
7. `docs/agents/team-operating-model.md`

## Judging Criteria

This is a hackathon project. The team is optimising for the published rubric:

| Criterion | Weight |
|---|---|
| Problem-Solution Fit | 35% |
| Scalability Across Cultures & Borders | 15% |
| Long-term Sustainability | 15% |
| Go-to-Market Strategy | 15% |
| Innovation & Creativity | 10% |
| Presentation & Storytelling | 10% |

When in doubt about scope or polish, prioritise the highest-weight criterion the change affects. Strategy docs that back specific criteria live in `docs/strategy/`:

- `docs/strategy/go-to-market.md` (GTM)
- `docs/strategy/sustainability.md` (sustainability)
- `docs/strategy/regional-scaling.md` (cross-border scalability)
- `docs/strategy/judging-criteria-alignment.md` (cheat sheet for the demo + pitch)

## Non-Negotiables

- Keep the MVP demoable. Prefer a working vertical slice over broad unfinished coverage.
- Frontend never calls Workers AI or SEALion directly. All AI calls go through the orchestrator Worker.
- Cloudflare D1 is the only database. No Supabase. No external Postgres. (FastAPI + Supabase scaffolding still in repo is being decommissioned — don't extend it.)
- Triage LLM picks from an allowlisted tool surface; it cannot fabricate hotlines or agencies.
- Kiosk is anonymous by default. Identity capture is optional and only when needed; never NRIC.
- Bookings are simulated for the demo. Do not call real agency APIs.
- Multi-turn dialogue is bounded (≤3 follow-ups).
- All voice flows have a text/touch fallback.
- Keep `mapAdapter` boundary even though map is NTH.
- Use elderly-friendly UI defaults: large text, clear labels, high contrast, low clutter, ≥44px touch targets, ≥120px language tiles.
- Do not break another dev's work. Check status before editing and keep ownership boundaries tight.

## Four-Dev Workstreams

Use these ownership lanes unless the team explicitly changes them. Subagent role files in `.claude/agents/*.md` mirror these.

1. **Dev A — `accessibility-voice-agent` (voice + kiosk UX)**
   - Backend (Worker): STT / TTS / translation / triage LLM clients; orchestrator; multi-turn KV session.
   - Frontend: kiosk shell, language picker, listening state, transcript panel, response card, consent banner, idle reset.
   - Multilingual UX + voice-agent research subtask (Cloudflare/SEALion language matrix; final model picks).
   - Primary docs: `docs/system-design/tech-stack.md`, `docs/system-design/architecture.md`, `docs/system-design/integration-boundaries.md`, `docs/standards/ui-ux-standards.md`.

2. **Dev B — `hazard-admin-agent` (tools, cases, receipt, export)**
   - Worker tools: `signpost`, `findNearby` (MVP stub), `simulateBooking`, `generateReceipt`, `escalateToMpRc`.
   - Agency directory seed data; D1 schema for cases / receipts / agency / kiosk session entities.
   - Receipt PDF generation (Worker + R2).
   - MP/RC export adapter (CSV / webhook / email).
   - Hazard reporting (NTH, low priority).
   - Primary docs: `docs/standards/data-contracts.md`, `docs/standards/product-principles.md`, `docs/system-design/integration-boundaries.md`.

3. **Dev C — `map-discovery-agent` (NTH map + resource discovery)**
   - `Resource` schema (NTH).
   - `mapAdapter` (react-leaflet + OneMap tiles).
   - Real `findNearby` implementation (replaces MVP stub).
   - OneMap Barrier-Free Access API integration; wheelchair-friendly routing.
   - Primary docs: `docs/system-design/architecture.md`, `docs/standards/data-contracts.md`, `docs/system-design/integration-boundaries.md`.

4. **Dev D — `safety-demo-agent` (demo orchestration + route safety NTH)**
   - End-to-end kiosk demo script.
   - Scripted-fallback path (feature-flagged) as stage safety net.
   - Pre-warm checklist for the pitch.
   - Demo seed data covering every triage outcome.
   - Route safety / Grab handoff (NTH, low priority).
   - Primary docs: `docs/hackathon/mvp-execution-plan.md`, `docs/system-design/architecture.md`.

## Working Rules

- Start each task by stating which files you intend to touch.
- Keep PRs/commits scoped to one workstream or one vertical slice.
- If you need to touch another lane's file, coordinate in the team chat first.
- Use typed/shared data contracts instead of inventing duplicate object shapes.
- Prefer seeded D1 data for hackathon speed, but structure it like production data.
- Add demo data deliberately: every feature needs visible seeded examples.
- Use feature flags or mock adapters for incomplete external integrations.

## UI Component Rules

All UI work follows the "Component Architecture" section of `docs/standards/ui-ux-standards.md`. Summary:

- Build on shadcn primitives in `src/components/ui/` (add via `npx shadcn@latest add <name>`). Do not roll your own button, input, dialog, switch, slider, etc. when shadcn covers it.
- Extract anything reused 2+ times into an atom under `src/components/atoms/` (e.g. language tile, listening pulse, agency card, receipt block). Atoms own no feature state.
- Split feature components when a file passes ~150 lines, has 3+ distinct sections, or repeats a JSX block. One component per file under `src/components/<feature>/`.
- Memoise only with a reason: `useMemo` for costly derivations, `useCallback` for memoised children or hook deps, `React.memo` for list rows. Hoist constant objects/arrays/style configs to module scope instead of recreating per render.
- Style via the primitive's variant API and `cn()` from `@/lib/utils`. If you find yourself duplicating a class string, you have an atom waiting to be extracted.

## Expected Verification

Before saying a task is done:

- Run the relevant lint/type/test command if the app stack exists.
- Manually verify the kiosk flow on the demo laptop when UI is touched.
- Confirm voice path works end-to-end (or that the touch fallback is wired) when AI is touched.
- Confirm no secrets, API keys, or personal data were committed.
- Update docs if behavior or data contracts changed.

## Commit Message Style

Use:

- `feat: ...`
- `bugfix: ...`
- `docs: ...`
- `chore: ...`
- `test: ...`

Examples:

- `feat: add hokkien STT path with Cloudflare Workers AI`
- `feat: signpost tool returns AgencyContact from D1`
- `docs: rewrite tech stack for Cloudflare migration`
- `bugfix: reset kiosk session on idle timer expiry`

## Tool Compatibility Notes

Codex and Claude can both follow this file. Tool-specific files may also exist:

- Codex: `.codex/skills/care-access-map/SKILL.md`
- Claude: `CLAUDE.md`, `.claude/agents/*.md`

When instructions conflict, follow the most specific project file for the tool you are currently using, then this file, then general model defaults.
