import type { TurnRequest, TurnResponse } from "./types/contracts";
import type { ResourceFilters, RouteMode } from "./types/contracts";
import { workerDemoRoutes } from "./fixtures/map-demo";
import { findNearby } from "./tools/findNearby";

const jsonHeaders = {
  "content-type": "application/json; charset=utf-8",
};

const worker = {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/health") {
      return Response.json({ ok: true, service: "goodbois-worker" });
    }

    if (request.method === "GET" && url.pathname === "/resources") {
      const filters: ResourceFilters = {
        query: url.searchParams.get("query") ?? undefined,
        category: (url.searchParams.get("category") as ResourceFilters["category"]) ?? "all",
        language: (url.searchParams.get("language") as ResourceFilters["language"]) ?? "all",
      };

      return Response.json({ resources: findNearby(filters) });
    }

    if (request.method === "POST" && url.pathname === "/routes") {
      const body = (await request.json().catch(() => ({}))) as {
        destinationResourceId?: string;
        mode?: RouteMode;
      };
      const routes = workerDemoRoutes[body.destinationResourceId ?? "senior-corner"] ?? [];

      return Response.json({
        routes: body.mode ? routes.filter((route) => route.mode === body.mode) : routes,
      });
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
        headers: jsonHeaders,
      });
    }

    return Response.json({ error: "Not found" }, { status: 404 });
  },
};

export default worker;
