# Git Workflow

## Branching

Use short branches by lane:

- `codex/map-discovery`
- `codex/hazard-admin`
- `codex/accessibility-voice`
- `codex/safety-demo`

For Claude or human devs, the prefix may differ, but keep the lane name:

- `claude/map-discovery`
- `dev/hazard-admin`

## Commit Frequency

Commit after each coherent slice:

- Data contract added.
- UI shell renders.
- Form submits.
- Export works.
- Demo flow verified.

Avoid huge end-of-day commits.

## Commit Message Format

Use:

```txt
category: concise summary
```

Categories:

- `feat`
- `bugfix`
- `docs`
- `chore`
- `test`
- `refactor`

## Before Pulling or Merging

Run:

```powershell
git status --short
```

If you have local changes:

- Commit them if coherent.
- Stash only if you know exactly why.
- Do not reset or checkout over another dev's work.

## PR / Merge Checklist

- Scope matches one lane or one vertical slice.
- Shared data contracts updated if needed.
- Demo data added for visible features.
- Mobile flow checked for user-facing UI.
- No secrets or personal data.
- Known gaps written in PR description.

## Conflict Resolution

1. Identify owner lane for the conflicted file.
2. Preserve both behaviors if they serve different lanes.
3. If conflict is in shared contract, update docs first.
4. Re-run the affected flow.

## File Ownership Shortcut

- `docs/standards/data-contracts.md`: all lanes, coordinate before editing.
- `docs/standards/ui-ux-standards.md`: Dev C primary, all lanes follow.
- `docs/system-design/*`: all lanes, update when architecture changes.
- `docs/hackathon/*`: Dev D primary during demo integration.
