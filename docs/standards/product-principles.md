# Product Principles

## Product Promise

Care Access Map helps caregivers, seniors, volunteers, and frontline staff find practical verified accessibility support faster.

The product does not promise perfect routing, official hazard closure, emergency response, clinical monitoring, or guaranteed transport availability.

## MVP Positioning

Use this sentence consistently:

> Care Access Map is a community-maintained operational map for eldercare access, starting with wheelchair-friendly journeys, hazard-aware route notes, voice-enabled search, caregiver handoff, and opt-in safety pings.

Avoid these descriptions:

- Google Maps for elderly people.
- Grab for wheelchair users.
- Government dispatch system.
- Emergency wandering prevention.
- AR navigation for seniors.
- All-in-one caregiver superapp.

## MVP Features

The hackathon MVP includes:

- Custom elderly-friendly map and list interface using OneMap-compatible coordinates.
- Seeded resources for one realistic neighbourhood or care journey.
- Resource details with accessibility notes and verification status.
- Submission/report issue flow.
- Hazard and maintenance reporting with admin review and structured export.
- Elderly/caregiver UI mode switch.
- Voice search and basic spoken guidance with fallback controls.
- Grab deep-link or copyable pickup/drop-off handoff.
- Opt-in route deviation safety ping demo.
- Shareable route/resource cards.

## Future Extensions

Keep these out of MVP implementation unless explicitly re-scoped:

- Government dispatch or work-order integration.
- Formal Grab API integration, transport vouchers, or commercial partnership flow.
- Google Street View live AR directions.
- Official Waze/Google/OneMap route engine integration for hazard avoidance.
- Live restroom occupancy.
- Real-time equipment availability.
- Clinical or emergency monitoring.

## Trust Language

Use concrete confidence labels:

- `Verified`
- `Community submitted`
- `Needs recheck`
- `Active hazard`
- `Resolved`
- `Unknown`

Prefer:

- "Reported blocked ramp, not yet verified."
- "Verified by community partner on 2026-05-01."
- "Call ahead for critical trips."

Avoid:

- "Safe route guaranteed."
- "Government has been notified."
- "This route prevents wandering."
- "Grab will provide an accessible vehicle."

## Safety Ping Copy Rules

Safety pings are caregiver check-in prompts.

Required copy ideas:

- "This is not emergency monitoring."
- "Location sharing ends when the route session ends."
- "Only start this with consent from the person being supported."
- "If there is immediate danger, contact emergency services."

## Hazard Report Rules

- Community reports must be visibly distinct from verified/official reports.
- Hazards can lower route confidence, but should not silently remove options.
- Exports prepare reports for future routing to agencies or venue operators; exports do not mean dispatch happened.

## Demo Success Definition

The demo should show one complete story:

1. Search destination by text or voice.
2. Switch elderly/caregiver mode.
3. Select accessible pickup/drop-off.
4. See route notes and hazard warning.
5. Open Grab handoff or copy driver instructions.
6. Start route safety session.
7. Submit hazard report.
8. Admin reviews and exports report.
