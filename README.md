# GoodBois

A voice-first kiosk for less tech-savvy elderly residents in HDB void decks. Speaks Mandarin, Hokkien, and other SEA languages. Triages requests, signposts to the right agency / hotline / local resource, and escalates complex cases to MP/RC volunteers as structured cases.

Built for **The Good Hack 2026**.

**Stack:** Next.js 16 (Cloudflare Pages) · TypeScript · Tailwind v4 + shadcn/ui · Cloudflare Workers · Cloudflare Workers AI (STT / TTS / LLM) · SEALion (translation) · Cloudflare D1 / R2 / KV

For the locked stack and architecture, read `docs/system-design/tech-stack.md`. For the product brief, read `docs/care-access-map-prd-and-backlog.md`.

---

## Pipeline

```
Resident speaks (Mandarin / Hokkien / English / …)
   │
   ▼
Cloudflare Worker (orchestrator)
   ├─ STT (Workers AI)
   ├─ Translate user → English (SEALion)
   ├─ LLM triage + tool selection (Workers AI)
   ├─ Tool calls (signpost / findNearby / simulateBooking / generateReceipt / escalateToMpRc)
   ├─ Translate English → user (SEALion)
   └─ TTS (Workers AI)
   │
   ▼
Kiosk plays response, shows on-screen card or full-screen receipt PDF
```

**Key principle:** the frontend never calls Workers AI or SEALion directly. All AI calls go through the orchestrator Worker.

---

## Quick Start

> **Note:** the repo currently includes a FastAPI + Supabase scaffold (`server/`, `src/lib/supabase/*`, `src/proxy.ts`). These are scheduled for decommission as part of the Cloudflare migration. Until that lands, ignore them; the new build sits in `src/` (frontend) + `workers/` (backend, to be created).

### 1. Clone & install

```bash
git clone <your-repo-url>
cd <your-repo>
npm install
```

### 2. Frontend dev server

```bash
npm run dev
```

Open `http://localhost:3000`.

### 3. Worker dev (once the Worker is scaffolded)

```bash
# First time:
npm install -g wrangler
wrangler login

# Per session:
cd workers
wrangler dev
```

The Worker runs at `http://127.0.0.1:8787`. Frontend reads `NEXT_PUBLIC_WORKER_URL` to find it.

### 4. Configure environment variables

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_WORKER_URL=http://127.0.0.1:8787
NEXT_PUBLIC_KIOSK_LANG_DEFAULT=en
```

Worker secrets are managed via `wrangler secret put` — see `docs/system-design/tech-stack.md` "Env & secrets".

---

## Project Structure (target)

```
.
├── src/                   # Next.js kiosk frontend
│   ├── app/               # App Router routes
│   ├── components/
│   │   ├── ui/            # shadcn primitives
│   │   ├── atoms/         # reusable kiosk controls
│   │   └── kiosk/         # kiosk feature composites
│   ├── lib/
│   └── types/             # TS types matching data-contracts.md
│
├── workers/               # Cloudflare Worker backend (orchestrator + tools)
│   ├── src/
│   │   ├── orchestrator/
│   │   ├── tools/
│   │   ├── ai/            # STT / TTS / translate / LLM clients
│   │   ├── db/            # D1 access (Drizzle or raw)
│   │   └── pdf/
│   ├── migrations/        # D1 SQL migrations
│   └── wrangler.toml
│
└── docs/
    ├── system-design/
    │   ├── tech-stack.md           # SSOT for stack + architecture rules
    │   ├── architecture.md
    │   └── integration-boundaries.md
    ├── standards/
    │   ├── data-contracts.md       # canonical types
    │   ├── product-principles.md
    │   └── ui-ux-standards.md
    ├── hackathon/
    │   ├── mvp-execution-plan.md
    │   └── definition-of-done.md
    └── care-access-map-prd-and-backlog.md   # kiosk PRD (filename predates the pivot)
```

---

## Documentation

For new team members and AI agents:

1. `docs/START_HERE_FOR_NEW_AGENTS.md`
2. `AGENTS.md` (or `CLAUDE.md` / `.codex/skills/care-access-map/SKILL.md` for tool-specific rules)
3. `docs/care-access-map-prd-and-backlog.md` — kiosk PRD
4. `docs/system-design/tech-stack.md` — locked stack
5. `docs/standards/data-contracts.md` — canonical types
6. `docs/strategy/judging-criteria-alignment.md` — the rubric we're optimising for, plus GTM / sustainability / regional-scaling docs in the same folder

---

## Deploying

- **Frontend** → Cloudflare Pages
- **Worker** → Cloudflare Workers (`wrangler deploy`)
- **Data** → Cloudflare D1, R2, KV (free tier covers expected demo load)
