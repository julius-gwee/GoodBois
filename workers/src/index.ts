// workers/src/index.ts
//
// GoodBois kiosk Worker entry. Hono router with:
//   GET  /health
//   POST /turn               (Lane A — orchestrator)
//   GET  /receipts/:id       (Lane B — bilingual HTML)
//   GET  /export/cases.csv   (Lane B — token-gated)

import { Hono } from "hono";
import { cors } from "hono/cors";
import type { TurnRequest, TurnResponse } from "./types/contracts";
import { agencies as seedAgencies } from "./db/seeds/agencies";
import { createMemoryRepos } from "./db/memory";
import type { Repos } from "./db/repos";
import { renderReceiptHtml } from "./receipt/render";
import { casesToCsv } from "./export/casesCsv";
import { orchestrate, type OrchestratorEnv } from "./orchestrator";

// Worker bindings — superset of Dev B's Env (EXPORT_TOKEN, WORKER_URL) plus
// Lane A's AI adapter env vars.
export type WorkerBindings = OrchestratorEnv & {
  EXPORT_TOKEN: string;
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
    allowHeaders: ["content-type", "x-kawan-turn-count"],
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

  if (!body.kioskId || !body.language || !body.mode) {
    return c.json(
      {
        error: {
          code: "INVALID_REQUEST",
          message: "kioskId, language, and mode are required.",
          fallbackAvailable: true,
        },
      },
      400,
    );
  }

  const turnCount = Number(c.req.header("x-kawan-turn-count") ?? "0");
  const workerUrl = c.env.WORKER_URL ?? new URL(c.req.url).origin;

  try {
    const response: TurnResponse = await orchestrate(
      body as TurnRequest,
      c.env,
      {
        repos: getRepos(),
        workerUrl,
        turnCount: Number.isFinite(turnCount) ? turnCount : 0,
      },
    );
    return c.json(response);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return c.json(
      {
        sessionId: body.sessionId ?? `session-${Date.now()}`,
        state: "error",
        kioskMessage: {
          original: "Sorry, the kiosk hit an unexpected error.",
          english: "Sorry, the kiosk hit an unexpected error.",
          language: body.language,
        },
        nextActions: ["reset"],
        error: {
          code: "ORCHESTRATOR_FAILED",
          message,
          fallbackAvailable: true,
        },
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
  const r = getRepos();
  const receipt = await r.receipts.getById(id);
  if (!receipt) return c.json({ code: "NOT_FOUND", message: "Receipt not found." }, 404);
  const linkedCase = receipt.caseId
    ? ((await r.cases.getById(receipt.caseId)) ?? undefined)
    : undefined;
  const html = renderReceiptHtml({ receipt, case: linkedCase });
  return c.html(html);
});

app.get("/export/cases.csv", async (c) => {
  const token = c.req.query("token");
  const expected = c.env.EXPORT_TOKEN;
  if (!expected || !token || !constantTimeEqual(token, expected)) {
    return c.json({ code: "UNAUTHORIZED", message: "Invalid or missing token." }, 401);
  }
  const r = getRepos();
  const cases = await r.cases.listForExport();
  const now = new Date().toISOString();
  for (const x of cases) await r.cases.markExported(x.id, now);
  const csv = casesToCsv(cases);
  return new Response(csv, {
    status: 200,
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="goodbois-cases-${now.slice(0, 10)}.csv"`,
    },
  });
});

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export default app;
