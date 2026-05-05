# Hackathon Starter — Next.js + FastAPI + Supabase

A batteries-included starter template for hackathons.

**Stack:** Next.js 16 · TypeScript · Tailwind CSS · FastAPI · Supabase (Auth + Database)

---

## Architecture

```
Browser (Next.js client)
  │
  │  fetch("/api/...")
  ▼
Next.js Route Handlers   ←── Supabase SSR session management (server-side only)
  │
  │  fetch("http://localhost:8000/...")
  ▼
FastAPI backend (server/)
  │
  │  supabase-py
  ▼
Supabase (Auth + Database)
```

**Key principle:** The browser never imports or calls Supabase directly. All Supabase interactions happen server-side — either in the FastAPI backend or in Next.js server-side code (session refresh, auth callback).

---

## Features

- ✅ **Next.js App Router** with TypeScript and Tailwind CSS
- ✅ **FastAPI backend** (`server/`) — all Supabase data/auth queries run here
- ✅ **No Supabase client in the browser** — frontend only calls Next.js API routes
- ✅ **Supabase Auth** — magic-link sign-in proxied through FastAPI
- ✅ **Protected routes** via Next.js proxy
- ✅ **Local Supabase** — `supabase/config.toml` for `supabase start` (Docker)
- ✅ **Docker Compose** for the FastAPI backend

---

## Quick Start

### 1. Clone & install Next.js dependencies

```bash
git clone <your-repo-url>
cd <your-repo>
npm install
```

### 2. Start local Supabase (requires [Supabase CLI](https://supabase.com/docs/guides/cli) + Docker)

```bash
supabase start
```

This spins up local PostgreSQL, Auth, Storage, and Studio using Docker.  
After startup the CLI prints your local `URL`, `anon key`, and `service_role key`.

Open the Studio dashboard: [http://localhost:54323](http://localhost:54323)  
Outgoing emails are caught by Inbucket: [http://localhost:54324](http://localhost:54324)

To stop:

```bash
supabase stop
```

### 3. Configure environment variables

**Next.js** — copy and fill in:

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<local-anon-key-from-supabase-start>
BACKEND_URL=http://localhost:8000
```

**FastAPI backend** — copy and fill in:

```bash
cp server/.env.example server/.env
```

```env
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_ANON_KEY=<local-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<local-service-role-key>
```

### 4. Start the FastAPI backend

**Option A — Docker Compose (recommended):**

```bash
docker compose up --build
```

**Option B — directly:**

```bash
cd server
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

FastAPI runs at [http://localhost:8000](http://localhost:8000).  
Interactive docs: [http://localhost:8000/docs](http://localhost:8000/docs)

### 5. Start the Next.js development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 6. Configure the auth redirect URL

In the local Supabase Studio (**Authentication → URL Configuration**) add:

```
http://localhost:3000/auth/callback
```

For cloud Supabase, add the same in your project dashboard.

---

## Project Structure

```
.
├── src/                              # Next.js app
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   └── send-magic-link/route.ts  # Proxy → FastAPI /auth/send-magic-link
│   │   │   └── example/route.ts              # Proxy → FastAPI /example/
│   │   ├── auth/
│   │   │   └── callback/route.ts    # OAuth / magic-link exchange (server-side)
│   │   ├── dashboard/page.tsx       # Protected dashboard page
│   │   ├── login/page.tsx           # Sign-in form (no Supabase in browser)
│   │   └── page.tsx                 # Home page
│   ├── lib/
│   │   └── supabase/
│   │       ├── server.ts            # Server-side Supabase client (SSR session mgmt)
│   │       └── middleware.ts        # Session refresh helper
│   └── proxy.ts                     # Route protection proxy
│
├── server/                          # FastAPI backend
│   ├── main.py                      # App entry point + CORS
│   ├── supabase_client.py           # Supabase admin + anon clients
│   ├── routers/
│   │   ├── auth.py                  # POST /auth/send-magic-link
│   │   └── example.py               # GET /example/
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
│
├── supabase/                        # Local Supabase (CLI)
│   ├── config.toml                  # `supabase start` configuration
│   └── migrations/                  # DB migrations (supabase migration new <name>)
│
├── docker-compose.yml               # Runs the FastAPI backend
└── .env.example                     # Next.js environment variables
```

---

## Auth Flow

1. User visits `/login` and submits their email.
2. Next.js calls `POST /api/auth/send-magic-link` (server-side proxy).
3. FastAPI calls `supabase.auth.sign_in_with_otp(...)` — Supabase sends the email.
4. User clicks the link → redirected to `/auth/callback?code=...`.
5. Next.js callback exchanges the code for a session (server-side) and redirects to `/dashboard`.
6. All routes except `/`, `/login`, and `/auth/**` require authentication (enforced in `src/proxy.ts`).

---

## Customizing

| What | Where |
|------|-------|
| Add a new API endpoint | `server/routers/` |
| Add database queries | `server/routers/example.py` |
| Add a DB migration | `supabase migration new <name>` |
| Change protected routes | `src/proxy.ts` |
| Add OAuth providers | `server/routers/auth.py` |
| Add new Next.js pages | `src/app/<name>/page.tsx` |

---

## Using a Cloud Supabase Project

Replace the local URLs/keys with the values from  
**Supabase dashboard → Settings → API**:

```env
# .env.local (Next.js)
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>

# server/.env (FastAPI)
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
```

---

## Deploying

**Next.js** → [Vercel](https://vercel.com) (set env vars in project settings)  
**FastAPI** → any container host (Railway, Render, Fly.io, etc.) using the `server/Dockerfile`  
**Database** → cloud Supabase project (free tier available)


