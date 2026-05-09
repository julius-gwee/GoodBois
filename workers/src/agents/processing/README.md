# Processing Agent

Purpose: execute allowed workflows after triage has chosen an outcome.

MVP workflows:

- call `signpost(agencyKey)`
- call `escalateToMpRc(case)`
- call `generateReceipt(case)`
- call `simulateBooking(agencyKey, slot)` only for demo-safe simulated bookings
- call `findNearby(category)` as a text-first stub until the map lane replaces it

Rules:

- Only call tools from `workers/src/tools/`.
- Validate suggested next steps against curated agency/tool results before writing a case.
- Do not claim official dispatch, real booking confirmation, payment, or emergency response.
- Return data through the shared `TurnResponse` contract.
