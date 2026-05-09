import { Hono } from "hono";
import type { Env } from "./env";
import type { TurnRequest, TurnResponse } from "./types/contracts";

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

export default app;
