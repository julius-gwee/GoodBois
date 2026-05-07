# Four-Agent Team Operating Model

## Goal

Let four developers and multiple AI agents work concurrently without duplicating work or breaking each other's changes.

## Workstream Ownership

| Lane | Owner | Scope | Primary Files |
| --- | --- | --- | --- |
| A | Map and Discovery | Map shell, list view, search, filters, coordinates, route overlays | `src/features/map/*`, `src/features/search/*`, `src/data/seed/*` |
| B | Resource and Admin | Resource details, submission, hazard reports, admin review, export | `src/features/resources/*`, `src/features/admin/*`, `src/lib/export/*` |
| C | UX, Voice, Accessibility | Elderly/caregiver mode, voice search, spoken prompts, responsive polish | `src/features/modes/*`, `src/features/voice/*`, `src/styles/*` |
| D | Safety and Demo | Route deviation ping, Grab handoff, demo scenario, integration glue | `src/features/safety/*`, `src/features/transport/*`, `src/demo/*` |

The `src/*` paths are target paths for implementation. If the final framework uses a different structure, preserve the same ownership boundaries.

## Daily Hackathon Rhythm

1. **Start sync, 10 minutes**
   - Each dev states target outcome, files owned, and blockers.

2. **Build block, 90-120 minutes**
   - Work on separate lanes.
   - Commit small changes.
   - Update contracts before dependent UI.

3. **Integration checkpoint, 20 minutes**
   - Pull latest.
   - Resolve interface mismatches.
   - Verify one end-to-end demo path.

4. **Demo hardening**
   - Freeze new scope.
   - Only fix bugs, seed data, copy, and visual clarity.

## Coordination Rules

- If a change affects shared data shape, update `docs/standards/data-contracts.md` first.
- If a change affects positioning or claims, update `docs/standards/product-principles.md`.
- If a change affects UI patterns, update `docs/standards/ui-ux-standards.md`.
- If two lanes need the same file, pair briefly and split the file by responsibility.

## Handoff Format

Use this in chat or PR descriptions:

```md
Lane:
Files changed:
Behavior changed:
How to verify:
Known gaps:
Needs from other lanes:
```

## Integration Priorities

1. Map/list shows seeded resources.
2. Resource detail opens from both map and list.
3. Hazard report can be submitted, reviewed, and exported.
4. Elderly/caregiver mode changes the same real UI.
5. Voice search fills the same search box as typed search.
6. Grab handoff uses the same pickup/drop-off data.
7. Safety ping demo uses the same route model.
