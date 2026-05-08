# Regional Scaling

> The kiosk's architecture and provider choices were picked with SEA expansion in mind. This doc articulates *why* the same product works in other SEA cities and what changes per market.

## Why SEA, Not Just Singapore

The user problem is not unique to Singapore:

- **Aging populations across SEA.** Thailand, Vietnam, Malaysia, the Philippines, and Indonesia all have rapidly aging populations, and most have weaker formal eldercare infrastructure than SG.
- **Multilingual + dialect-heavy.** Every SEA city has a similar pattern: an official lingua franca on government platforms, but elderly residents speak local dialects (Bahasa, Tagalog regional, Vietnamese regional, Thai regional, Malay regional).
- **Volunteer-led grassroots triage.** RW / RT in Indonesia, Barangay in the Philippines, Tambon councils in Thailand — similar volunteer structures exist almost everywhere. The MP/RC handoff pattern translates.
- **Void-deck-equivalents exist.** Whether it's a community hall, a market stall, a religious-institution courtyard, or a clinic waiting area — every SEA city has a "where elderly people already are" location that fits a kiosk.

## Why the Stack Already Fits SEA

- **SEALion** is purpose-built for SEA languages and cultural context. It is not an English-first translation layer with SEA bolted on.
- **Cloudflare Workers + D1 + R2 + KV** are globally distributed. The same stack runs in Jakarta, Manila, Bangkok, KL, HCMC with no architecture change.
- **Allowlisted tool surface.** The agency directory swaps per market (HDB → BPS / DSWD / DOH / Tambon office); the architecture stays identical.
- **Anonymous-by-default.** No NRIC equivalent baked in. KTP, NIK, PhilSys, etc., can be optionally captured if the local market wants it; the kiosk works without.

## What Changes Per Market

| Layer | Singapore (today) | Jakarta (illustrative) |
|---|---|---|
| Languages | English, Mandarin, Hokkien, (NTH: Cantonese, Teochew, Malay, Tamil) | Bahasa Indonesia, Javanese, Sundanese, Madurese |
| Agency directory | HDB Essential Services, AIC, NTUC Health, MPs, RCs, etc. | BPJS Kesehatan, Posyandu Lansia, Karang Werda, RT/RW chairs, etc. |
| Escalation receiver | MP volunteer / RC member | RW chair / Posyandu volunteer |
| Hardware footprint | HDB void deck | Posyandu / community hall / RW office |
| Cultural framing | "MPS triage relief" | "RT/RW administrative load relief" |
| Funding angle | PA / MSF / HDB | Local government health budget; foundation grants |

## Beachhead City Outside Singapore

**Recommended first non-SG city: Jakarta.**

Why:

- Largest absolute SEA elderly population of any single city.
- Posyandu Lansia is an established, volunteer-run, locally-funded eldercare-access structure. The MP/RC handoff translates cleanly to Posyandu volunteers + RT/RW chairs.
- Bahasa Indonesia is well-supported by SEALion; Javanese / Sundanese coverage is the differentiator we need to validate.
- Existing SG–Jakarta NGO relationships (e.g. via Temasek Foundation regional programmes) create a credible introduction path.

**Alternative beachheads (in order):**

- **Manila** — strong volunteer Barangay structure; English supplementary widely understood; multilingual challenge (Tagalog + regional languages) is similar to SG's.
- **Bangkok** — Tambon council structure; older infrastructure investment; Thai-only is a tight language footprint.
- **Kuala Lumpur** — closest cultural overlap with SG; smaller scale; less differentiated.

## Pilot Pattern (Replicated From SG)

Phase the same way as the SG GTM:

1. One city, one neighbourhood, one community-anchor partner (Posyandu / Barangay / Tambon volunteer team).
2. 8-week pilot with 1 kiosk.
3. Case study evidence.
4. Approach the local-government equivalent of PA / MSF.

**The product code does not change between markets.** Only the agency directory, language matrix, and escalation receiver wiring change — and all three are config, not code.

## What "Regional" Means at 24 Months

- 2 SG estates + 1 non-SG city pilot live.
- Same codebase deployed in both regions.
- Per-market agency directory templates documented as a partner-handoff playbook.

## Risks

- **Volunteer-led grassroots triage is messier outside SG.** RT/RW dynamics, Barangay politics, etc., add coordination cost. Mitigation: pick a partner who already operates in the volunteer structure (NGO + local-government coalition) rather than working from scratch.
- **SEALion dialect coverage is uneven.** Javanese / Sundanese / Tagalog regional variants may underperform Bahasa Indonesia / Tagalog. Mitigation: gracefully fall back to the lingua franca; collect mistranslations as feedback to SEALion's training data.
- **Funding flow per market is different.** SG B2G doesn't translate to Jakarta B2G directly. Mitigation: lean on foundation grants for the first non-SG market; pursue B2G after pilot proof.
