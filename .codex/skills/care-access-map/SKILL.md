---
name: care-access-map
description: Use when working on GoodBois, a void-deck voice kiosk for elderly Singapore residents. (Skill name predates the 2026-05-09 pivot from "Care Access Map" to GoodBois.)
---

# GoodBois Skill

Use this skill for any product, design, code, data, demo, or documentation task in this repository. The skill name `care-access-map` predates the 2026-05-09 pivot — the product is now **GoodBois**, a void-deck voice kiosk.

## Read First

1. `AGENTS.md`
2. `docs/START_HERE_FOR_NEW_AGENTS.md`
3. `docs/care-access-map-prd-and-backlog.md` — kiosk PRD (filename predates the pivot)
4. `docs/standards/product-principles.md`
5. `docs/system-design/tech-stack.md` — locked stack
6. `docs/standards/data-contracts.md`
7. `docs/system-design/architecture.md`

## Product Guardrails

- This is a **void-deck voice kiosk for elderly residents**, not a generic map or directory.
- Pipeline: STT → SEALion translate → LLM triage → orchestrator → tool calls → SEALion translate → TTS.
- Multi-turn dialogue with bounded follow-ups (≤3).
- Anonymous by default. NRIC never captured.
- Hotlines and agencies always come from the curated `AgencyContact` directory; the LLM picks, never generates.
- Bookings for the demo are simulated (or scripted if time-pressed). No real agency APIs.
- MP/RC volunteers consume cases via their existing dashboards; we do not build one.
- No claims of official dispatch, emergency response, medical advice, or guaranteed resolution.

## Implementation Guardrails

- Frontend never calls Workers AI or SEALion directly. All AI calls go through the orchestrator Worker.
- Cloudflare D1 is the only database. No Supabase. No external Postgres. (FastAPI + Supabase scaffolding still in repo is being decommissioned — don't extend it.)
- Triage LLM picks from an allowlisted tool surface.
- All voice flows have a text/touch fallback.
- Keep `mapAdapter` boundary even though map is NTH.
- Use latitude/longitude as canonical coordinates.
- Update `docs/standards/data-contracts.md` before changing shared object shapes.

## UI Component Guardrails

shadcn is installed (`src/components/ui/*`, `@/lib/utils` for `cn()`, neutral base color, lucide icons). Full rules: `docs/standards/ui-ux-standards.md` "Component Architecture". Summary:

- Build on shadcn primitives. Add via `npx shadcn@latest add <name>`. Do not hand-roll button/input/dialog/switch/slider.
- Put repeated controls (used 2+ times) in `src/components/atoms/*`; feature composites in `src/components/<feature>/*`. One component per file.
- Memoise only with a reason: `useMemo` for costly derivations, `useCallback` for memoised children/hook deps, `React.memo` for list rows. Hoist constants to module scope.
- Refactor trigger: split a file when it crosses ~150 lines, has 3+ sections, or repeats a JSX block.
- Touch targets ≥44px; language tiles ≥120px.

## Task Start Checklist

- Identify the workstream: voice/kiosk UX, tools/cases/export, map/discovery (NTH), or demo orchestration.
- State the files you will touch.
- Check current git status.
- Avoid editing another workstream's files without coordination.

## Done Checklist

- Feature is reachable in the kiosk demo flow.
- Relevant docs updated.
- Kiosk display resolution and idle reset behavior considered.
- No unsupported product claims.
- Tests/lint/manual verification run where available.
