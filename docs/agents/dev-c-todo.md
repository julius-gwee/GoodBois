# Dev C Concrete TODO

**Lane:** `signpost` tool, agency directory, `AgencyContact` wayfinding, and NTH map rendering.
**Subagent helper:** `.claude/agents/map-discovery-agent.md`
**Canonical spec:** `docs/refactor/2026-05-09-llm-turn-decision.md` and `docs/standards/data-contracts.md`.

This file tracks Dev C work after the 2026-05-10 `main` merge and the Bukit Merah beachhead pivot.

---

## Current State

- `workers/src/tools/signpost.ts` validates `agencyKey` against the directory and rejects unknown/inactive agencies.
- `workers/src/tools/registry.ts` remains locked to the three MVP LLM tools: `signpost`, `reportHazard`, `generateReceipt`.
- `/resources` and `/routes` are map UI endpoints, not LLM tools.
- `AgencyContact` includes optional WGS84 `latitude`, `longitude`, and `walkingDirectionsHint` fields.
- `AgencyCategory` includes `town_council` and `hazard_authority`.
- Agency seeds include routeable Queenstown/Bukit Merah entries, MPS, RC, polyclinic, ServiceSG, town council, and hazard-authority records.
- Map resources link to official agency records with `linkedAgencyKey` where there is a direct agency relationship.
- The kiosk origin is Blk 3 Jalan Bukit Merah, Singapore 150003.

---

## Completed In `juliusc/dev-c`

- [x] Extend Worker and frontend `AgencyContact` types with wayfinding fields.
- [x] Extend Worker and frontend `AgencyCategory` with `town_council` and `hazard_authority`.
- [x] Seed routeable Dev C agencies:
  - `queenstown_smc_mps`
  - `thong_kheng_aac_queenstown`
  - `hock_san_zone_rc`
  - `servicesg_bukit_merah`
  - `bukit_merah_polyclinic`
  - `bukit_merah_community_centre`
  - `tanjong_pagar_town_council`
- [x] Verify `signpost` returns wayfinding fields.
- [x] Update frontend and Worker map fixtures to Bukit Merah resources with `linkedAgencyKey`.
- [x] Use OneMap BFA endpoint for wheelchair routes first.
- [x] Use OneMap public route endpoint for walking and driving.
- [x] Fall back from BFA to OneMap public walking, then seeded fixture routes.
- [x] Preserve honest provider metadata while showing friendly UI copy such as `Demo route`.
- [x] Fit the map viewport to origin, destination, and route polyline with panel-aware padding.
- [x] Keep print preview, language switching, and route source labels in the directions panel.
- [x] Return a controlled `/routes` error for unknown destination resources.

---

## Remaining Manual Checks

- [ ] Run Worker and frontend together.
- [ ] Open `/map`.
- [ ] Select a Bukit Merah place.
- [ ] Verify wheelchair, walk, and drive tabs.
- [ ] Confirm the route line is visible and the map fits the whole route.
- [ ] Confirm the source label remains visible in `DirectionsPanel`.
- [ ] Confirm print preview still renders after switching languages.
- [ ] Repeat once with valid OneMap credentials if the team has them.

---

## Coordination Notes

- Dev B hazard routing should use `AgencyContact.key` for `routedTo` values.
- Hazard categories emitted by `reportHazard` should map to a seeded `hazard_authority` or `town_council` agency.
- New routeable places should add `AgencyContact` wayfinding fields first, then link map resources through `linkedAgencyKey`.
