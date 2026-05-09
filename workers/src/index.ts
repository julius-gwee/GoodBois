// workers/src/index.ts
//
// GoodBois kiosk Worker entry. Hono router with:
//   GET  /health
//   POST /turn               — Phase 7: real orchestrator (currently a stub)
//   GET  /receipts/:id       — bilingual HTML render
//
// Removed in the 2026-05-09 refactor (per docs/refactor/2026-05-09-llm-turn-decision.md):
//   - GET  /resources
//   - POST /routes
//   - GET  /export/cases.csv

import { Hono } from "hono";
import { cors } from "hono/cors";
import type { TurnRequest, TurnResponse } from "./types/contracts";
import { agencies as seedAgencies } from "./db/seeds/agencies";
import { createMemoryRepos } from "./db/memory";
import type { Repos } from "./db/repos";
import { makeD1Repos } from "./db/d1";
import { renderReceiptHtml } from "./receipt/render";
import { makeHazardMailer } from "./integrations/email";

export type WorkerBindings = {
  AI?: {
    run: (model: string, input: unknown) => Promise<{ text?: string; response?: string }>;
  };
  DB?: D1Database;
  SEALION_API_KEY?: string;
  SEALION_BASE_URL?: string;
  WORKER_URL?: string;
  RESEND_API_KEY?: string;
  HAZARD_NOTIFY_EMAIL?: string;
  HAZARD_FROM_EMAIL?: string;
};

let memoryRepos: Repos | null = null;
async function getRepos(env: WorkerBindings | undefined): Promise<Repos> {
  if (env?.DB) return makeD1Repos(env.DB);
  // Fallback for local dev / tests without a D1 binding.
  if (!memoryRepos) memoryRepos = createMemoryRepos(seedAgencies);
  return memoryRepos;
}

const RECEIPT_ID_RE = /^GBR-\d{8}-\d{3}$/;

const app = new Hono<{ Bindings: WorkerBindings }>();

app.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["content-type"],
  }),
);

app.get("/health", (c) => c.json({ ok: true, service: "goodbois-worker" }));

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

  // TODO Phase 7: wire the real orchestrator (six-stage flow per spec §2).
  // For now return a placeholder so Dev B / Dev C can integration-test their
  // tools against the route shape.
  const sessionId = body.sessionId ?? `session-${Date.now()}`;

  // Mailer is built here and passed into ToolCtx when the orchestrator is wired.
  // When invokeTool is called in the Phase 7 orchestrator, include hazardMailer in ToolCtx:
  //   const ctx: ToolCtx = { repos, workerUrl, sessionId, srcLang, hazardMailer, priorToolResults: {} };
  const hazardMailer = makeHazardMailer({
    apiKey: c.env.RESEND_API_KEY,
    recipient: c.env.HAZARD_NOTIFY_EMAIL,
    from: c.env.HAZARD_FROM_EMAIL,
  });
  const response: TurnResponse = {
    sessionId,
    state: "done",
    transcript: { english: body.text ?? "", srcLang: "en" },
    kioskMessage: "Orchestrator not implemented yet.",
    error: {
      code: "ORCHESTRATOR_NOT_IMPLEMENTED",
      message: "POST /turn is stubbed pending Phase 7 rewrite.",
      fallbackAvailable: true,
    },
  };
  return c.json(response);
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
