# Tech Stack

The locked stack for The Good Hack 2026 — the **GoodBois elderly voice kiosk**. **Read this before adding a dependency, picking a runtime, or wiring an integration.** Pair with `architecture.md`, `integration-boundaries.md`, and `docs/standards/data-contracts.md`.

## Product context (one paragraph)

A voice-first kiosk installed at HDB void decks. Less tech-savvy elderly residents speak to it in Mandarin, Hokkien, or other SEA languages. The kiosk **triages** their request, **signposts** them to the right agency / hotline / local resource, and for complex cases **escalates a structured case** to MP/RC volunteers (who consume cases via their existing dashboards — we do not build one). Demo runs on laptops; no real printer.

## What you can assume right now

**Locked product decisions** (don't redesign these):

- Pipeline: STT → SEALion translate (user lang → English) → LLM triage → orchestrator → tool/agent calls → SEALion translate (English → user lang) → TTS.
- Multi-turn dialogue with bounded follow-ups (1–3, then resolve or escalate).
- Anonymous by default. Identity (block/unit, alias) is optional and asked only when needed; full identity capture is a future extension tied to NGO linking. No NRIC ever.
- Bookings for the demo are simulated if time allows, otherwise scripted (preset agencies, hardcoded outcomes). No real agency APIs.
- MP/RC have their own dashboards. We **export** structured cases to them; we do not build a dashboard.
- Receipt PDF is generated server-side (Cloudflare Worker), shown full-screen on the kiosk. Printer not used in the demo.
- Multi-language target for MVP: English + Mandarin + Hokkien. Final language matrix owned by the voice-agent research subtask (Cloudflare/SEALion capability sweep).

**Frontend** — installed and wired (use without checking):

- Next.js 16 (App Router), React 19, TypeScript 5+ strict, Tailwind v4
- shadcn/ui (`style: radix-nova`, `baseColor: neutral`, lucide icons)
- ESLint with `eslint-config-next`
- `.githooks/pre-commit.ps1` + `commit-msg.ps1` (installed via `install-hooks.ps1`)

**Frontend** — planned (code against these, install when the feature lands):

- vaul (bottom sheets / modals for the kiosk shell)
- Framer Motion (listening-state animation, language-switch transitions)
- React Hook Form + Zod (only for explicit-input fallback fields)
- Sonner (toast feedback)
- date-fns (receipt timestamps, opening hours for the NTH map feature)

**Backend** — Cloudflare-only (target stack; no backend currently shipped that survives — see "Decommission" below):

- Cloudflare Workers (TypeScript) — request handlers and orchestrator
- Cloudflare Workers AI — STT, TTS, and the triage LLM
- SEALion — SEA-language translation (and possibly triage; voice-agent + backend research decide jointly)
- Cloudflare D1 — SQLite database (replaces Supabase Postgres)
- Cloudflare R2 — object storage for receipt PDFs (and any debug audio)
- Cloudflare KV — short-lived per-session state for multi-turn dialogues
- Cloudflare Pages — frontend hosting
- PDF generation in a Worker (e.g., `@pdf-lib/pdf-lib`); final library owned by the receipt-lane research

**Outstanding setup chores:**

- Pin `.nvmrc` (Node) and Wrangler version in `package.json` engines.
- Stand up a Cloudflare account + Wrangler auth; verify free-tier limits for Workers AI, D1, R2, KV.
- Create the D1 schema (driven from `data-contracts.md`).
- **Decommission**: `server/` (FastAPI), `src/lib/supabase/*`, `src/proxy.ts`, magic-link route handlers, Supabase env vars. Tracked as a separate task — do not `git rm` until that task lands.

## Architecture

```
Kiosk (Next.js on Cloudflare Pages)
   │
   │  audio in / text in (touch fallback)
   ▼
Cloudflare Worker (orchestrator)
   ├──► Workers AI: STT
   ├──► SEALion (via Cloudflare): translate user lang → English
   ├──► LLM (Workers AI): triage + tool selection
   ├──► Orchestrator tool calls (allowlisted):
   │     ├─ signpost(agencyKey)              → returns AgencyContact
   │     ├─ findNearby(category)             → reads D1; map render is NTH
   │     ├─ simulateBooking(agencyKey, slot) → returns BookingConfirmation
   │     ├─ generateReceipt(case)            → renders PDF in Worker, stores in R2
   │     └─ escalateToMpRc(case)             → writes Case in D1, fires export adapter
   ├──► SEALion: translate English → user lang
   ├──► Workers AI: TTS
   │
   ▼
audio out / response card / receipt PDF → kiosk
```

Non-negotiables for any new feature:

- **Frontend never calls Workers AI or SEALion directly.** All AI calls go through the orchestrator Worker. Frontend talks to one or two Worker endpoints only.
- **Cloudflare D1 is the only database.** No Supabase. No external Postgres. ORM choice (Drizzle vs raw `prepare()`) is a TEAM DISCUSSION item.
- **Cloudflare-first.** Pick a Cloudflare-native option before adding an external SaaS. The free tier is the budget.
- **Allowlisted tool surface.** The triage LLM picks from the registry; it cannot fabricate hotlines or agencies.
- **`mapAdapter` boundary stays.** Even though the map is NTH, feature components import from the adapter, not from `react-leaflet` directly.
- **`docs/standards/data-contracts.md` is the canonical type source.** Worker-side TS types and frontend-side TS types both conform to it. When the contract changes, update that file first, then propagate.
- **No auth surface.** Kiosk is anonymous. Magic-link auth is being removed. Don't add a new auth flow without a redesign discussion.

## Frontend (`src/`)

| Concern | Choice | Status | Notes |
|---|---|---|---|
| Framework | Next.js 16, App Router | installed | RSC for the kiosk shell; client components for live mic / listening state |
| Runtime | React 19 | installed | |
| Language | TypeScript 5+, strict | installed | No `any`, no implicit `any` |
| Styling | Tailwind CSS v4 | installed | Design tokens as CSS variables |
| Component primitives | shadcn/ui (`radix-nova`, `neutral`) | installed | Add via `npx shadcn@latest add <name>` |
| Kiosk UI shell | Custom full-screen layout, large hit targets, idle-reset timer | not yet built | See `docs/standards/ui-ux-standards.md` kiosk section |
| Bottom sheets / dialogs | vaul + shadcn dialog | planned | |
| Animation | Framer Motion | planned | Listening-state pulse, language-switch transitions |
| Map | react-leaflet + leaflet | planned (NTH) | Behind `mapAdapter`; OneMap tiles + Barrier-Free Access API |
| Icons | Lucide | installed | |
| Forms | React Hook Form + Zod | planned | Only for explicit-input fallback fields |
| Toasts | Sonner | planned | |
| Dates | date-fns | planned | Receipt timestamps |
| API client | `fetch` to Worker endpoints | default | Hand-written TS types matching `data-contracts.md`. Hono client if Worker uses Hono |
| State management | URL params + React state + KV-backed session id | default | TEAM DISCUSSION — alt: Zustand for kiosk session state |
| Lint / format | ESLint with `eslint-config-next` | installed | Run via `npm run lint` |
| Hosting | Cloudflare Pages | planned | Replaces Vercel |

## Backend (Cloudflare Workers, `workers/` — to be created)

| Concern | Choice | Status | Notes |
|---|---|---|---|
| Runtime | Cloudflare Workers (TypeScript) | not yet built | Wrangler-managed |
| HTTP framework | Hono (default) or itty-router | not yet picked | Backend lane decides; see TEAM DISCUSSION |
| Database | Cloudflare D1 (SQLite) | not yet built | One database per environment |
| Database client | Drizzle ORM (default) or raw `prepare()` | not yet picked | TEAM DISCUSSION |
| Object storage | Cloudflare R2 | not yet built | Receipt PDFs; optional debug audio |
| Session state | Cloudflare KV | not yet built | Per-session multi-turn context, expires on idle reset |
| STT | Workers AI (Whisper-class) | not yet wired | Voice-agent research confirms model |
| TTS | Workers AI TTS | not yet wired | Voice-agent research confirms model + voice |
| Translation | SEALion (via Cloudflare AI Gateway or direct) | not yet wired | Voice-agent research |
| LLM (triage) | Workers AI hosted LLM | not yet wired | Tool/function calling support is a hard requirement; SEALion considered if it supports tools |
| PDF generation | `@pdf-lib/pdf-lib` (default) | not yet picked | TEAM DISCUSSION — bidirectional / CJK font support drives the choice |

**Worker owns:**

- The orchestrator: STT → translate → triage → tool calls → translate → TTS.
- Tool implementations: `signpost`, `findNearby`, `simulateBooking`, `generateReceipt`, `escalateToMpRc`.
- D1 reads/writes for: `KioskSession`, `Utterance`, `TriageResult`, `ToolInvocation`, `Case`, `Receipt`, `AgencyContact`. NTH: `Resource`, `HazardReport`.
- MP/RC export: serialise queued `Case` rows via the export adapter (default: signed CSV download URL).

**Worker does NOT own:**

- UI rendering — handled by Next.js on Cloudflare Pages.
- Real agency integrations — out of MVP scope.
- Payments, ride booking, medical anything.

## Data

| Concern | Choice | Status | Notes |
|---|---|---|---|
| Primary DB | Cloudflare D1 | not yet built | Schema driven by `data-contracts.md` |
| Schema migrations | Drizzle Kit (if Drizzle picked) or `wrangler d1 migrations` | not yet built | |
| Seed data | D1 migration files (`migrations/0001_seed_agencies.sql`, etc.) | not yet built | Replaces the old Supabase migration plan |
| Object storage | Cloudflare R2 | not yet built | Receipt PDFs, optional debug audio |
| Session state | Cloudflare KV | not yet built | Per-session multi-turn context |

## Speech / AI

| Concern | Choice | Status | Notes |
|---|---|---|---|
| STT | Cloudflare Workers AI | not yet wired | Whisper-class model; final pick by voice-agent research |
| Translation | SEALion via Cloudflare | not yet wired | Bidirectional |
| Triage LLM | Workers AI hosted LLM | not yet wired | Tool/function calling required |
| TTS | Workers AI TTS | not yet wired | Voice / persona owned by voice-agent research |
| Languages (MVP target) | English, Mandarin, Hokkien | research | Final matrix owned by voice-agent research |
| Languages (NTH) | Cantonese, Teochew, Malay, Tamil | research | Subject to SEALion + Workers AI coverage |
| Browser fallback | Web Speech API + touch input | planned | Last-resort fallback if Cloudflare path fails on stage |

## Repo & tooling

| Concern | Choice | Status | Notes |
|---|---|---|---|
| Layout | Single repo. Frontend in `src/`. Backend in `workers/` (new). | partial — `src/` exists; `workers/` not yet created | `server/` (FastAPI) decommissioning tracked separately |
| Package manager | npm | installed | Lockfile committed |
| Lint / format (frontend) | ESLint with `eslint-config-next` | installed | Not Biome |
| Lint / format (workers) | ESLint + a Workers-friendly config | planned | |
| Type sharing | Co-located TS types in `src/types/` and `workers/types/`, both conforming to `data-contracts.md` | planned | No code-gen; hand-write to the contract |
| Pre-commit hooks | `.githooks/pre-commit.ps1` + `commit-msg.ps1` | installed | Per `CLAUDE.md` Hook Policy |
| Tests | None | n/a | Manual demo-check is the test |
| Node version | `.nvmrc` | not pinned (TODO) | |

## Hosting

| Service | Provider | Status | Why |
|---|---|---|---|
| Web app | Cloudflare Pages | planned | Free tier, co-located with Workers |
| Worker | Cloudflare Workers | planned | Free tier covers expected demo load |
| Database | Cloudflare D1 | planned | Free tier |
| Object storage | Cloudflare R2 | planned | Free tier |
| Session state | Cloudflare KV | planned | Free tier |
| Domain | `*.pages.dev` / `*.workers.dev` | planned | No custom domain |

## Env & secrets

`.env.example` checked in for the repo root. Real `.env.local` (frontend) and `workers/.dev.vars` (worker dev) never committed. Production secrets managed via `wrangler secret put`.

**Frontend (`.env.local`):**

- `NEXT_PUBLIC_KIOSK_LANG_DEFAULT` — default UI language (e.g., `en`)
- `NEXT_PUBLIC_WORKER_URL` — Worker base URL (`http://127.0.0.1:8787` in dev)

**Worker (`wrangler secret`):**

- `SEALION_API_KEY` *(only if SEALion is used outside Workers AI bindings)*
- Cloudflare bindings (D1, R2, KV, Workers AI, AI Gateway) are configured in `wrangler.toml`, not as env vars
- Future: agency API keys when bookings move past simulated

**Removed (no longer used; tracked under decommission):**

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `BACKEND_URL`
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`
- `ANTHROPIC_API_KEY`, `ONEMAP_API_TOKEN` *(may return when AI/map features are picked back up; not in MVP)*

## Decommission (separate task)

These exist in the repo but no longer fit the locked stack. Do not delete them yet — schedule a single decommission task and land it in one PR:

- `server/` — FastAPI app, Pydantic models, supabase-py client, magic-link router.
- `src/lib/supabase/*`, `src/proxy.ts`, magic-link route handlers under `src/app/`.
- Supabase env vars in `.env.example`.
- `supabase/` directory if present.
- Doc references to FastAPI / Supabase / magic-link auth in `README.md`, `AGENTS.md`, agent role files (rewritten in this same pass — see `docs/agents/subagents.md`).

## Demo-day operational notes

- **Workers cold-start is sub-50ms; no warming required.** Easier than the Fly.io setup it replaces.
- **Pre-warm Workers AI weights** by running a real call from the demo laptop ~5 minutes before the pitch.
- **Have a local fallback** for STT/TTS (browser Web Speech) wired behind a feature flag in case the venue network is flaky.
- **PDF receipt** must render in the kiosk page within ~2s; pre-warm the PDF tool path before the pitch.
- **Have a scripted demo path** (specific user utterance → known agency signpost → simulated booking → receipt) rehearsed and bookmarked; it's the safety net if dialect STT misfires.

## TEAM DISCUSSION items

Defaults stand until consensus changes them. Code against the default in the meantime.

1. **Worker HTTP framework.** Default: Hono. Alt: itty-router.
   - Hono has best DX + middleware story for a multi-route Worker. itty-router is leaner if we end up with two endpoints.
2. **Worker DB client.** Default: Drizzle ORM. Alt: raw `D1.prepare()`.
   - Drizzle gives schema migrations and shared TS types with the contract. Raw is fine if the schema stays tiny.
3. **Triage LLM model.** Default: a Workers-AI-hosted model with tool-calling support. Alt: SEALion if it ships tool-calling.
   - Owned by voice-agent + backend-lane research jointly.
4. **PDF library.** Default: `@pdf-lib/pdf-lib`. Alt: a Workers-friendly fork of PDFKit, or an HTML→PDF service.
   - Picked once we know whether we need bidirectional/CJK font support for the receipt copy.
5. **MP/RC export channel.** Default: signed CSV download URL. Alt: webhook on case escalation; alt: email via Cloudflare Email Routing.
   - Owned by whoever lands the export adapter.
6. **Front-end state management.** Default: URL params + React state + KV-backed session id. Alt: Zustand for kiosk session state.
   - Default is leaner. Zustand wins if cross-tree session state grows.
