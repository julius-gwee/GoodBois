# Product Principles

## Product Promise

GoodBois helps less tech-savvy elderly residents in HDB void decks find the right agency / hotline / local resource for their request — in their language, 24/7, without queueing.

The product does **not** promise: emergency response, clinical advice, official agency dispatch, guaranteed resolution, or replacement for human caseworkers. Complex cases are routed to MPs / RCs as structured cases; the resolution still happens in the existing system.

## MVP Positioning

Use this sentence consistently:

> GoodBois is a void-deck voice kiosk that triages elderly requests in their language, signposts to the right agency or hotline, and escalates complex cases to MPs and RCs with structured context.

Avoid these descriptions:

- Replacement for AIC.
- Replacement for LifeSG.
- Government hotline.
- Emergency response system.
- Medical advice system.
- All-in-one elderly superapp.
- Replacement for MP / RC sessions.

## MVP Features

The hackathon MVP includes:

- Voice pipeline: STT → SEALion translate → LLM triage → orchestrator → tool calls → SEALion translate → TTS.
- Multi-turn dialogue with bounded follow-ups (≤3).
- Allowlisted tool surface: `signpost`, `findNearby`, `simulateBooking`, `generateReceipt`, `escalateToMpRc`.
- Curated `AgencyContact` directory.
- Kiosk UI: language picker, listening state, transcript, response card, full-screen receipt PDF, idle reset, consent banner.
- Multilingual: English + Mandarin + Hokkien target.
- Receipt PDF generated server-side, shown in browser.
- Simulated booking (or scripted if time-pressed).
- MP/RC structured-case CSV export.
- Anonymous-by-default; identity capture only on opt-in.

## Nice-to-Have Features

Build only after MVP is solid:

1. Resource discovery + map + OneMap Barrier-Free routing (high-priority NTH).
2. Hazard reporting via the kiosk.
3. Mode switching, Grab handoff, route safety / caregiver ping (low-priority NTH; held over from prior product).

## Future Extensions

- Real agency integrations (replace simulated bookings).
- NGO linking with optional identity capture.
- Real printer for receipts.
- Multi-kiosk deployment.

## Trust Language

Use:

- "Reported broken lift, signposting HDB Essential Services."
- "Suggested next steps for the MP volunteer to action."
- "Hotline: 1800-XXX-XXXX (verified directory)."
- "This is not an official agency dispatch."

Avoid:

- "Government has been notified."
- "Lift will be fixed by tomorrow."
- "Help is on the way."
- "Your appointment is confirmed." (unless it is a real booking — MVP is simulated)

## Allowlist Rules

- Hotlines and agencies always come from the curated `AgencyContact` directory.
- The triage LLM picks; it does not generate phone numbers, addresses, or hours.
- "Suggested next steps" must be allowlist-validated before being shown or written into a `Case`.

## Privacy and Consent Rules

- Anonymous by default. Identity capture is optional and asked only when needed.
- NRIC is never captured.
- Consent banner before listening: "This kiosk listens only after you tap the language tile. Audio is used to understand your request and is not stored after this session."
- Audio not retained beyond the session.
- KV session cleared on idle reset.

## Out-of-Scope Triage Rules

When the triage LLM detects:

- Medical emergency: signposts 995 / 1777, kiosk says "If this is an emergency, please dial 995."
- Mental health crisis: signposts SOS hotline.
- Legal advice questions: signposts Pro Bono SG; clarifies it is not legal advice.

## Demo Success Definition

The demo shows one complete story:

1. Resident taps language tile.
2. Resident speaks in dialect; transcript appears.
3. Triage asks one bounded follow-up.
4. Resident answers.
5. Triage signposts an agency (curated) and offers MP/RC escalation.
6. Resident accepts; case is written; export fires.
7. Receipt PDF appears full-screen, bilingual.
8. Idle reset.

The scripted-fallback path is rehearsed and bookmarked behind a feature flag.
