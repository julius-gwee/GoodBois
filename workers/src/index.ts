// workers/src/index.ts
//
// GoodBois kiosk Worker entry. Vanilla fetch handler with /health and /turn.
// Dev B will migrate this to Hono in their branch; we adopt that after merge.

import type { TurnRequest, TurnResponse } from "./types/contracts";
import {
  orchestrate,
  type OrchestratorEnv,
} from "./orchestrator";

type WorkerEnv = OrchestratorEnv & {
  // Cloudflare bindings extend the same env shape; nothing else required for now.
};

const jsonHeaders = {
  "content-type": "application/json; charset=utf-8",
};

const corsHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, OPTIONS",
  "access-control-allow-headers": "content-type",
};

const worker = {
  async fetch(request: Request, env: WorkerEnv): Promise<Response> {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (request.method === "GET" && url.pathname === "/health") {
      return Response.json(
        { ok: true, service: "goodbois-worker" },
        { headers: corsHeaders }
      );
    }

    if (request.method === "POST" && url.pathname === "/turn") {
      let body: Partial<TurnRequest>;
      try {
        body = (await request.json()) as Partial<TurnRequest>;
      } catch {
        return new Response(
          JSON.stringify({
            error: { code: "INVALID_JSON", message: "Request body is not valid JSON.", fallbackAvailable: true },
          }),
          { status: 400, headers: { ...jsonHeaders, ...corsHeaders } }
        );
      }

      if (!body.kioskId || !body.language || !body.mode) {
        return new Response(
          JSON.stringify({
            error: {
              code: "INVALID_REQUEST",
              message: "kioskId, language, and mode are required.",
              fallbackAvailable: true,
            },
          }),
          { status: 400, headers: { ...jsonHeaders, ...corsHeaders } }
        );
      }

      // Bounded follow-ups: client may send turnCount via header (X-Kawan-Turn-Count)
      // or default to 0. Real KV-backed sessions are post-MVP.
      const turnCount = Number(request.headers.get("x-kawan-turn-count") ?? "0");

      try {
        const response: TurnResponse = await orchestrate(
          body as TurnRequest,
          env,
          Number.isFinite(turnCount) ? turnCount : 0
        );
        return new Response(JSON.stringify(response), {
          status: 200,
          headers: { ...jsonHeaders, ...corsHeaders },
        });
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        return new Response(
          JSON.stringify({
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
          }),
          { status: 500, headers: { ...jsonHeaders, ...corsHeaders } }
        );
      }
    }

    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { ...jsonHeaders, ...corsHeaders },
    });
  },
};

export default worker;
