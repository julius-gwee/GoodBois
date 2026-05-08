# Tech Stack

The locked stack for The Good Hack 2026 / Care Access Map. **Read this before adding a dependency, picking a transport, or wiring auth.** Pair with `architecture.md`, `integration-boundaries.md`, and `docs/standards/data-contracts.md`.

## What you can assume right now

**Installed and wired.** Use without checking:

- **Web (`src/`):** Next.js 16 (App Router), React 19, TypeScript 5+ strict, Tailwind v4, shadcn/ui (`style: radix-nova`, `baseColor: neutral`, lucide icons), ESLint with `eslint-config-next`, `@supabase/ssr` + `@supabase/supabase-js` (server-side only).
- **API (`server/`):** FastAPI + Uvicorn, Pydantic v2, `supabase-py`, `python-dotenv`, httpx. `/health` already exposed. Docker Compose ready.
- **Auth:** Supabase magic-link, proxied through FastAPI. `src/proxy.ts` gates protected routes; session lives in HttpOnly cookies via `@supabase/ssr` — **never** in browser-side JS.
- **Hooks:** `.githooks/pre-commit.ps1` + `commit-msg.ps1`, installed via `install-hooks.ps1`.

**Planned — code against these as the chosen tools, install when the feature lands:**

- **Web:** vaul (bottom sheets), Framer Motion, react-leaflet + leaflet, React Hook Form + Zod, Sonner, date-fns, `openapi-typescript`.
- **API:** LangChain (`langchain`, `langchain-anthropic`, `langchain-core`), Anthropic SDK, ruff. `python-jose` only if user-JWT verification is later required.
- **Speech:** Web Speech API + browser `SpeechSynthesis` (browser-native).

**Outstanding setup chores:**

- Pin `.nvmrc` (Node) and `.python-version` (Python 3.11+).
- Add Vercel preview + prod domains to FastAPI CORS (`server/main.py:11` allows `http://localhost:3000` only).
- Install LangChain + Anthropic SDK and add `ANTHROPIC_API_KEY` only when the first AI feature lands.

## Architecture

```
Browser ──► Next.js (Vercel)
              │
              ├──► Next.js Route Handlers
              │       └──► FastAPI (Fly.io)
              │              ├──► Supabase Auth      (sign_in_with_otp, admin ops)
              │              └──► Supabase Postgres  (CRUD via supabase-py)
              │
              └──► Server-side Supabase SSR client
                     (cookie-based session, /auth/callback, middleware refresh)
```

Non-negotiables for any new feature:

- **The browser never imports or calls Supabase directly.** All Supabase reads/writes go through Next.js server-side code or FastAPI. This applies to Realtime too — if we want live updates, route them through FastAPI (server-sent events or a poll endpoint), not a direct browser subscription.
- **Magic-link auth is the shipped path.** Browser → `POST /api/auth/send-magic-link` → FastAPI → `supabase.auth.sign_in_with_otp` → email link → `/auth/callback` server-side exchange. Do not add an anon-session "View as" role switcher; mock post-auth state with seeded users if the demo needs it.
- **RLS is not user-scoped in MVP.** FastAPI uses `supabase_admin` (service role) and `supabase` (anon) only — see `server/supabase_client.py`. Auth-sensitive logic lives in FastAPI route handlers and Pydantic models, not in per-user RLS policies. `SUPABASE_JWT_SECRET` is therefore not needed.
- **Map provider stays behind a `mapAdapter`.** Feature components import from the adapter, never `react-leaflet` or `leaflet` directly. Canonical coordinates are WGS84 lat/lng; provider-specific references live only in `Resource.mapProviderReference` and stay optional.
- **`docs/standards/data-contracts.md` is the canonical type source.** Pydantic models and any future `openapi-typescript` output conform to it. When the contract changes, update that file first, then propagate.

## Web (`src/`)

| Concern | Choice | Status | Notes |
|---|---|---|---|
| Framework | Next.js 16, App Router | installed | RSC for static + SSR; calls FastAPI for data |
| Runtime | React 19 | installed | |
| Language | TypeScript 5+, strict mode | installed | No `any`, no implicit `any` |
| Styling | Tailwind CSS v4 | installed | Design tokens as CSS variables |
| Component primitives | shadcn/ui (`style: radix-nova`, `baseColor: neutral`) | installed (button only so far) | Add via `npx shadcn@latest add <name>` |
| Mobile sheets | vaul | planned | Bottom-sheet primitive — core to the phone-first feel |
| Animation | Framer Motion | planned | Sheet transitions, marker selection, verification-badge motion |
| Map | react-leaflet + leaflet | planned | Behind a `mapAdapter`; OneMap tile URL + Barrier-Free Access API client wrapper |
| Icons | Lucide | installed | shadcn's default set |
| Fonts | next/font | available | Self-hosted Google Fonts |
| Forms | React Hook Form + Zod | planned | Zod schemas regenerated from FastAPI OpenAPI; conform to `data-contracts.md` |
| Toasts | Sonner | planned | Submission queued / verified / error |
| Dates | date-fns | planned | Opening hours + "last verified 12 days ago" |
| API client | `fetch` wrapper + types from `openapi-typescript` | planned | Generated TS types in `src/types/api.ts`; no hand-written API types |
| State management | URL search params + React state | default | TEAM DISCUSSION — alt: Zustand |
| Client data fetching | RSC for initial load + browser `fetch` for mutations; server-mediated for live updates | default | TEAM DISCUSSION — alt: TanStack Query |
| Lint / format | ESLint with `eslint-config-next` | installed | Run via `npm run lint` |
| Supabase client | `@supabase/ssr` + `@supabase/supabase-js`, server-side only | installed | Never imported in client components |

## API (`server/`)

| Concern | Choice | Status | Notes |
|---|---|---|---|
| Runtime | Python 3.11+ | not pinned (TODO) | Add `.python-version` |
| Framework | FastAPI + Uvicorn | installed | Auto OpenAPI at `/docs`; `/health` already exposed |
| Models | Pydantic v2 | installed | Conform to `data-contracts.md` |
| Database client | `supabase-py` | installed | `supabase_admin` (service role) for privileged ops, `supabase` (anon) for RLS-respecting reads. No user-JWT forwarding |
| Auth | Supabase magic-link via `sign_in_with_otp` | installed | Browser never holds a Supabase JWT |
| LLM orchestration | LangChain (`langchain`, `langchain-anthropic`, `langchain-core`) | planned | Used inside FastAPI route handlers when AI features are picked up |
| LLM provider | Anthropic | planned | |
| HTTP client | httpx | installed | |
| CORS | `fastapi.middleware.cors` | installed | Currently `http://localhost:3000` only — add Vercel domains before deploy |
| Lint / format | ruff | planned | One tool, fast |
| Deps | `pip` + `requirements.txt` | installed | `uv` welcome if anyone wants it |

**FastAPI owns:**

- All CRUD: resources, submissions, verifications, issue reports.
- Business logic: needs-recheck calculation, status transitions, duplicate detection.
- AI endpoints when picked up: smart search, submission triage, voice agent text handling, WhatsApp card generation.
- OneMap proxy where helpful (keeps the OneMap token server-side).
- Live-update transport for the admin demo, if Realtime stays in scope.

**FastAPI does NOT own:**

- Auth UI rendering — handled by Next.js.
- Speech recognition / synthesis — browser-native (see Speech section).

## Supabase

| Concern | Choice | Status | Notes |
|---|---|---|---|
| Database | Supabase Postgres | local config in `supabase/config.toml`; `supabase/migrations/` empty | Free tier in cloud |
| Auth | Supabase Auth, magic-link via FastAPI | installed | No anon-session role switcher |
| Realtime | Routed through FastAPI; browser does not subscribe directly | not yet built | Defer if MVP doesn't need live updates |
| Storage | Supabase Storage | not configured | Only if photos move beyond stubbed |
| Types | Conform to `data-contracts.md`. `supabase gen types typescript` (web) and hand-written Pydantic (api) generate downstream | not yet wired | `data-contracts.md` is canonical |
| ORM | None — `supabase-py` direct queries | installed | TEAM DISCUSSION — alt: SQLAlchemy / SQLModel |

## Speech (only when the voice agent is built)

| Concern | Choice | Status | Notes |
|---|---|---|---|
| Speech-to-text | Web Speech API (browser) | planned | TEAM DISCUSSION — alt: OpenAI Whisper API via FastAPI |
| Text-to-speech | Browser `SpeechSynthesis` API | planned | TEAM DISCUSSION — alt: ElevenLabs via FastAPI |

All voice flows must have a text/touch fallback per `integration-boundaries.md`.

## Repo & tooling

| Concern | Choice | Status | Notes |
|---|---|---|---|
| Layout | Single repo, `src/` (Next.js) + `server/` (FastAPI) | installed | No Turborepo |
| Package manager (web) | npm | installed | Lockfile committed |
| Lint / format (web) | ESLint with `eslint-config-next` | installed | Not Biome |
| Type sync | `openapi-typescript` against FastAPI's `/openapi.json` | planned | Generated TS types in `src/types/api.ts` |
| Pre-commit hooks | `.githooks/pre-commit.ps1` + `commit-msg.ps1` | installed | Installed via `install-hooks.ps1`. Per `CLAUDE.md` Hook Policy: secret scan, cross-lane edit warnings, doc-update reminders |
| Tests | None | n/a | Manual demo-check is the test |
| Node version | `.nvmrc` | not pinned (TODO) | |
| Python version | `.python-version` | not pinned (TODO) | |

## Hosting

| Service | Provider | Status | Why |
|---|---|---|---|
| Web app | Vercel | planned | Per-branch preview deploys for demo prep |
| API server | Fly.io | planned | **Must stay warm during demo** — disable scale-to-zero on demo days, ping `/health` every minute from the laptop |
| DB / auth / storage / realtime | Supabase Cloud | planned (using local CLI today) | Free tier is enough |
| Domain | `*.vercel.app` | planned | No custom domain |

## Env & secrets

`.env.example` checked in for the repo root (Next.js) and `server/`. Real `.env.local` (web) and `server/.env` (api) never committed. Production env vars set in Vercel + Fly.io dashboards.

**Web (root `.env.local`):**

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `BACKEND_URL` — `http://localhost:8000` in dev, Fly.io URL in prod

**API (`server/.env`):**

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ANTHROPIC_API_KEY` *(planned — only when AI features land)*
- `ONEMAP_API_TOKEN` *(planned — if proxying OneMap server-side)*
- Optional: `ELEVENLABS_API_KEY`, `OPENAI_API_KEY` if alt TTS/STT chosen
- `SUPABASE_JWT_SECRET` is **not** required — RLS is not user-scoped in MVP

## Demo-day operational notes

- **Never scale FastAPI to zero on demo days.** Cold start during the pitch is unrecoverable.
- **Keep a `/health` ping running** from one team laptop during the pitch as insurance.
- **Vercel previews** can point at the prod FastAPI URL — no need for a separate API preview environment.
- **CORS** must include the Vercel preview + prod domains before the first deploy.

## TEAM DISCUSSION items

Defaults stand until consensus changes them. Code against the default in the meantime.

1. **State management.** Default: URL params + React state. Alt: Zustand.
   - Default keeps filter state shareable via URL and avoids a dep. Zustand wins if cross-tree state grows past a couple of values.
2. **Client-side data fetching.** Default: RSC for initial load + `fetch` for mutations. Alt: TanStack Query.
   - Default is leaner. TanStack Query wins if we end up doing lots of optimistic UI or client-driven mutations.
3. **API ORM.** Default: `supabase-py` direct queries from FastAPI. Alt: SQLAlchemy or SQLModel.
   - Default is fastest to ship and matches Supabase's grain. SQLModel is the cleanest step up if we want typed query building.
4. **Speech-to-text.** Default: Web Speech API in the browser. Alt: OpenAI Whisper API via FastAPI.
   - Default is free and instant but accuracy varies for SG accents. Whisper API is more robust but costs latency and a paid key.
5. **Text-to-speech.** Default: browser `SpeechSynthesis`. Alt: ElevenLabs via FastAPI.
   - Default is free and zero-setup. ElevenLabs gives a warmer demo voice if we lean into the voice-agent showcase.
