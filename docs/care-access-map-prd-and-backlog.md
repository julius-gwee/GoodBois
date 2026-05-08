# GoodBois Kiosk PRD and Backlog

> The product pivoted on 2026-05-09. This file used to describe **Care Access Map**; it now describes **GoodBois**, a void-deck voice kiosk. The filename is preserved to avoid breaking inbound references; treat the content below as authoritative.

## 1. Product Summary

**Working name:** GoodBois.

**Hackathon problem statement:** PS2 — "How might we reduce manual and time-consuming tasks within the eldercare ecosystem so that more seniors are well-supported?"

**One-line pitch:** GoodBois is a voice-first kiosk installed at HDB void decks that triages elderly residents' requests in their language, signposts them to the right agency / hotline / local resource, and escalates complex cases to MPs and RCs with structured context.

## 2. Core Value Proposition

For less tech-savvy elderly in older HDB estates who live alone or with limited family support, who speak Mandarin, Hokkien, or other languages, and who currently rely on weekly MP Meet-the-People sessions or RC visits to navigate basic government and social services:

> GoodBois meets them where they already are, speaks their dialect, runs 24/7, and routes complex cases to MPs and RCs with structured context — reducing the manual triage burden on grassroots leaders.

Differentiates from:

- **AIC hotline** — single language, fixed hours, no routing memory.
- **LifeSG app** — assumes the user is digitally able and Singpass-authenticated.
- **MP Meet-the-People sessions / RC visits** — weekly, queue-based, manual triage by volunteers.

## 3. Target Users

**Primary:** Less tech-savvy elderly residents in older HDB estates. Often live alone or with limited family support. Often speak Mandarin, Hokkien, or other dialects.

**Secondary:** MP volunteers and RC members who consume escalated structured cases (via their existing dashboards — we do not build one).

**Out of scope for MVP:** caregivers, NGO staff, agency operations, transport providers.

## 4. Pipeline (locked)

```
Resident speaks (user's language)
   │
   ▼
STT  →  Translate (user → English)  →  LLM triage + tool selection  →  Orchestrator
                                                                          │
                                                            allowlisted tools:
                                                            - signpost(agencyKey)
                                                            - findNearby(category)
                                                            - simulateBooking(agencyKey, slot)
                                                            - generateReceipt(case)
                                                            - escalateToMpRc(case)
                                                                          │
   ◄────  TTS  ◄──  Translate (English → user)  ◄──────────────────────────┘
   │
   ▼
Resident hears response in their language (+ on-screen card / receipt PDF)
```

Multi-turn dialogue with bounded follow-ups (≤3) before resolution or escalation.

## 5. Triage Outcomes

The LLM produces one of:

- **Signpost** — point at an agency / hotline / local resource. Most cases.
- **Find nearby** — query D1 for nearby `Resource` (NTH); MVP returns text/voice description with walking direction.
- **Simulate booking** — call a preset agency, return `BookingConfirmation`. Generates receipt.
- **Ask follow-up** — request one more clarifying detail. Bounded.
- **Escalate** — write a `Case` for MP/RC. Generates receipt.
- **Out of scope** — politely decline; suggest hotline.

All hotlines and agencies come from the curated D1 `AgencyContact` directory. The LLM picks; it does not generate.

## 6. MVP Scope

1. Voice pipeline: STT → translate → triage → tool calls → translate → TTS.
2. Multi-turn dialogue with bounded follow-ups.
3. Allowlisted tool surface: `signpost`, `findNearby`, `simulateBooking`, `generateReceipt`, `escalateToMpRc`.
4. Curated `AgencyContact` directory (seed: 15–25 agencies covering housing, healthcare, social services, legal, financial assistance, elderly activity, digital help, MP/RC).
5. Kiosk UI: language picker, listening state, transcript, response card, full-screen receipt PDF, idle reset (30s), consent banner.
6. Multilingual: English + Mandarin + Hokkien target. Final language matrix owned by the voice-agent research subtask.
7. Receipt PDF generated server-side, shown in browser. No real printer for demo.
8. Simulated booking (preset agencies, hardcoded outcomes). Scripted fallback if simulated implementation runs out of time.
9. MP/RC structured-case export adapter. Default channel: signed CSV download URL. MP/RC volunteers consume cases in their existing dashboards.
10. Anonymous by default. Optional resident block/unit/alias only on escalation. NRIC never stored.

## 7. Nice-to-Have Scope (priority order)

**Higher priority NTH:**

1. Resource discovery: list/filter elderly-friendly services by category.
2. Map: render `Resource` markers on OneMap base.
3. Wheelchair-friendly routing: OneMap Barrier-Free Access API for routing to a chosen destination.

**Lower priority NTH (held over from prior product):**

4. Hazard reporting (kiosk capability — "report a broken lift").
5. Mode switching (elderly / caregiver UI).
6. Grab handoff (deep-link or copy fallback).
7. Route safety / caregiver ping.

Build NTH only after MVP is solid.

## 8. Future Extensions

- NGO / agency linking with optional identity capture (block/unit, alias). Tied to the escalation flow.
- Real agency integrations replacing `simulateBooking`.
- Real printer (PDF receipt UI is print-ready by design).
- Cross-kiosk MP/RC dashboard (today they use their own).
- Multi-kiosk deployment with per-kiosk telemetry.

## 9. Demo Scenario (target)

**Setup:** demo laptop styled as a void-deck kiosk. Mandarin-speaking elderly persona.

1. Resident taps the 中文 tile.
2. Resident speaks: "我的电梯坏了，我没办法去医院做透析。" ("My lift is broken and I can't get to the hospital for dialysis.")
3. Kiosk shows listening state, then transcribed text in Mandarin.
4. Worker: STT → translate → triage. Triage identifies two needs: lift repair (housing) + dialysis transport (healthcare/transport).
5. Triage asks one follow-up: "您住在哪一座哪一层？" ("Which block and floor?")
6. Resident answers: "Block 123, level 8".
7. Triage signposts: HDB Essential Services (1800-XXX-XXXX) for the lift; suggests calling the dialysis clinic to reschedule and offers to escalate to MP for transport-aid help.
8. Resident says yes to the MP escalation.
9. Worker writes a `Case` to D1 with structured fields. Export adapter fires.
10. Receipt PDF appears full-screen with case ID and the two next steps in Mandarin + English.
11. Idle reset after 30s; kiosk returns to language picker.

**Demo cut path:** if dialect STT misfires on stage, fall back to a scripted utterance (typed via the touch fallback).

## 10. Functional Requirements

### FR1: Kiosk shell

- Full-screen layout, large language tiles (≥120px target), high contrast.
- Listening-state indicator (animation; no audio cue beyond the resident's own voice).
- Transcript panel showing both user-language and English (English smaller, for verification).
- Response card (agency name, hotline, address, opening hours, multilingual blurb).
- Full-screen receipt view with one "回去 / Go back" button.
- Idle-reset timer (30s) clearing KV session and returning to language picker.

### FR2: Voice pipeline

- STT via Cloudflare Workers AI; final model picked by voice-agent research.
- Translation via SEALion (bidirectional).
- Triage LLM via Cloudflare Workers AI with tool/function calling.
- TTS via Cloudflare Workers AI.
- All AI calls server-side only.
- Browser Web Speech API + touch input as last-resort fallback (feature-flagged).

### FR3: Allowlisted tools

- `signpost(agencyKey)`: returns `AgencyContact`.
- `findNearby(category)`: D1 query against `Resource`.
- `simulateBooking(agencyKey, slot)`: returns `BookingConfirmation` (preset).
- `generateReceipt(case)`: renders PDF in Worker, stores in R2, returns signed URL.
- `escalateToMpRc(case)`: writes `Case` to D1, fires export adapter.

### FR4: Multilingual

- BCP-47 language codes throughout.
- `AgencyContact.multilingualBlurb` keyed by BCP-47 tag.
- Response generated in English then translated; receipt prints both languages.

### FR5: MP/RC export adapter

- Default channel: signed CSV download URL (Worker generates on demand).
- Alt: webhook on case escalation.
- Alt: email via Cloudflare Email Routing.
- CSV columns per `data-contracts.md`.

### FR6: Receipt PDF

- Generated server-side in the Worker.
- Stored in R2; signed URL returned.
- Includes: case ID, language, English summary, user-language summary, suggested next steps, timestamp, kiosk ID.

### FR7: Anonymous-by-default

- No identity capture on the resident's first turn.
- If the LLM decides to escalate AND deems identity helpful, asks for block/unit/alias once. Resident can decline.
- NRIC never stored.

### FR8: Idle reset and consent

- 30s of inactivity clears KV session and returns to language picker.
- Consent banner before the first listening session ("This kiosk listens only after you tap the language tile. Audio is used to understand your request and is not stored after this session.").

## 11. Data Model

See `docs/standards/data-contracts.md`. MVP entities: `KioskSession`, `Utterance`, `TriageResult`, `ToolInvocation`, `AgencyContact`, `Case`, `Receipt`, `BookingConfirmation`. NTH entities: `Resource` (+ details), `HazardReport`, `RouteSafetySession`, `Submission`.

## 12. Non-Functional Requirements

### Accessibility

- ≥44px touch targets; ≥120px on language tiles.
- High contrast neutral palette.
- Large default font size (≥18px body; ≥24px on the listening / response screen).
- No reliance on color alone for state.
- Keyboard-accessible (a stylus or attached keyboard variant should still work).

### Trust and Safety

- Hotlines come from the curated directory; the LLM never generates phone numbers.
- The kiosk says "I'm not a doctor" if the LLM detects a medical question; signposts to a hotline.
- The kiosk does not capture medical details.
- Receipt and case clearly state "This is not an official agency dispatch."

### Privacy

- Anonymous by default.
- No NRIC.
- Audio not retained beyond the session.
- KV session cleared on idle reset.

### Performance

- Worker cold-start sub-50ms; AI calls expected to dominate latency.
- Pre-warm AI weights from the demo laptop ~5 min before the pitch.
- PDF generation ≤2s on demo hardware.

## 13. Risks and Mitigations

### Risk: dialect STT misfires on stage

Mitigation: rehearsed scripted demo path (specific utterance → known signpost → simulated booking → receipt) bookmarked behind a feature flag. Touch fallback always reachable from the listening screen.

### Risk: LLM hallucinates a hotline

Mitigation: allowlisted tool surface. The LLM calls `signpost(agencyKey)`; the directory returns the actual contact.

### Risk: SEALion / Workers AI free-tier limits hit during the pitch

Mitigation: pre-warm before the pitch; have a paid-tier billing card on file; have the browser Web Speech fallback wired.

### Risk: receipt PDF font does not render Hokkien / Tamil / Mandarin

Mitigation: receipt-lane research picks a PDF library with CJK + Tamil glyph coverage before MVP scope freeze.

### Risk: MP/RC volunteers don't actually use the export

Mitigation: ship the CSV channel as default (lowest friction); document the webhook + email options for partner conversations.

### Risk: people see "kiosk listens" as surveillance

Mitigation: consent banner; mic activates only on tap; no always-on listening; idle reset visible; transcript shown on screen.

## 14. Backlog

Priority labels:

- **P0:** Required for hackathon MVP.
- **P1:** Should build if time allows.
- **P2:** Nice-to-have / future.

### Epic 1: Voice Pipeline (P0)

| ID | Priority | User Story | Acceptance Criteria |
| --- | --- | --- | --- |
| V-01 | P0 | As a resident, I can pick my language. | Language tiles render in user-language script with native font; default = English. |
| V-02 | P0 | As a resident, I can speak my request and have it transcribed. | STT returns transcript in user language within 2s on demo hardware. |
| V-03 | P0 | As a resident, I hear the response in my language. | TTS plays SEALion-translated response within 2s of triage completion. |
| V-04 | P0 | As a resident, I can be asked one follow-up question. | Multi-turn loop bounded to ≤3 turns. |
| V-05 | P1 | As a resident, the kiosk falls back to text input if STT fails. | Touch keyboard appears; transcript editable; rest of pipeline unchanged. |

### Epic 2: Triage + Tools (P0)

| ID | Priority | User Story | Acceptance Criteria |
| --- | --- | --- | --- |
| T-01 | P0 | As an orchestrator, I can call `signpost(agencyKey)`. | Returns `AgencyContact` from D1; renders on screen. |
| T-02 | P0 | As an orchestrator, I can call `simulateBooking(agencyKey, slot)`. | Returns preset `BookingConfirmation`; receipt generated. |
| T-03 | P0 | As an orchestrator, I can call `escalateToMpRc(case)`. | Writes `Case` to D1; export adapter fires. |
| T-04 | P0 | As an orchestrator, I can call `generateReceipt(case)`. | Worker renders PDF, stores in R2, returns signed URL. |
| T-05 | P1 | As an orchestrator, I can call `findNearby(category)`. | Reads `Resource` from D1; returns text/voice description. NTH map render in Epic 5. |

### Epic 3: Receipt + Export (P0)

| ID | Priority | User Story | Acceptance Criteria |
| --- | --- | --- | --- |
| R-01 | P0 | As a resident, I see my receipt full-screen. | PDF rendered in browser within 2s; ≥18px font; bilingual. |
| R-02 | P0 | As an MP volunteer, I can download a CSV of queued cases. | Worker generates signed CSV URL with columns per `data-contracts.md`. |
| R-03 | P1 | As an MP volunteer, I can receive a webhook on each case. | Webhook adapter fires on `escalateToMpRc`; payload `{ case }`. |
| R-04 | P2 | As an MP volunteer, I can receive an email per case. | Cloudflare Email Routing configured. |

### Epic 4: Kiosk Shell (P0)

| ID | Priority | User Story | Acceptance Criteria |
| --- | --- | --- | --- |
| K-01 | P0 | As a resident, I see large language tiles on idle. | ≥120px tiles in user-language script. |
| K-02 | P0 | As a resident, I see the kiosk listening. | Visible animation; transcript panel updates as STT streams. |
| K-03 | P0 | As a resident, I can read the response card. | Bilingual; ≥18px. |
| K-04 | P0 | As a resident, the kiosk resets after 30s idle. | KV session cleared; UI returns to language tiles. |
| K-05 | P0 | As a resident, I see a consent banner before listening. | Banner shown on first session; tap-to-acknowledge. |

### Epic 5: Resource Discovery + Map (NTH, P1)

| ID | Priority | User Story | Acceptance Criteria |
| --- | --- | --- | --- |
| M-01 | P1 | As a resident, asking for "the nearest exercise corner" returns a map view. | `findNearby` reads D1; renders react-leaflet map within `mapAdapter`. |
| M-02 | P1 | As a resident, I see a wheelchair-friendly walking route. | OneMap Barrier-Free Access API call returns polyline; rendered on the map. |
| M-03 | P1 | As a resident, I can hear walking directions step-by-step. | TTS reads route steps after rendering. |

### Epic 6: Hazard / Mode / Grab / Route Safety (NTH, P2)

Held over from prior product. Build only after MVP is solid.

## 15. Pitch Structure

The pitch maps 1:1 to the judging rubric. See `docs/strategy/judging-criteria-alignment.md` for which beat hits which criterion and what to cut if we run long.

**Beat 1 — Mrs Tan (Problem-Solution Fit, 35%).** "Mrs Tan is 78. She speaks Hokkien. Her lift broke. To get help, she queues at the MP session every Thursday. By the time she's seen, she has to re-explain in English to a volunteer who'll write it up by hand."

**Beat 2 — Live demo with dialect (Problem-Solution Fit + Innovation).** Mrs Tan speaks to the kiosk in Hokkien. The kiosk understands, asks one follow-up, and produces a structured signpost + escalation. Receipt PDF appears full-screen. The volunteer reads the case in 30 seconds, not 30 minutes.

**Beat 3 — Cross-border (Scalability, 15%).** SEALion is purpose-built for SEA. Agency directory is config, not code. Swap HDB → BPS, MPS → Posyandu Lansia. The same kiosk runs in Jakarta. (See `docs/strategy/regional-scaling.md`.)

**Beat 4 — Sustainability (15%).** B2G — PA / MSF / HDB / GRC town councils. Grant-funded 5-kiosk pilot bridges to a B2G contract. Cost intuition: $5–10k per kiosk per year at pilot stage; <$1.5k variable cost at 50-kiosk scale. (See `docs/strategy/sustainability.md`.)

**Beat 5 — Pilot sequence (GTM, 15%).** One mature HDB estate. 8-week pilot. We onboard RC volunteers, not residents. The MP volunteer team consumes structured cases via their existing dashboard, fed by our CSV. Success metrics: 100+ sessions, 15+ structured cases, qualitative volunteer-hours-saved. (See `docs/strategy/go-to-market.md`.)

**Beat 6 — Callback to Mrs Tan (Storytelling, 10%).** Mrs Tan's receipt prints. The MP volunteer reads it on Thursday. Mrs Tan doesn't have to queue.

**Q&A:** every team member knows which doc backs which answer. See the alignment doc.

## 16. Open Questions

1. Final language matrix in MVP — owned by the voice-agent research subtask.
2. Triage LLM model choice — Workers AI hosted vs SEALion. Tool-calling support is the gating criterion.
3. PDF library — `@pdf-lib/pdf-lib` vs alternative; CJK / Tamil glyph coverage drives the choice.
4. MP/RC export channel — CSV default; webhook and email as alternates. Real partner conversation may pin this.
5. Kiosk hardware framing — laptop-only for the demo; physical kiosk hardware out of scope.
