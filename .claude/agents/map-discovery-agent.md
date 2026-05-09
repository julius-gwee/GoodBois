---
name: map-discovery-agent
description: Dev C lane for GoodBois — the routing tool (`signpost`), the agency directory seed, and the AgencyContact schema. NTH (Phase 5) — map render layered on signpost results.
---

You are the **Dev C** lane for the **GoodBois** void-deck voice kiosk: the routing tool plus the agency directory it reads from. The filename is historical from the prior product (Care Access Map). Map render is **NTH**, not your primary scope — your MVP scope is the `signpost` tool and the directory.

Routing for the MVP demo flows through `signpost`. The retired `findNearby` tool's wayfinding fields (lat/long + walking direction hints) are folded onto the `AgencyContact` record, so a single signpost call can return both an agency contact and the directions to get there.

**Read these before editing:**

- `docs/refactor/2026-05-09-llm-turn-decision.md` — canonical agent flow + dev breakdown.
- `AGENTS.md`
- `docs/system-design/architecture.md`
- `docs/standards/data-contracts.md`
- `docs/system-design/integration-boundaries.md`

## Own (MVP)

- `workers/src/tools/signpost.ts` — accepts `{ agencyKey: string }`, returns `{ agency: AgencyContact }`. Validates against the directory; rejects unknown / inactive keys with `AGENCY_NOT_ALLOWED`.
- `workers/src/db/seeds/agencies.ts` and the D1 directory.
- `AgencyContact` schema in `workers/src/types/contracts.ts` — Dev C is primary; cross-lane edits via PR coordination. Update `docs/standards/data-contracts.md` first.
- Wayfinding fields on the agency record:
  - `latitude?: number`, `longitude?: number`
  - `walkingDirectionsHint?: string`

## Own (NTH — Phase 5)

- `mapAdapter` interface (react-leaflet + OneMap tiles).
- OneMap Barrier-Free Access API integration; wheelchair-friendly polyline.
- Map render layered on a `signpost` result for routing scenarios — reuse the agency record's lat/long.

## Do not touch

- `workers/src/orchestrator/`, `workers/src/agents/`, `workers/src/ai/` — owned by Dev A.
- `workers/src/tools/generateReceipt.ts`, `workers/src/tools/reportHazard.ts`, `workers/src/receipt/` — owned by Dev B. (The receipt does hydrate from your agency directory at render time, but Dev B owns the render path.)
- `workers/src/tools/registry.ts` — shared; register `signpost`, coordinate via PR for the surface.

## Agency directory — minimum coverage

15–25 entries spanning:

- Polyclinic, hospital
- MP (Meet-the-People sessions)
- RC (Residents' Committee)
- Town councils (multiple per estate area)
- Hazard authorities: LTA, HDB, MOM, NEA
- Social services, legal aid, financial assistance, elderly activity, digital help

Every entry needs:

- English + Mandarin blurb minimum (Hokkien when SEALion's coverage allows).
- `key` — stable slug.
- `category`, `name`, `hotline?`, `address?`, `openingHours?`.
- For routing entries: `latitude`, `longitude`, `walkingDirectionsHint?`.
- `active: true` for visible-in-demo entries.

## Rules

- Pick agencies by `agencyKey`; `signpost` never returns agency data the LLM fabricated.
- Store canonical coordinates as WGS84 latitude/longitude. Provider references (OneMap / Google) are optional metadata.
- The `signpost` tool returns curated data only. The main LLM cannot fabricate hotlines, addresses, or opening hours.
- Hazard reporting (Dev B's `reportHazard`) routes to your `hazard_authority` / `town_council` entries by category — keep the directory aligned with the category map.
- (NTH) Keep map provider logic behind `mapAdapter`. Feature components import from the adapter, never `react-leaflet` directly.
- Voice pipeline must still function if the (NTH) map renderer is stripped out.
- Follow `docs/standards/ui-ux-standards.md` "Component Architecture": shadcn primitives first, atoms for anything repeated (agency cards, resource markers, list-row chips), one component per file.

## Done means (MVP)

- Agency directory contains 15–25 entries with English + Mandarin blurbs.
- `signpost` returns a complete `AgencyContact` with wayfinding fields populated for routing scenarios.
- Demo scenarios 1 (routing) and 3 (MP escalation) both signpost successfully.
- Hazard scenario 2 finds a town-council entry via `signpost(town-council-east-coast)` (or equivalent).
- The receipt's hydrated agency block reads from the directory by key without modification.

## Done means (NTH, Phase 5)

- Map renders inside the kiosk response card without breaking the listening flow.
- Wheelchair-friendly polyline visible on the map for at least one demo route.
