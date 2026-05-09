import { Hono } from "hono";
import type { Env } from "./env";
import type { TurnRequest, TurnResponse } from "./types/contracts";
import { agencies as seedAgencies } from "./db/seeds/agencies";
import { createMemoryRepos } from "./db/memory";
import type { Repos } from "./db/repos";
import { renderReceiptHtml } from "./receipt/render";

let repos: Repos | null = null;
function getRepos(): Repos {
  if (!repos) repos = createMemoryRepos(seedAgencies);
  return repos;
}

const RECEIPT_ID_RE = /^GBR-\d{8}-\d{3}$/;

const app = new Hono<Env>();

app.get("/health", (c) => c.json({ ok: true, service: "goodbois-worker" }));

app.post("/turn", async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as Partial<TurnRequest>;
  const response: TurnResponse = {
    sessionId: body.sessionId ?? "demo-session-unwired",
    state: "error",
    kioskMessage: {
      original: "The GoodBois Worker scaffold is ready, but /turn is not implemented yet.",
      english: "The GoodBois Worker scaffold is ready, but /turn is not implemented yet.",
      language: body.language ?? "en",
    },
    nextActions: ["type", "reset"],
    error: {
      code: "TURN_NOT_IMPLEMENTED",
      message:
        "Wire this endpoint to golden demo fixtures first, then replace with the real orchestrator.",
      fallbackAvailable: true,
    },
  };
  return c.json(response, 501);
});

app.get("/receipts/:id", async (c) => {
  const id = c.req.param("id");
  if (!RECEIPT_ID_RE.test(id)) {
    return c.json({ code: "INVALID_ID", message: "Receipt id format is wrong." }, 400);
  }
  const r = getRepos();
  const receipt = await r.receipts.getById(id);
  if (!receipt) return c.json({ code: "NOT_FOUND", message: "Receipt not found." }, 404);
  const linkedCase = receipt.caseId ? (await r.cases.getById(receipt.caseId)) ?? undefined : undefined;
  const html = renderReceiptHtml({ receipt, case: linkedCase });
  return c.html(html);
});

export default app;
