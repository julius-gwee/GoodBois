---
name: care-access-map
description: Use when working on Care Access Map, an eldercare accessibility map for Singapore caregivers, seniors, volunteers, and frontline staff.
---

# Care Access Map Skill

Use this skill for any product, design, code, data, demo, or documentation task in this repository.

## Read First

1. `AGENTS.md`
2. `docs/START_HERE_FOR_NEW_AGENTS.md`
3. `docs/care-access-map-prd-and-backlog.md`
4. `docs/standards/product-principles.md`
5. `docs/standards/data-contracts.md`
6. `docs/system-design/architecture.md`

## Product Guardrails

- This is a care-access layer, not a generic map replacement.
- Do not claim official dispatch, emergency monitoring, or guaranteed route safety.
- Use verification/confidence labels for accessibility and hazard claims.
- Keep elderly mode simple and caregiver mode operational.
- Keep route safety pings opt-in and time-bound.

## Implementation Guardrails

- Use latitude/longitude as canonical coordinates.
- Keep map, voice, transport, notification, and export logic behind adapters.
- Seed data should look like production data.
- Every MVP feature should be visible in the demo scenario.
- Update `docs/standards/data-contracts.md` before changing shared object shapes.

## Task Start Checklist

- Identify the workstream: map, admin, UX/voice, safety/demo, or shared.
- State the files you will touch.
- Check current git status.
- Avoid editing another workstream's files without coordination.

## Done Checklist

- Feature is reachable in demo flow.
- Relevant docs updated.
- Mobile/elderly UX considered.
- No unsupported product claims.
- Tests/lint/manual verification run where available.
