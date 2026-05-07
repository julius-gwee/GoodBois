# Hackathon MVP Execution Plan

## Target Demo

Show Mei planning a wheelchair-accessible hospital/community trip:

1. Search by voice or text.
2. See resources on custom elderly-friendly map and list.
3. Switch elderly/caregiver mode.
4. Select accessible pickup/drop-off.
5. See route notes and active hazard warning.
6. Open Grab handoff or copy driver note.
7. Start opt-in route safety session.
8. Submit blocked ramp hazard.
9. Admin reviews and exports hazard report.

## Build Order

### Phase 1: Shared Foundation

- Create app scaffold.
- Add shared data contracts.
- Add seed resources, hazards, and demo route.
- Render static app shell.

### Phase 2: Parallel Lanes

- Dev A: map/list/search/filter.
- Dev B: resource detail, hazard form, admin review/export.
- Dev C: elderly/caregiver mode, voice search, accessibility pass.
- Dev D: Grab handoff, route safety ping demo, end-to-end demo script.

### Phase 3: Integration

- Connect map/list to resource detail.
- Connect hazards to map/list/detail status.
- Connect route safety to selected route.
- Connect Grab handoff to pickup/drop-off resource.
- Run full demo flow.

### Phase 4: Demo Hardening

- Add seed data that makes every feature visible.
- Polish mobile view.
- Add clear empty/error states.
- Remove broken controls.
- Freeze scope.

## Minimum Seed Data

- 5 accessible restrooms.
- 4 accessible pickup/drop-off points.
- 4 equipment loan/rental points.
- 4 form-filling/digital help points.
- 3 caregiver waiting spots.
- 4 hazards across `pending`, `active`, `resolved`, `needs_recheck`.
- 2 sample routes.
- 1 route deviation session.
- 1 Grab handoff example.

## Demo Cut Rules

If time is tight, keep:

- Map/list.
- Resource details.
- Hazard report/admin/export.
- Elderly/caregiver mode.
- Grab copy fallback.
- Simulated route safety ping.

Cut or simplify:

- Live geolocation.
- Real voice synthesis.
- Complex routing.
- PDF export.
- Partner profiles.

## End-of-Day Checklist

- Full flow works on one machine.
- Data is seeded, not dependent on live external services.
- No obvious console errors.
- Mobile width is usable.
- Demo script is rehearsed.
