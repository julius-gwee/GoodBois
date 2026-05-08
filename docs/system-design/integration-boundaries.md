# Integration Boundaries

## Speech (STT / TTS) — MVP

MVP use:

- Cloudflare Workers AI for both STT and TTS.
- All audio flows go through the orchestrator Worker; the frontend never calls Workers AI directly.

Boundary:

- All voice flows have a text/touch fallback in the kiosk UI.
- No always-on listening; mic activates only after the user taps the listening tile.
- Audio is not retained beyond the session.

Fallback:

- Browser Web Speech API + touch input if the Cloudflare path fails on stage. Behind a feature flag.

## Translation (SEALion) — MVP

MVP use:

- SEALion for SEA-language translation, both directions (user lang → English for triage, English → user lang for response).
- Final language matrix owned by the voice-agent research subtask.

Boundary:

- Translation is server-side only.
- Translation outputs are logged with the case for auditability.

## Triage LLM — MVP

MVP use:

- Cloudflare Workers AI hosted LLM with tool / function calling.
- Tool surface is **allowlisted**: the LLM cannot signpost an agency or hotline that is not in the registry.
- Bounded multi-turn (1–3 follow-ups) before resolution or escalation.

Boundary:

- All hotline/agency signposts come from the curated D1 `AgencyContact` directory. The LLM picks; it does not generate.
- Triage runs entirely server-side. Frontend sees the resolved response only.

## MP/RC Export — MVP

MVP use:

- Structured `Case` written to D1 on escalation.
- Export adapter pushes cases to MP/RC tooling. Default channel: signed CSV download URL. Alt: webhook on case escalation; alt: email via Cloudflare Email Routing.

Not MVP:

- Building an MP/RC dashboard. They use their own.
- Two-way sync (status updates from MP/RC tooling back to us).

## Receipt PDF — MVP

MVP use:

- Worker renders a PDF receipt for each completed kiosk session that produced a signpost, booking, or escalation.
- PDF stored in Cloudflare R2; signed URL returned to the kiosk; shown full-screen.

Boundary:

- Receipt generation is server-side only.
- No real printer in the demo. The receipt UI is designed so it would be print-ready when a printer is added later.

## Voice Fallback (always available)

MVP use:

- Browser Web Speech API as the last-resort STT path if Workers AI is unreachable.
- `SpeechSynthesis` API as the last-resort TTS path.
- Touch input as the universal fallback.

Boundary:

- All voice flows have a non-voice fallback.
- The kiosk must remain usable if the network drops mid-session — at minimum, show the transcript so the user can continue manually.

## OneMap (NTH — high priority among NTH)

NTH use:

- Singapore location foundation for the resource discovery + wheelchair routing feature.
- OneMap-compatible coordinates.
- Barrier-Free Access API for routing.

Boundary:

- Resource data stores latitude/longitude, not provider-specific objects.
- Provider references are optional metadata.
- UI must work if map provider changes.

## Identity Capture (Future Extension)

Future use:

- Optional resident block/unit + alias when escalating cases (helps MP/RC follow-up).
- Tied to NGO linking.

Not MVP:

- NRIC, full address, or phone capture.

## Real Agency Integrations (Future Extension)

Future use:

- Replace `simulateBooking` with real agency APIs once partnerships exist.

Not MVP:

- Demo bookings are simulated (or fully scripted if time runs out).

## Grab (NTH — low priority)

Held over from prior product. Build only after MVP is solid.

NTH use:

- Deep link if available.
- Copyable pickup/drop-off instructions if deep link fails.

Not in scope:

- Ride booking, payment, voucher redemption, accessible vehicle allocation, API-level partnership.

## Hazard Agencies / Venue Operators (NTH — low priority)

Held over.

NTH use:

- Export CSV/JSON report package.

Not in scope:

- Official dispatch, work-order sync, government auth, guaranteed response.

## Route Safety Ping (NTH — low priority)

Held over from prior product. Build only after MVP is solid.

NTH use:

- Opt-in active route session, simulated location, in-app demo notification.

Not in scope:

- Medical monitoring, emergency response, background tracking, permanent route trace storage.

## Street View / AR (Future)

Held over. Not MVP. Future caregiver route preview, street-level entrance inspection, AR only after safety testing.
