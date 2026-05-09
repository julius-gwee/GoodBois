# Claude Code Instructions

Read `docs/refactor/2026-05-09-llm-turn-decision.md` first (canonical agent flow), then `docs/START_HERE_FOR_NEW_AGENTS.md` and `AGENTS.md`. This file only adds Claude-specific compatibility guidance.

## Project Behavior

- Treat `docs/refactor/2026-05-09-llm-turn-decision.md` as the canonical spec for the agent flow. Treat `AGENTS.md` as the shared operating manual that surrounds it.
- Use `.claude/agents/*.md` as topic-helper prompts when delegating to Claude subagents. They are no longer ownership lanes — anyone can edit any file.
- Keep edits small and scoped. Coordinate before changing schemas in `docs/standards/data-contracts.md` or the orchestrator stage list.
- Prefer Markdown docs and typed source files over ad hoc notes.

## UI Component Rules

shadcn is installed (`src/components/ui/*`, `@/lib/utils` for `cn()`, neutral base color, lucide icons). When building UI:

- Add primitives with `npx shadcn@latest add <name>`. Do not hand-roll a button, input, dialog, switch, or slider.
- Put reusable controls under `src/components/atoms/*`; feature composites under `src/components/<feature>/*`. One component per file.
- Memoise only with a reason — see the "Component Architecture" section in `docs/standards/ui-ux-standards.md` for the full rules and refactor triggers.

## Recommended Claude Subagents

Three-lane dev breakdown. Lanes are ownership defaults — coordinate before crossing. Full role prompts live in `.claude/agents/*.md`; per-lane detail in `docs/agents/subagents.md`; canonical breakdown in `docs/refactor/2026-05-09-llm-turn-decision.md` §13.

- `accessibility-voice-agent` — **Dev A.** Orchestration & agent pipeline (STT with language detection, classifier LLM, main LLM, translate, TTS, KV reset, `POST /turn` handler) plus kiosk frontend UX. **Does not touch tool implementations** — invokes them via `registry.invokeTool(...)` only.
- `hazard-admin-agent` — **Dev B.** `generateReceipt` + `reportHazard` tools, the bilingual HTML receipt render at `GET /receipts/:id`, and the **external integration adapters** (printer, email) for receipt and hazard delivery. Demo may stub the external call; the seam must exist.
- `map-discovery-agent` — **Dev C.** `signpost` tool, agency directory seed (15–25 entries incl. MP / RC / town council / hazard authorities), `AgencyContact` schema with wayfinding fields. NTH (Phase 5): map render layered on signpost results.
- `safety-demo-agent` — **topic helper, no fixed lane.** End-to-end demo orchestration, scripted-fallback safety net, pre-warm checklist. Picked up by whoever's blocked or near demo time.

## Claude Hook Policy

Hooks should be used for guardrails, not heavy automation. Use repository hooks in `.githooks/` for git-level checks. If configuring Claude Code hooks, mirror the same checks:

- Block commits with obvious secrets (Cloudflare API keys, SEALion keys, agency keys, or any residual Supabase keys).
- Remind agents to update docs when data contracts change. Schema drift between the refactor spec and the code is the most common source of integration breakage.

## Response Style

- Lead with blockers and decisions.
- Keep status updates brief.
- Use exact file paths when referencing changed files.
