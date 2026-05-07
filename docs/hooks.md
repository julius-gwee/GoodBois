# Hooks

This repo includes lightweight git hooks in `.githooks/`.

## Install

Run from the repo root:

```powershell
powershell -ExecutionPolicy Bypass -File .githooks/install-hooks.ps1
```

## Hooks Included

### pre-commit

Checks:

- Blocks obvious staged secrets such as `apiKey = "..."`, `token = "..."`, or `password = "..."`.
- Warns when shared model/schema-looking files change without docs changes.

### commit-msg

Requires commit messages to start with:

- `feat:`
- `bugfix:`
- `docs:`
- `chore:`
- `test:`
- `refactor:`
- `epic:`

## Claude/Codex Compatibility

Codex and Claude should treat these hooks as repository guardrails. If a hook fails, fix the underlying issue rather than bypassing it during the hackathon.

## When to Add More Hooks

Add framework-specific hooks only after the app stack exists:

- Lint.
- Typecheck.
- Unit tests.
- Formatting.

Avoid slow hooks that block rapid hackathon iteration.
