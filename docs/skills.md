# Local Skills

## Codex Skill

Path:

```txt
.codex/skills/care-access-map/SKILL.md
```

Use this skill for any Care Access Map task. It points agents to product guardrails, data contracts, and the shared architecture.

## Claude Compatibility

Claude Code does not use Codex skills directly. Use:

- `CLAUDE.md`
- `.claude/agents/*.md`
- `AGENTS.md`

The content mirrors the Codex skill so both tools follow the same product rules.

## Recommended Invocation

Before starting a task, agents should identify:

- Workstream.
- Files they expect to touch.
- Shared contracts involved.
- Verification plan.

## Skill Maintenance

Update the local skill when:

- Product positioning changes.
- MVP/future-extension boundary changes.
- Shared data contracts change.
- New mandatory verification steps are added.
