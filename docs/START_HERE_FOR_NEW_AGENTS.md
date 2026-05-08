# Start Here for New Agents

This file preserves the important context from the kickoff conversations so a new Codex or Claude project can start inside `GoodBois` without losing product direction.

## Repository

- GitHub repo: `https://github.com/julius-gwee/GoodBois`
- Visibility: public
- Base template (initial): `https://github.com/pastchum/hackathon-template-with-database-backend` — this scaffolded FastAPI + Supabase, which is being decommissioned in the Cloudflare migration.
- Current target stack: Next.js 16 (Cloudflare Pages) + Cloudflare Workers + Workers AI + SEALion + D1 + R2 + KV. See `docs/system-design/tech-stack.md`.

## Hackathon Context

The team is building this for **The Good Hack 2026**. The original problem framing:

> How might we reduce manual and time-consuming tasks within the eldercare ecosystem so that more seniors are well-supported?

The team is four developers using a mix of Codex and Claude. The repo includes cross-tool instructions, subagent prompts, product standards, hooks, and system design docs to support parallel work.

## Product Summary

Working product: **GoodBois** — a void-deck voice kiosk for elderly residents. (The repo previously described a "Care Access Map" web app; that pivot landed on 2026-05-09. Older inbound references to "Care Access Map" mean GoodBois.)

GoodBois is a voice-first kiosk installed at HDB void decks. Less tech-savvy elderly residents speak to it in Mandarin, Hokkien, or other SEA languages. The kiosk:

- **Triages** their request (figures out what they actually need).
- **Signposts** them to the right agency / hotline / local resource (from a curated directory).
- **Escalates** complex cases to MP / RC volunteers as structured cases (the volunteers consume cases via their existing dashboards).
- **Generates a receipt** as a PDF (shown full-screen on the kiosk; printer not used in the demo).

The kiosk is anonymous by default. Identity (block/unit, alias) is optional and asked only when needed; never NRIC.

## Product Rationale

Less tech-savvy elderly in older HDB estates currently rely on weekly MP Meet-the-People sessions or RC visits to navigate basic government and social services. Both assume the user can navigate to the right place at the right time and re-explain in English to a volunteer who'll write up the case by hand.

GoodBois meets them where they already are (the void deck), speaks their dialect, runs 24/7, and routes complex cases with structured context — reducing the manual triage burden on grassroots leaders.

## MVP Scope (committed)

1. Voice pipeline: STT → SEALion translate → LLM triage → orchestrator → tool calls → SEALion translate → TTS.
2. Multi-turn dialogue with bounded follow-ups (≤3).
3. Allowlisted tool surface: `signpost`, `findNearby`, `simulateBooking`, `generateReceipt`, `escalateToMpRc`.
4. Curated `AgencyContact` directory.
5. Kiosk UI: language picker, listening state, transcript, response card, full-screen receipt PDF, idle reset, consent banner.
6. Multilingual: English + Mandarin + Hokkien target. Final language matrix owned by the voice-agent research subtask.
7. Receipt PDF generated server-side, shown in browser.
8. Simulated booking (or scripted if time-pressed).
9. MP/RC structured-case CSV export.
10. Anonymous by default; opt-in identity capture.

## Nice-to-Have (priority order)

1. Resource discovery + map + OneMap Barrier-Free routing.
2. Hazard reporting (kiosk capability).
3. Mode switching, Grab handoff, route safety / caregiver ping (held over from prior product).

## Future Extensions

- NGO / agency linking with optional identity capture.
- Real agency integrations replacing simulated bookings.
- Real printer for receipts.
- Cross-kiosk MP/RC dashboard.
- Multi-kiosk deployment.

## Positioning Guardrails

Say:

> GoodBois is a void-deck voice kiosk that triages elderly requests in their language, signposts to the right agency or hotline, and escalates complex cases to MPs and RCs with structured context.

Do not say:

- Replacement for AIC / LifeSG.
- Government hotline.
- Emergency response system.
- Medical advice system.
- All-in-one elderly superapp.
- Replacement for MP / RC sessions.

## Safety and Privacy Guardrails

- Hotlines come from the curated directory; the LLM cannot fabricate.
- Anonymous by default; NRIC never captured.
- Audio not retained beyond the session.
- KV session cleared on idle reset.
- Consent banner before listening.
- Out-of-scope triage routes medical / emergency / legal questions to a curated hotline (e.g. 995 for medical emergency).

## Four-Developer Workstreams

(Subagent role files at `.claude/agents/*.md` mirror these. Filenames preserved from the prior product; missions rewritten for the kiosk pivot.)

1. **`accessibility-voice-agent`** — voice / AI pipeline (Worker) + kiosk frontend UX.
2. **`hazard-admin-agent`** — Worker tools, agency directory, receipt PDF, MP/RC export.
3. **`map-discovery-agent`** — NTH lane: resource discovery + OneMap Barrier-Free routing.
4. **`safety-demo-agent`** — demo orchestration + scripted fallback + route safety NTH.

See `docs/agents/team-operating-model.md` and `docs/agents/subagents.md`.

## Recommended First Reads

For any new agent or developer:

1. `AGENTS.md`
2. `CLAUDE.md` if using Claude
3. `.codex/skills/care-access-map/SKILL.md` if using Codex
4. `docs/care-access-map-prd-and-backlog.md` — kiosk PRD (filename predates the pivot)
5. `docs/standards/product-principles.md`
6. `docs/system-design/tech-stack.md` — locked stack
7. `docs/system-design/architecture.md`
8. `docs/system-design/integration-boundaries.md`
9. `docs/standards/data-contracts.md`
10. `docs/hackathon/mvp-execution-plan.md`

## Existing Setup Done

- Repo duplicated from template and renamed `GoodBois`.
- Package renamed to `goodbois`.
- Collaboration docs copied into the app repo.
- Git hooks created and installed locally.
- `npm install` completed.
- `npm run lint` passed before this handoff.
- Repo pushed publicly to GitHub at `https://github.com/julius-gwee/GoodBois`.
- (Pre-pivot) FastAPI + Supabase scaffold in place. **Scheduled for decommission as part of the Cloudflare migration** — don't extend it.
