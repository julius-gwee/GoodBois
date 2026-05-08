# Local Skills

## Codex Skill

Path:

```txt
.codex/skills/care-access-map/SKILL.md
```

Use this skill for any GoodBois task. It points agents to product guardrails, data contracts, and the shared architecture.

> The skill folder name `care-access-map` predates the 2026-05-09 pivot. The product is now **GoodBois**, a void-deck voice kiosk for elderly residents. The folder name is preserved to avoid breaking inbound references.

## Claude Compatibility

Claude Code does not use Codex skills directly. Use:

- `CLAUDE.md`
- `.claude/agents/*.md`
- `AGENTS.md`

The content mirrors the Codex skill so both tools follow the same product rules.

## Recommended Invocation

Before starting a task, agents should identify:

- Workstream (voice/kiosk UX, tools/cases/export, map/discovery NTH, demo orchestration).
- Files they expect to touch.
- Shared contracts involved.
- Verification plan (kiosk demo step it changes).

## Skill Maintenance

Update the local skill when:

- Product positioning changes.
- MVP / NTH / future-extension boundary changes.
- Shared data contracts change.
- New mandatory verification steps are added.
- Stack or architecture rules in `docs/system-design/tech-stack.md` change.
