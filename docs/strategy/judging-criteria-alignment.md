# Judging Criteria Alignment (Demo Cheat Sheet)

> Maps each rubric criterion to the specific demo moment + pitch beat that makes the case. Owned by `safety-demo-agent`. Read this before rehearsing the pitch.

## Rubric Recap

| Criterion | Weight |
|---|---|
| Problem-Solution Fit | 35% |
| Scalability Across Cultures & Borders | 15% |
| Long-term Sustainability | 15% |
| Go-to-Market Strategy | 15% |
| Innovation & Creativity | 10% |
| Presentation & Storytelling | 10% |

## Problem-Solution Fit (35%) — Pitch Beat 1

**The line:** "Mrs Tan is 78. She speaks Hokkien. Her lift broke. To get help, she queues at the MP session every Thursday. By the time she's seen, she has to re-explain in English to a volunteer who'll write it up by hand."

**Demo moment:** Open with Mrs Tan's actual Hokkien utterance into the kiosk. Show the kiosk *understanding her dialect*, asking one follow-up, and producing the structured signpost + escalation.

**Why this scores:** specific user, specific pain (manual triage burden on volunteers), specific solution (kiosk meets her where she already is), and you *show* it working in dialect.

## Scalability Across Cultures & Borders (15%) — Pitch Beat 2

**The line:** "The voice pipeline is built on SEALion — purpose-built for SEA languages and cultural context. The agency directory is config, not code. Swap HDB for BPS, MPS for Posyandu Lansia, and the same kiosk works in Jakarta."

**Demo moment:** show the language picker with multiple SEA languages enabled. Mention Bahasa / Javanese / Tagalog as next-market language coverage. Reference `docs/strategy/regional-scaling.md` for depth.

**Why this scores:** explicit cross-border thinking, named beachhead city (Jakarta), named partners (Posyandu Lansia / RW / RT). Not "we could do other countries"; specific structural translation.

## Long-term Sustainability (15%) — Pitch Beat 3

**The line:** "B2G. PA, MSF, HDB, individual GRC town councils. The buyer is the public-sector entity that's already paying for volunteer-hour-equivalents in MPS triage today. We're a triage-relief tool with a budgeted pain point."

**Demo moment:** brief — a single slide with the cost structure ($5–10k per kiosk per year at pilot, <$1.5k variable cost at 50-kiosk scale) and the procurement bridge (grant-funded 5-kiosk pilot → B2G contract).

**Why this scores:** named buyer, named bridge funding (Tote Board / Lien Foundation / Temasek Foundation / Lee Foundation), defensible cost figures, and a clear "this is sustainable because the pain is already in someone's budget" thesis.

## Go-to-Market (15%) — Pitch Beat 4

**The line:** "Beachhead is one mature HDB estate with high elderly density. We don't market to elderly — we onboard the RC volunteers who already do their welfare visits. They walk residents through their first kiosk session. The MP volunteer team consumes structured cases via their existing dashboard, fed by our CSV."

**Demo moment:** show the receipt PDF (the artefact that hands over to the volunteer system) and the CSV format. The CSV is the GTM proof: it slots into MP volunteer tooling that already exists.

**Why this scores:** beachhead identified, three-ring user model (resident / volunteer / MP), specific channels (RC referrals, MP referrals, NGO networks), and an 8-week pilot sequence with measurable success criteria. Not "we'll do social media ads"; an actual sequence.

## Innovation & Creativity (10%) — Pitch Beat 5 (woven through)

**The line:** "What's novel isn't a voice agent. What's novel is **dialect-aware triage with an allowlisted tool surface that can't fabricate a hotline**, plus a structured-case handoff that compresses what currently takes a Thursday-MPS-queue conversation into a CSV row a volunteer reads in 30 seconds."

**Demo moment:** during the demo, narrate one moment when the LLM picks a tool (`signpost(hdb_essential_services)`) and explain the directory-only constraint. Visible safety net = visible engineering thought.

**Why this scores:** specific innovation claim that resists "this is just a chatbot" pushback. The allowlisted tool surface + structured handoff is what makes this defensible at the engineering level.

## Presentation & Storytelling (10%) — Throughout

**The arc:**

1. Mrs Tan (problem in 30 seconds).
2. Live demo with dialect (problem-solution fit + innovation).
3. Cross-border slide (scalability).
4. B2G + cost slide (sustainability).
5. 8-week pilot slide (GTM).
6. Close with Mrs Tan's receipt printing in the kiosk (callback to opening).

**Q&A handling:** every team member knows which doc backs which answer.

- Stack questions → `docs/system-design/tech-stack.md`.
- Privacy / safety → `docs/standards/product-principles.md`.
- "How do you not fabricate a hotline?" → allowlisted tool surface in `docs/system-design/architecture.md`.
- "Why this MP / NGO / agency?" → `docs/strategy/go-to-market.md`.
- "Why is this sustainable?" → `docs/strategy/sustainability.md`.
- "What about the Philippines?" → `docs/strategy/regional-scaling.md`.

## What to Cut If We Run Long

- Cross-border slide can compress to one sentence ("Same kiosk runs in Jakarta with a config swap; SEALion handles SEA languages natively").
- Cost detail can compress to "B2G with grant-funded pilot bridge".
- Innovation beat is woven through the demo; no dedicated slide needed.

What we **don't cut**: Mrs Tan opening, live dialect demo, structured-case handoff (the CSV / receipt). Those carry 35% + 15% + 10% = 60% of the score.
