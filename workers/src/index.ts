import type { TurnRequest, TurnResponse } from "./types/contracts";
import type { ResourceFilters, RouteMode } from "./types/contracts";
import { findNearby } from "./tools/findNearby";
import { findRoutes, type WorkerEnv } from "./tools/oneMapRouting";

const jsonHeaders = {
  "content-type": "application/json; charset=utf-8",
};

const corsHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, OPTIONS",
  "access-control-allow-headers": "content-type, authorization",
  "access-control-max-age": "86400",
};

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return Response.json(body, {
    ...init,
    headers: {
      ...jsonHeaders,
      ...corsHeaders,
      ...init.headers,
    },
  });
}

const worker = {
  async fetch(request: Request, env: WorkerEnv = {}): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    if (request.method === "GET" && url.pathname === "/health") {
      return jsonResponse({ ok: true, service: "goodbois-worker" });
    }

    if (request.method === "GET" && url.pathname === "/resources") {
      const filters: ResourceFilters = {
        query: url.searchParams.get("query") ?? undefined,
        category: (url.searchParams.get("category") as ResourceFilters["category"]) ?? "all",
        language: (url.searchParams.get("language") as ResourceFilters["language"]) ?? "all",
      };

      return jsonResponse({ resources: findNearby(filters) });
    }

    if (request.method === "POST" && url.pathname === "/routes") {
      const body = (await request.json().catch(() => ({}))) as {
        destinationResourceId?: string;
        mode?: RouteMode;
      };
      const destinationResourceId = body.destinationResourceId ?? "senior-corner";
      const resource = findNearby().find((candidate) => candidate.id === destinationResourceId);
      const routes = await findRoutes(resource, body.mode, env);

      return jsonResponse({ routes });
    }

    if (request.method === "POST" && url.pathname === "/turn") {
      const body = (await request.json().catch(() => ({}))) as Partial<TurnRequest>;
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
          message: "Wire this endpoint to golden demo fixtures first, then replace with the real orchestrator.",
          fallbackAvailable: true,
        },
      };

      return new Response(JSON.stringify(response), {
        status: 501,
        headers: {
          ...jsonHeaders,
          ...corsHeaders,
        },
      });
    }

    return jsonResponse({ error: "Not found" }, { status: 404 });
  },
};

export default worker;
