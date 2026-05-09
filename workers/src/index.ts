// workers/src/index.ts
//
// GoodBois kiosk Worker entry. Hono router with:
//   GET  /health
//   POST /turn               — six-stage orchestrator (spec §2)
//   GET  /receipts/:id       — bilingual HTML render

import { Hono } from "hono";
import { cors } from "hono/cors";
import type { TurnRequest, TurnResponse } from "./types/contracts";
import { agencies as seedAgencies } from "./db/seeds/agencies";
import { createMemoryRepos } from "./db/memory";
import type { Repos } from "./db/repos";
import { renderReceiptHtml } from "./receipt/render";
import { orchestrate, type OrchestratorEnv } from "./orchestrator";

export type WorkerBindings = OrchestratorEnv & {
  WORKER_URL?: string;
};

let repos: Repos | null = null;
function getRepos(): Repos {
  if (!repos) repos = createMemoryRepos(seedAgencies);
  return repos;
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

  const workerUrl = c.env.WORKER_URL ?? new URL(c.req.url).origin;

  try {
    const response: TurnResponse = await orchestrate(
      body as TurnRequest,
      c.env,
      { repos: getRepos(), workerUrl },
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

app.get("/receipts/:id", async (c) => {
  const id = c.req.param("id");
  if (!RECEIPT_ID_RE.test(id)) {
    return c.json({ code: "INVALID_ID", message: "Receipt id format is wrong." }, 400);
  }
  const r = getRepos();
  const receipt = await r.receipts.getById(id);
  if (!receipt) return c.json({ code: "NOT_FOUND", message: "Receipt not found." }, 404);
  const agency = receipt.signpostedAgencyKey
    ? ((await r.agencies.getByKey(receipt.signpostedAgencyKey)) ?? undefined)
    : undefined;
  const html = renderReceiptHtml({ receipt, agency });
  return c.html(html);
});

export default app;
