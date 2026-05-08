# Claude Code Instructions

Read `docs/START_HERE_FOR_NEW_AGENTS.md` and `AGENTS.md` first. This file only adds Claude-specific compatibility guidance.

## Project Behavior

- Treat `AGENTS.md` as the shared source of truth for all AI agents.
- Use `.claude/agents/*.md` as role prompts when delegating to Claude subagents.
- Keep edits small and scoped. Do not rewrite files owned by another lane unless asked.
- Prefer Markdown docs and typed source files over ad hoc notes.

## UI Component Rules

shadcn is installed (`src/components/ui/*`, `@/lib/utils` for `cn()`, neutral base color, lucide icons). When building UI:

- Add primitives with `npx shadcn@latest add <name>`. Do not hand-roll a button, input, dialog, switch, or slider.
- Put reusable controls under `src/components/atoms/*`; feature composites under `src/components/<feature>/*`. One component per file.
- Memoise only with a reason — see the "Component Architecture" section in `docs/standards/ui-ux-standards.md` for the full rules and refactor triggers.

## Recommended Claude Subagents

- `map-discovery-agent`: map/list/search/filter work.
- `hazard-admin-agent`: resource detail, reports, admin review, export.
- `accessibility-voice-agent`: elderly/caregiver UX, voice, accessibility.
- `safety-demo-agent`: route deviation ping, Grab handoff, demo flow.

## Claude Hook Policy

Hooks should be used for guardrails, not heavy automation. Use repository hooks in `.githooks/` for git-level checks. If configuring Claude Code hooks, mirror the same checks:

- Block commits with obvious secrets.
- Warn on edits to another workstream's files.
- Remind agents to update docs when data contracts change.

## Response Style

- Lead with blockers and decisions.
- Keep status updates brief.
- Use exact file paths when referencing changed files.
