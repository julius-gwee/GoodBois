# Sustainability

> Primary thesis: **B2G** — public-sector buys/licenses kiosks per estate. Grant funding bridges the pilot before the institutional sale closes. Sponsorship and other revenue alternatives are documented for optionality but not the headline.

## Primary Thesis: B2G

**Buyer:** People's Association (PA) / Ministry of Social and Family Development (MSF) / HDB / individual GRC town councils.

**What we sell:** kiosks at $X / kiosk / year as a licensed service. Includes hardware refresh, software updates, dialect coverage updates, agency directory maintenance, and the MP/RC export pipe.

**Why it's a fit:**

- The product directly reduces volunteer manual labour at MPS / RC visits — the pain point is *budgeted*, just inside the volunteer-hour line, not a software-licensing line.
- PA already invests in SACs, RCs, kopitiam-level community infrastructure. A void-deck kiosk fits this footprint.
- HDB owns the void decks. Working with HDB on placement is a known process (vending machines, community art, fitness corners are precedent).
- MSF cares about access to social services for the elderly; this is a literal access tool.

**What gates the sale:**

- A pilot case study (see `go-to-market.md`): kiosk session count, escalated case count, volunteer hours saved, resident-reported helpfulness.
- An MP champion willing to sponsor a presentation to PA / MSF / HDB.
- A clear cost-per-kiosk-per-year figure that beats the all-in cost of an extra volunteer-hour at scale.

**Pricing intuition (TBD):**

- Below the cost of one part-time community-care worker per year per estate (~$30k as a back-of-envelope ceiling).
- Likely $5–10k per kiosk per year at pilot stage; lower at scale.

## Bridge: Grant-Funded Pilot

The B2G sale takes 12–24 months (public-sector procurement cycles). Grants bridge the gap.

**Targets (TBD which to approach first):**

- Tote Board — community development.
- Lien Foundation — eldercare.
- Temasek Foundation — community infrastructure (also a SEA-regional funder, useful when we extend per `regional-scaling.md`).
- Lee Foundation — social services.

**Pitch:** "$X funds 5 kiosks for 12 months across 5 estates. Outputs: case-study evidence for eventual public-sector adoption."

**Magnitude:** likely $80–150k total to cover infrastructure (Cloudflare paid tier when the free tier runs out), pilot hardware (laptops + kiosk enclosures), and a half-time community manager who walks the RC onboarding.

## Cost Story

The per-kiosk cost is dominated by:

1. **Voice / AI inference** — Workers AI minutes + SEALion calls. Free tier covers the demo and probably the first ~2 weeks of a single-kiosk pilot. Paid tier estimate: ~$20–40 per kiosk per month at moderate use.
2. **Maintenance** — agency directory updates, dialect coverage refresh, occasional triage-prompt tuning. ~5 hours per month per estate at pilot stage.
3. **Hardware** — a kiosk laptop + enclosure + mounting. One-time ~$1.5k per kiosk; ~5-year depreciation.
4. **Connectivity** — Wi-Fi at the void deck. Often piggybacks on existing PA / RC infrastructure.

Total per-kiosk-per-year at pilot scale (5 kiosks): roughly **$3k–5k** in variable costs, plus the half-time community manager amortised across estates.

At 50-kiosk scale, the variable cost per kiosk drops below **$1.5k/year** because community-manager time spreads thinner per kiosk and AI usage hits provider-tier discounts.

## Optionality (Not the Headline)

Documented for completeness; not the primary pitch.

**Sponsorship / corporate CSR.** Bank or telco sponsors void-deck kiosks ("Brought to you by DBS / Singtel"). Low recurring risk, but a public-good triage tool branded with a corporate logo creates trust friction with the elderly users we serve.

**Subsidised B2C.** Charge the user nothing; recover via partner agencies / NGOs paying for triaged-case throughput. Probably not viable at SG scale.

**Open-source + services.** Release the kiosk pipeline as open source; charge for managed deployment + agency directory maintenance. Works long-term; doesn't help the first 18 months.

## Impact Beyond Revenue

**Direct:** elderly residents access services they wouldn't have reached otherwise. Hard to quantify in MVP; pilot case study captures qualitative.

**Indirect:** volunteer-hour relief at MPS / RC visits, which compounds — each hour of triage relieved is an hour redirected to higher-value resident support.

**Systemic:** structured cases create a data trail that the eldercare ecosystem (NGOs, MPs, agencies) can use to identify recurring gaps. Today this signal lives in volunteer memory and lost MPS conversations.

## What "Sustainable" Looks Like at 24 Months

- One signed B2G contract (single GRC town council or PA national pilot).
- Cost-per-kiosk-per-year figure validated at 20+ kiosks.
- Grant pipeline closed; running on contract revenue.
- Half-time → full-time community manager funded out of contract revenue.

## Risks

- **Procurement is slow.** B2G cycles are 12–24 months. Mitigation: grant-funded pilot bridges; show ROI quickly.
- **Volunteer-hour relief is hard to quantify in dollars.** Mitigation: qualitative case study + an explicit per-case time-saved metric collected during the pilot.
- **Free-tier runway evaporates.** When Cloudflare free tier limits hit, costs rise; need grant/contract by then. Mitigation: monitor usage; budget paid tier into the grant ask.
- **Public-sector buyer changes mind on procurement category.** Mitigation: keep the open-source / sponsorship paths as backstops.
