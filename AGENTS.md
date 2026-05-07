# Care Access Map Agent Guide

This file is the shared operating manual for Codex, Claude Code, and human developers working on Care Access Map.

## Project Context

Care Access Map is a hackathon MVP for a Singapore eldercare/accessibility map. It is not a generic navigation app. The core value is a verified care-access layer: accessible restrooms, pickup/drop-off points, equipment loan/rental, form-filling help, caregiver waiting spots, hazards, route notes, and caregiver safety support.

Read first:

1. `docs/START_HERE_FOR_NEW_AGENTS.md`
2. `docs/care-access-map-prd-and-backlog.md`
3. `docs/standards/product-principles.md`
4. `docs/system-design/architecture.md`
5. `docs/agents/team-operating-model.md`

## Non-Negotiables

- Keep the MVP demoable. Prefer a working vertical slice over broad unfinished coverage.
- Do not position the product as Google Maps, Grab, government dispatch, clinical monitoring, or emergency response.
- Every user-facing route/accessibility claim must show confidence, verification, or uncertainty.
- Do not collect medical details. Route deviation pings must be opt-in, time-bound, and easy to stop.
- Keep map provider usage isolated. Store canonical locations as latitude/longitude.
- Avoid map-only UX. Every key map result must also be readable in list/detail form.
- Use elderly-friendly UI defaults: large text, clear labels, high contrast, low clutter.
- Do not break another dev's work. Check status before editing and keep ownership boundaries tight.

## Four-Dev Workstreams

Use these ownership lanes unless the team explicitly changes them:

1. **Dev A: Map and Discovery**
   - Map/list shell, OneMap-compatible coordinates, resource markers, search, filters.
   - Primary docs: `docs/system-design/architecture.md`, `docs/standards/data-contracts.md`.

2. **Dev B: Resource, Hazard, and Admin Workflow**
   - Resource detail, submission/report issue, hazard review, CSV/JSON export.
   - Primary docs: `docs/standards/data-contracts.md`, `docs/standards/product-principles.md`.

3. **Dev C: Elderly/Caregiver UX, Voice, and Accessibility**
   - Mode switching, voice search/guidance, responsive accessibility polish.
   - Primary docs: `docs/standards/ui-ux-standards.md`.

4. **Dev D: Route Safety, Grab Handoff, Demo Integration**
   - Opt-in route deviation ping demo, Grab deep link/copy fallback, end-to-end demo scenario.
   - Primary docs: `docs/system-design/architecture.md`, `docs/hackathon/mvp-execution-plan.md`.

## Working Rules

- Start each task by stating which files you intend to touch.
- Keep PRs/commits scoped to one workstream or one vertical slice.
- If you need to touch another lane's file, coordinate in the team chat first.
- Use typed/shared data contracts instead of inventing duplicate object shapes.
- Prefer seeded/mock data for hackathon speed, but structure it like production data.
- Add demo data deliberately: every feature needs visible seeded examples.
- Use feature flags or mock adapters for incomplete external integrations.

## Expected Verification

Before saying a task is done:

- Run the relevant lint/type/test command if the app stack exists.
- Manually verify the user flow in browser when UI is touched.
- Check mobile width for any elderly-facing UI.
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

- `feat: add hazard report review workflow`
- `docs: add team operating model`
- `bugfix: preserve elderly mode on refresh`

## Tool Compatibility Notes

Codex and Claude can both follow this file. Tool-specific files may also exist:

- Codex: `.codex/skills/care-access-map/SKILL.md`
- Claude: `CLAUDE.md`, `.claude/agents/*.md`

When instructions conflict, follow the most specific project file for the tool you are currently using, then this file, then general model defaults.
