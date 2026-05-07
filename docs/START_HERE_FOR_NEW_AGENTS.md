# Start Here for New Agents

This file preserves the important context from the setup conversation so a new Codex or Claude project can start inside `GoodBois` without losing product direction.

## Repository

- Local repo: `C:\Users\juliu\Documents\Uni\CS\Hackathons\GoodBois`
- GitHub repo: `https://github.com/julius-gwee/GoodBois`
- Visibility: public
- Base template: `https://github.com/pastchum/hackathon-template-with-database-backend`
- Stack from template: Next.js, TypeScript, Tailwind CSS, FastAPI, Supabase, Docker Compose.

## Hackathon Context

The team is building this for a hackathon referred to in discussion as GoodHack / the hackathon. The original problem framing is:

> How might we reduce manual and time-consuming tasks within the eldercare ecosystem so that more seniors are well-supported?

The team expects a four-developer setup with a mix of Codex and Claude. The repo includes cross-tool instructions, subagent prompts, product standards, hooks, and system design docs to support parallel work.

## Product Summary

Working product: **Care Access Map**.

Care Access Map is a community-maintained operational map for eldercare access in Singapore. It helps caregivers, seniors, wheelchair users, volunteers, and frontline staff find practical access information that is usually scattered across staff memory, WhatsApp chats, mall pages, old PDFs, and word-of-mouth.

The product is not trying to replace Google Maps, OneMap, Grab, or government dispatch. The value is a verified care-access layer on top of map coordinates:

- Accessible restrooms.
- Accessible pickup/drop-off points.
- Equipment loan/rental points.
- Form-filling and digital help points.
- Caregiver waiting spots.
- Hazard and maintenance reports.
- Route notes for wheelchair-friendly journeys.
- Caregiver handoff and safety support.

## Product Rationale

Caregivers do not only need to know where a hospital, mall, or community centre is. They need operational details:

- Which entrance has the usable ramp?
- Where can a wheelchair taxi stop safely?
- Which accessible toilet actually works?
- Is the lift down?
- Is the route sheltered?
- Where can someone get help with Singpass, vouchers, forms, QR codes, or appointments?
- Where can a caregiver wait while the senior attends SAC, clinic, or community activities?

Failed trips create stress, duplicated calls, delayed appointments, and more work for frontline staff. The app reduces repeated manual search by making practical local knowledge visible, verified, and maintainable.

## MVP Scope Agreed in Conversation

Include in MVP:

- Custom elderly-friendly map/list UI using OneMap-compatible coordinates.
- Voice activated search and basic spoken guidance, with text/touch fallback.
- Elderly/caregiver UI mode switch.
- Waze-style hazard and maintenance reporting.
- Admin review of hazard reports.
- Structured CSV/JSON hazard export for future routing to agencies, town councils, venue operators, or partners.
- Grab deep-link or copyable pickup/drop-off handoff.
- Opt-in route deviation safety ping for caregivers supporting seniors with dementia.
- Seeded demo data for one realistic neighbourhood or care journey.

Keep as future extensions:

- Government dispatch or work-order integration.
- Formal Grab API partnership, accessible vehicle API flow, vouchers, or payment.
- Google Street View or live AR directions.
- Official Waze/Google/OneMap route engine integration.
- Live restroom occupancy.
- Real-time equipment availability.
- Clinical or emergency monitoring.

## Positioning Guardrails

Say:

> Care Access Map is a community-maintained operational map for eldercare access, starting with wheelchair-friendly journeys, hazard-aware route notes, voice-enabled search, caregiver handoff, and opt-in safety pings.

Do not say:

- Google Maps for elderly people.
- Grab for wheelchair users.
- Government dispatch system.
- Emergency dementia monitoring.
- Guaranteed safe route.
- AR navigation for seniors.
- All-in-one caregiver superapp.

## Safety and Privacy Guardrails

- Safety pings are assistive caregiver check-ins, not emergency response.
- Route safety sessions must be opt-in, time-bound, visible, and easy to stop.
- Do not collect medical diagnosis or senior medical details.
- Do not store permanent route traces in MVP.
- Community hazard reports must be labelled as unverified unless reviewed.
- Exporting a hazard report does not mean an agency has been notified or dispatched.
- Photos should avoid identifiable people unless consent is handled.

## Four-Developer Workstreams

1. **Map and Discovery**
   - Map/list shell, OneMap-compatible coordinates, search, filters, route overlays.

2. **Resource, Hazard, and Admin**
   - Resource details, submissions, hazard reports, admin review, CSV/JSON export.

3. **Elderly/Caregiver UX, Voice, and Accessibility**
   - Mode switching, voice search, spoken guidance, responsive/accessibility polish.

4. **Route Safety, Grab Handoff, and Demo**
   - Opt-in route deviation ping, Grab handoff/copy fallback, end-to-end demo flow.

See `docs/agents/team-operating-model.md` and `docs/agents/subagents.md`.

## Recommended First Reads

For any new agent or developer:

1. `AGENTS.md`
2. `CLAUDE.md` if using Claude
3. `.codex/skills/care-access-map/SKILL.md` if using Codex
4. `docs/care-access-map-prd-and-backlog.md`
5. `docs/standards/product-principles.md`
6. `docs/standards/data-contracts.md`
7. `docs/system-design/architecture.md`
8. `docs/hackathon/mvp-execution-plan.md`

## Existing Setup Done

- Repo duplicated from template and renamed `GoodBois`.
- Package renamed to `goodbois`.
- Collaboration docs copied into the app repo.
- Git hooks created and installed locally.
- `npm install` completed.
- `npm run lint` passed before this handoff.
- Repo pushed publicly to GitHub at `https://github.com/julius-gwee/GoodBois`.

## Immediate Next Step for the New Project

Open a new Codex project directly at:

```txt
C:\Users\juliu\Documents\Uni\CS\Hackathons\GoodBois
```

Then ask the agent to read `docs/START_HERE_FOR_NEW_AGENTS.md` and `AGENTS.md` before implementing anything.
