# Git Workflow

## Branching

Use short branches by lane:

- `codex/voice-kiosk` — `accessibility-voice-agent` (voice pipeline + kiosk UX)
- `codex/tools-cases` — `hazard-admin-agent` (Worker tools, cases, receipt, export)
- `codex/map-discovery` — `map-discovery-agent` (NTH map + wheelchair routing)
- `codex/demo-orchestration` — `safety-demo-agent` (demo + route safety NTH)

For Claude or human devs, the prefix may differ, but keep the lane name:

- `claude/voice-kiosk`
- `dev/tools-cases`

## Commit Frequency

Commit after each coherent slice:

- Data contract added.
- Worker tool returns valid JSON.
- Kiosk shell renders.
- D1 migration applied.
- Receipt PDF generated.
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
- `epic`

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
- Demo seed data added for visible features.
- Kiosk display resolution and idle reset checked for user-facing UI.
- No secrets or personal data (Cloudflare API keys, SEALion keys, residual Supabase keys).
- Known gaps written in PR description.

## Conflict Resolution

1. Identify owner lane for the conflicted file.
2. Preserve both behaviors if they serve different lanes.
3. If conflict is in shared contract, update docs first.
4. Re-run the affected kiosk flow.

## File Ownership Shortcut

- `docs/standards/data-contracts.md`: all lanes, coordinate before editing.
- `docs/standards/ui-ux-standards.md`: `accessibility-voice-agent` primary, all lanes follow.
- `docs/system-design/tech-stack.md`: SSOT for stack and architecture rules; coordinate before editing.
- `docs/system-design/*`: all lanes, update when architecture changes.
- `docs/hackathon/*`: `safety-demo-agent` primary during demo integration.
- `workers/migrations/*`: `hazard-admin-agent` primary; coordinate any cross-lane schema change.
