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

The four-dev lane split was scrapped on 2026-05-09. The subagents below are **topic helpers** — invoke them when work touches a particular surface area, not as ownership boundaries. Full role prompts live in `.claude/agents/*.md`; per-topic summaries in `docs/agents/subagents.md`.

- `accessibility-voice-agent`: kiosk voice / AI pipeline (STT with language detection, classifier LLM, main LLM, TTS, translate), orchestrator (six-stage flow + retry guard + KV reset), kiosk frontend UX.
- `hazard-admin-agent`: tool registry (`signpost`, `reportHazard` stub, `generateReceipt`), agency directory seed (incl. MP / RC / town council / hazard authorities), bilingual HTML receipt render.
- `map-discovery-agent`: NTH lane — resource discovery + map render + OneMap Barrier-Free routing.
- `safety-demo-agent`: end-to-end demo orchestration, scripted-fallback safety net, pre-warm checklist; route safety / Grab handoff (NTH low priority).

## Claude Hook Policy

Hooks should be used for guardrails, not heavy automation. Use repository hooks in `.githooks/` for git-level checks. If configuring Claude Code hooks, mirror the same checks:

- Block commits with obvious secrets (Cloudflare API keys, SEALion keys, agency keys, or any residual Supabase keys).
- Remind agents to update docs when data contracts change. Schema drift between the refactor spec and the code is the most common source of integration breakage.

## Response Style

- Lead with blockers and decisions.
- Keep status updates brief.
- Use exact file paths when referencing changed files.
