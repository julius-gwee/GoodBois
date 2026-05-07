# Subagent Definitions

Use these as portable role prompts for Codex subagents, Claude subagents, or human task assignment.

## map-discovery-agent

**Mission:** Build and protect the map/search/discovery lane.

**Owns:**

- Map/list shell.
- OneMap-compatible coordinates.
- Resource markers.
- Search and filters.
- Route overlays and hazard visibility.

**Must read:**

- `AGENTS.md`
- `docs/system-design/architecture.md`
- `docs/standards/data-contracts.md`

**Do not touch without coordination:**

- Admin review flows.
- Voice implementation internals.
- Route safety alert rules.

**Completion checklist:**

- Map and list show the same filtered resources.
- UI does not depend on map-only interaction.
- Coordinates are plain latitude/longitude in shared types.
- Hazard status is visible without overclaiming official closure.

## hazard-admin-agent

**Mission:** Build and protect resource quality, hazard reporting, and admin workflows.

**Owns:**

- Resource details.
- Submission and issue report forms.
- Hazard/maintenance reports.
- Admin review states.
- CSV/JSON export.

**Must read:**

- `AGENTS.md`
- `docs/standards/data-contracts.md`
- `docs/standards/product-principles.md`

**Do not touch without coordination:**

- Map rendering internals.
- Voice UX.
- Safety ping location logic.

**Completion checklist:**

- Reports have status, severity, coordinates, and timestamps.
- Export includes stable field names.
- Unverified reports are labelled clearly.
- Admin can mark reports active/resolved/rejected/duplicate/needs recheck.

## accessibility-voice-agent

**Mission:** Make the product usable for seniors, caregivers, low-vision users, and users who cannot type comfortably.

**Owns:**

- Elderly/caregiver mode.
- Voice search.
- Spoken guidance prompts.
- Accessibility and responsive UI standards.

**Must read:**

- `AGENTS.md`
- `docs/standards/ui-ux-standards.md`
- `docs/standards/product-principles.md`

**Do not touch without coordination:**

- Shared data models.
- Admin export logic.
- Route deviation threshold logic.

**Completion checklist:**

- Every voice action has a touch/text fallback.
- Elderly mode genuinely reduces complexity.
- Text does not overflow at mobile widths.
- Buttons have clear labels and accessible names.

## safety-demo-agent

**Mission:** Build the demo-critical safety and transport handoff layer.

**Owns:**

- Opt-in route deviation safety ping.
- Grab deep-link or copy fallback.
- Demo scenario stitching.
- Seeded demo route sessions.

**Must read:**

- `AGENTS.md`
- `docs/system-design/architecture.md`
- `docs/hackathon/mvp-execution-plan.md`

**Do not touch without coordination:**

- Base map renderer.
- Hazard admin status machine.
- Voice transcription logic.

**Completion checklist:**

- Safety session is opt-in, visible, and easy to end.
- Ping copy does not imply emergency response.
- Grab fallback works without API access.
- Demo route uses the same route/resource contracts as the app.
