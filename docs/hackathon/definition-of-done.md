# Definition of Done

## Feature Done

A feature is done when:

- It is reachable from the demo flow.
- It uses shared data contracts.
- It has seeded D1 data.
- It handles empty/error state enough for the demo (e.g. STT failure, AI rate limit).
- It works on the demo laptop's resolution / browser.
- It does not make unsafe or unsupported product claims (no fabricated hotlines; no medical advice; no real-agency dispatch claim).
- The relevant docs are updated.

## UI Done

UI is done when:

- Text fits at the kiosk display resolution.
- Buttons and language tiles are tappable (≥44px / ≥120px respectively).
- Listening state is clearly visible.
- Status is not color-only (icon + label).
- Transcript shows in the user's language and (smaller) in English.
- Idle reset clears the visible session.
- Consent banner is shown before the first listening session.

## Voice Pipeline Done

Voice pipeline is done when:

- STT returns transcript in user language within 2s on demo hardware.
- Translation returns English text within 2s.
- Triage LLM returns a tool selection or a follow-up question within 5s on demo hardware.
- TTS plays response audio within 2s of triage completion.
- Touch / text fallback path works end-to-end without any voice step.

## Safety Done

Safety-sensitive features are done when:

- Hotlines come from the curated `AgencyContact` directory; the LLM cannot fabricate.
- Out-of-scope detection routes medical / emergency questions to a curated hotline.
- Consent copy is visible before listening.
- Audio is not retained beyond the session.
- KV session is cleared on idle reset.
- No NRIC is captured anywhere.

## Integration Done

Integration is done when:

- Frontend → Worker pipeline survives a multi-turn dialogue (≤3 follow-ups).
- D1 reads/writes go through the typed schema, not raw strings.
- MP/RC export CSV reflects the latest queued cases.
- Receipt PDF appears in the kiosk full-screen within 2s of generation.
- Idle reset clears KV state without breaking the next session.

## Demo Done

Demo is done when one person can run the full scenario without developer explanation or hidden setup, AND the scripted-fallback path is rehearsed and reachable.
