# Allowlisted Tools

The triage LLM may only call tools registered here.

MVP tools:

- `signpost(agencyKey)`
- `findNearby(category)` as a text-first stub
- `simulateBooking(agencyKey, slot)`
- `generateReceipt(case)`
- `escalateToMpRc(case)`

Tools must return curated data. The LLM must never fabricate hotlines, agencies, addresses, or opening hours.
