# D1 Access

D1 schema access belongs here.

Build-day order:

1. Create migrations under `workers/migrations/`.
2. Seed `AgencyContact` rows.
3. Add typed reads/writes for sessions, utterances, triage results, tool invocations, cases, receipts, and agency contacts.

Cloudflare D1 is the only database for the GoodBois MVP.
