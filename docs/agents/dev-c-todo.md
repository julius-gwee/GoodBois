# Dev C — Concrete TODO

**Lane:** `signpost` tool, agency directory, `AgencyContact` schema.
**Subagent helper:** `.claude/agents/map-discovery-agent.md`
**Canonical spec:** `docs/refactor/2026-05-09-llm-turn-decision.md` (read §4 `signpost`, §13 Dev C section).

This file lists what's left given the current state of the code (verified 2026-05-10). Tick items off as you land them.

---

## Current state

- `workers/src/tools/signpost.ts` — exists, validates `agencyKey` against directory, throws `AGENCY_NOT_ALLOWED` for unknown/inactive.
- `workers/src/db/seeds/agencies.ts` — **18 entries** (target 15–25, on count).
- `AgencyContact` type in `workers/src/types/contracts.ts:24-36` — has `key`, `name`, `hotline?`, `address?`, `url?`, `openingHours?`, `category`, `multilingualBlurb`, `active`, `source`, `updatedAt`. **Wayfinding fields missing** (`latitude?`, `longitude?`, `walkingDirectionsHint?`).
- Categories present: `housing`, `transport`, `healthcare`, `social_services`, `legal`, `financial_assistance`, `elderly_activity`, `digital_help`, `mp_meet_the_people`, `rc_visit`. **Missing: `town_council`, hazard-authority entries** (LTA & HDB exist as customer-service entries; not framed as hazard authorities).

---

## 1. Add wayfinding fields to `AgencyContact`

Coordinate with Dev A and Dev B. Update `docs/standards/data-contracts.md` first.

- [ ] Extend `AgencyContact` in `workers/src/types/contracts.ts`:
  ```ts
  latitude?: number;
  longitude?: number;
  walkingDirectionsHint?: string;
  ```
- [ ] These are folded in from the retired `findNearby` tool. Use WGS84.

## 2. Extend the directory

Aim: 15–25 entries spanning every lane the spec mentions. Currently missing:

- [ ] **Town councils** — at least 2–3 entries (per estate area). New `AgencyCategory`: `town_council`.
  - Examples: `town-council-east-coast`, `town-council-tampines`, `town-council-bedok`.
- [ ] **Hazard authorities** — explicit entries (in addition to existing customer-service hotlines):
  - LTA hazard reporting (potholes/road)
  - HDB hazard reporting (lifts, ceilings, common areas)
  - MOM (workplace hazards) — new category if you don't fold under `legal`.
  - NEA (rubbish, pest, hawker hygiene) — new category or fold under existing.
  - Consider a `hazard_authority` category to make Dev B's routing target clear.
- [ ] Populate `latitude`, `longitude`, `walkingDirectionsHint` on **routing entries** (polyclinic, hospital, town council, RC, MP, active ageing centre). Leave national hotlines unpopulated (no physical location to walk to).

## 3. Update `AgencyCategory` union

- [ ] Add `town_council` and `hazard_authority` (or whatever you settle on) to the `AgencyCategory` union in `workers/src/types/contracts.ts`.
- [ ] Update any seed/test code that exhaustively switches on the category.

## 4. Verify `signpost` returns the new fields

- [ ] `signpost(agencyKey)` already returns the full `AgencyContact`, so wayfinding fields propagate automatically once they exist on the record. Add a test that asserts wayfinding fields are returned for a routing entry.

## 5. Multilingual blurbs

- [ ] All entries need `en` + `zh-Hans` minimum. Add `nan-Hant` (Hokkien) where SEALion's coverage allows.

## 6. NTH (Phase 5) — Map render

Defer until MVP demo is locked.

- [ ] `mapAdapter` interface — react-leaflet + OneMap tiles.
- [ ] OneMap Barrier-Free Access API integration; wheelchair-friendly polyline.
- [ ] Map render layered on `signpost` results, reusing the agency record's lat/long.

---

## Coordination

### Hazard routing — seam with Dev B

Dev B's `reportHazard` returns `routedTo`. Currently a category slug (`town-council`, `lta`, etc.). The canonical convention (per spec §8.2 example) is an `AgencyContact.key` from your directory.

- Land the convention with Dev B before they promote `reportHazard` from stub.
- Ensure each hazard category Dev B can emit has a matching directory entry.
- Your directory is canonical — Dev B's category-to-key map references your keys.

### `AgencyContact` schema — seam with Dev A and Dev B

You're primary on the schema. When extending it (wayfinding fields, new categories):
1. Update `docs/standards/data-contracts.md`.
2. PR-coordinate with Dev A (orchestrator hydration) and Dev B (receipt hydration).
3. Land the schema change before consumers depend on the new fields.
