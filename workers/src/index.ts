// workers/src/index.ts
//
// GoodBois kiosk Worker entry. Hono router with:
//   GET  /health
//   POST /turn               — six-stage orchestrator (spec §2)
//   GET  /receipts/:id       — bilingual HTML render

import { Hono } from "hono";
import { cors } from "hono/cors";
import type { ResourceFilters, RouteMode, TurnRequest, TurnResponse } from "./types/contracts";
import { agencies as seedAgencies } from "./db/seeds/agencies";
import { createMemoryRepos } from "./db/memory";
import type { Repos } from "./db/repos";
import { makeD1Repos } from "./db/d1";
import { KVSessionRepo } from "./db/kv/sessions";
import { renderReceiptHtml } from "./receipt/render";
import { orchestrate, type OrchestratorEnv } from "./orchestrator";
import { makeHazardMailer } from "./integrations/email";
import { findMapResources } from "./tools/findMapResources";
import { findRoutes, type WorkerEnv } from "./tools/oneMapRouting";

export type WorkerBindings = OrchestratorEnv & WorkerEnv & {
  DB?: D1Database;
  SESSION_KV?: KVNamespace;
  WORKER_URL?: string;
  RESEND_API_KEY?: string;
  HAZARD_NOTIFY_EMAIL?: string;
  HAZARD_FROM_EMAIL?: string;
  // Opt-in flag gating dev-only routes (e.g. /dev/test-hazard). Unset/anything
  // other than "true" => those routes 404 as if absent. Never set in production.
  ENABLE_DEV_ROUTES?: string;
};

let memoryRepos: Repos | null = null;
async function getRepos(env: WorkerBindings | undefined): Promise<Repos> {
  // Production / configured-dev path: D1 for durable artifacts, KV for sessions.
  if (env?.DB && env?.SESSION_KV) {
    const d1 = await makeD1Repos(env.DB);
    return { ...d1, sessions: new KVSessionRepo(env.SESSION_KV) };
  }
  // Partial bindings are a footgun — multi-isolate prod requires both.
  if (env?.DB || env?.SESSION_KV) {
    console.warn(
      "[getRepos] Partial persistence bindings detected " +
        `(DB=${env?.DB ? "set" : "unset"}, SESSION_KV=${env?.SESSION_KV ? "set" : "unset"}). ` +
        "Falling back to in-memory repos. Configure both in wrangler.toml for production behavior.",
    );
  }
  // Fallback for local dev / tests without persistence bindings.
  if (!memoryRepos) memoryRepos = createMemoryRepos(seedAgencies);
  return memoryRepos;
}

const RECEIPT_ID_RE = /^GBR-\d{8}-\d{3}$/;

const app = new Hono<{ Bindings: WorkerBindings }>();

// Wide-open CORS: any origin, any method, any request header (reflected back
// from the preflight). The kiosk worker exposes only public, non-credentialed
// endpoints, so there's nothing a same-origin policy would protect here.
app.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["GET", "HEAD", "PUT", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: [], // empty => Hono echoes Access-Control-Request-Headers back
    exposeHeaders: ["*"],
    maxAge: 86400,
  }),
);

app.get("/health", (c) => c.json({ ok: true, service: "goodbois-worker" }));

app.get("/resources", (c) => {
  const filters: ResourceFilters = {
    query: c.req.query("query"),
    category: (c.req.query("category") as ResourceFilters["category"]) ?? "all",
    language: (c.req.query("language") as ResourceFilters["language"]) ?? "all",
  };

  return c.json({ resources: findMapResources(filters) });
});

app.post("/routes", async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as {
    destinationResourceId?: string;
    mode?: RouteMode;
  };
  const resources = findMapResources();
  const destinationResourceId = body.destinationResourceId ?? resources[0]?.id;
  const resource = resources.find((candidate) => candidate.id === destinationResourceId);
  if (!destinationResourceId || !resource) {
    return c.json(
      {
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Destination resource is not available for route rendering.",
          fallbackAvailable: true,
        },
      },
      404,
    );
  }

  const routes = await findRoutes(resource, body.mode, c.env);

  return c.json({ routes });
});

app.post("/turn", async (c) => {
  let body: Partial<TurnRequest>;
  try {
    body = (await c.req.json()) as Partial<TurnRequest>;
  } catch {
    return c.json(
      {
        error: {
          code: "INVALID_JSON",
          message: "Request body is not valid JSON.",
          fallbackAvailable: true,
        },
      },
      400,
    );
  }

  if (!body.kioskId) {
    return c.json(
      {
        error: {
          code: "INVALID_REQUEST",
          message: "kioskId is required.",
          fallbackAvailable: true,
        },
      },
      400,
    );
  }

  if (!body.audioBase64 && !body.text) {
    return c.json(
      {
        error: {
          code: "MISSING_INPUT",
          message: "Either audioBase64 or text must be provided.",
          fallbackAvailable: true,
        },
      },
      400,
    );
  }

  const workerUrl = c.env.WORKER_URL ?? new URL(c.req.url).origin;
  const hazardMailer = makeHazardMailer({
    apiKey: c.env.RESEND_API_KEY,
    recipient: c.env.HAZARD_NOTIFY_EMAIL,
    from: c.env.HAZARD_FROM_EMAIL,
  });

  try {
    const response: TurnResponse = await orchestrate(
      body as TurnRequest,
      c.env,
      { repos: await getRepos(c.env), workerUrl, hazardMailer },
    );
    return c.json(response);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return c.json(
      {
        sessionId: body.sessionId ?? `session-${Date.now()}`,
        state: "done",
        transcript: { english: "", srcLang: "en" },
        kioskMessage: "Sorry, the kiosk hit an unexpected error.",
        error: {
          code: "ORCHESTRATOR_FAILED",
          message,
          fallbackAvailable: true,
        },
      } satisfies TurnResponse,
      500,
    );
  }
});

// DEV-ONLY: trigger reportHazard directly to verify the email path before
// the Phase 7 orchestrator wires it through /turn. Remove or gate behind
// an env flag before production.
//
// This route AWAITS the mailer call (bypassing the fire-and-forget pattern)
// so any Resend API error surfaces in the response — useful for debugging.
app.post("/dev/test-hazard", async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as Partial<{
    category: string;
    location: string;
    description: string;
    sessionId: string;
    srcLang: string;
  }>;
  const hazardMailer = makeHazardMailer({
    apiKey: c.env.RESEND_API_KEY,
    recipient: c.env.HAZARD_NOTIFY_EMAIL,
    from: c.env.HAZARD_FROM_EMAIL,
  });

  if (!hazardMailer) {
    return c.json(
      {
        ok: false,
        error: "MAILER_NOT_CONFIGURED",
        recipient: c.env.HAZARD_NOTIFY_EMAIL ?? null,
        hasApiKey: Boolean(c.env.RESEND_API_KEY),
      },
      500,
    );
  }

  const referenceId = `HZ-TEST-${Date.now()}`;
  const input = {
    category: body.category ?? "lighting",
    location: body.location ?? "Block 123 void deck (test)",
    description: body.description ?? "Test hazard report — please ignore",
    referenceId,
    routedTo: "town-council",
    sessionId: body.sessionId ?? `test-${Date.now()}`,
    srcLang: body.srcLang ?? "en-SG",
  };

  try {
    await hazardMailer(input);
    return c.json({
      ok: true,
      referenceId,
      recipient: c.env.HAZARD_NOTIFY_EMAIL ?? null,
    });
  } catch (e) {
    const err = e as Error;
    console.error("[/dev/test-hazard] mailer error:", err);
    return c.json(
      {
        ok: false,
        error: "MAILER_FAILED",
        message: err.message,
        recipient: c.env.HAZARD_NOTIFY_EMAIL ?? null,
      },
      500,
    );
  }
});

app.get("/receipts/:id", async (c) => {
  const id = c.req.param("id");
  if (!RECEIPT_ID_RE.test(id)) {
    return c.json({ code: "INVALID_ID", message: "Receipt id format is wrong." }, 400);
  }
  const r = await getRepos(c.env);
  const receipt = await r.receipts.getById(id);
  if (!receipt) return c.json({ code: "NOT_FOUND", message: "Receipt not found." }, 404);
  const agency = receipt.signpostedAgencyKey
    ? ((await r.agencies.getByKey(receipt.signpostedAgencyKey)) ?? undefined)
    : undefined;
  const html = renderReceiptHtml({ receipt, agency });
  return c.html(html);
});

export default app;
