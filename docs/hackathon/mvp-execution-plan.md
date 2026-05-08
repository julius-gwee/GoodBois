# Hackathon MVP Execution Plan

## Target Demo

A Mandarin-speaking resident asks the kiosk about a broken lift + missed dialysis appointment. Kiosk:

1. Picks up the language tile tap → opens listening state.
2. STT in Mandarin; translate to English.
3. Triage identifies two needs (housing + transport).
4. Asks one bounded follow-up ("which block?").
5. Signposts HDB Essential Services and offers to escalate to MP for transport aid.
6. Resident accepts; kiosk writes `Case`, fires export.
7. Receipt PDF appears full-screen, bilingual.
8. Idle reset.

A scripted demo path is rehearsed and bookmarked as a fallback if dialect STT misfires.

## Build Order

### Phase 1: Shared Foundation

- Stand up Cloudflare account, Wrangler auth, free-tier verification.
- Create D1 database; ship the schema migrations driven from `data-contracts.md`.
- Seed `AgencyContact` directory (15–25 entries; English + Mandarin blurbs minimum).
- Frontend scaffold: kiosk shell route + language picker + listening state placeholder (mock data).
- Worker scaffold: orchestrator skeleton + tool registry + D1 client.
- Decommission FastAPI / Supabase / magic-link auth (separate PR).

### Phase 2: Parallel Lanes

- **Dev A (`accessibility-voice-agent`):** STT / TTS / translate / triage LLM clients in the Worker. Kiosk frontend: full listening state, transcript, response card, consent banner, idle reset. Multi-turn KV session.
- **Dev B (`hazard-admin-agent`):** Worker tool implementations (`signpost`, `findNearby` stub, `simulateBooking`, `generateReceipt`, `escalateToMpRc`). MP/RC export adapter (CSV channel). Receipt PDF rendering.
- **Dev C (`map-discovery-agent`):** NTH lane on hold until Phase 5. Use the time to research OneMap Barrier-Free API + draft `mapAdapter` interface.
- **Dev D (`safety-demo-agent`):** End-to-end demo script. Scripted-fallback feature flag. Multilingual receipt typography. Pre-warm strategy for the pitch.

### Phase 3: Integration

- Wire frontend → Worker (one or two endpoints: `POST /turn` + `GET /receipt/:id`).
- KV-backed multi-turn session.
- Receipt PDF → R2 → signed URL → frontend full-screen view.
- MP/RC export adapter fires on every `escalateToMpRc`.
- Run the full demo flow end-to-end on the demo laptop.

### Phase 4: Demo Hardening

- Seed at least one canned case for every triage outcome (signpost / find_nearby / simulate_booking / escalate / out_of_scope).
- Pre-warm AI weights; verify P50 latency on demo network.
- Polish kiosk visuals (font sizes, animation, consent banner copy).
- Rehearse scripted fallback path.
- Freeze scope.

### Phase 5 (only if MVP is solid): NTH Map Lane

- Pull `findNearby` map render off the stub.
- Wire OneMap tiles + Barrier-Free routing behind `mapAdapter`.
- One demo route ("nearest exercise corner") rendered with a walking polyline.

## Minimum Seed Data

- **`AgencyContact`:** 15–25 entries across categories (housing, healthcare, social services, legal, financial assistance, elderly activity, digital help, MP, RC).
- **Multilingual blurbs:** at minimum English + Mandarin for every agency; Hokkien when SEALion's coverage allows.
- **Resource (NTH):** 6–10 elderly-friendly services for the map demo (exercise corner, SAC, polyclinic).
- **Demo cases:** one canned `Case` already in D1 for the MP/RC export demo.

## Demo Cut Rules

If time is tight, keep:

- Voice pipeline (STT → translate → triage → translate → TTS).
- `signpost` tool.
- `escalateToMpRc` tool + CSV export.
- `generateReceipt` tool.
- Kiosk shell + listening state + receipt view.
- Multilingual: English + Mandarin (Hokkien can drop to Phase 5).

Cut or simplify:

- `findNearby` map render (use text fallback).
- `simulateBooking` tool (skip; receipt issues from signpost or escalate only).
- Webhook / email export channels (CSV only).
- Hazard / Grab / route safety / mode switch.

## End-of-Day Checklist

- Full kiosk flow works on the demo laptop.
- Worker is deployed; AI weights are pre-warmed.
- KV session cleanup verified (no PII bleeds across sessions).
- D1 has demo seed data; export CSV downloadable.
- No obvious console errors.
- Demo script and scripted fallback both rehearsed.
