import type { Resource, ResourceFilters, RouteMode, RouteOption } from "@/types/goodbois";
import { demoResources, demoRoutes } from "./fixtures.ts";
import { filterResources } from "./directory.ts";

export type DataSource = "worker" | "fixture";

type ResourceResult = {
  resources: Resource[];
  source: DataSource;
};

type RouteResult = {
  routes: RouteOption[];
  source: DataSource;
};

function getWorkerUrl(explicitUrl?: string): string | undefined {
  return explicitUrl ?? process.env.NEXT_PUBLIC_WORKER_URL;
}

export async function loadResources(
  filters: ResourceFilters = {},
  explicitWorkerUrl?: string,
): Promise<ResourceResult> {
  const workerUrl = getWorkerUrl(explicitWorkerUrl);

  if (!workerUrl) {
    return {
      resources: filterResources(demoResources, filters),
      source: "fixture",
    };
  }

  try {
    const url = new URL("/resources", workerUrl);
    if (filters.query) {
      url.searchParams.set("query", filters.query);
    }
    if (filters.category) {
      url.searchParams.set("category", filters.category);
    }
    if (filters.language) {
      url.searchParams.set("language", filters.language);
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Resource request failed: ${response.status}`);
    }

    const payload = (await response.json()) as { resources?: Resource[] };
    if (!Array.isArray(payload.resources)) {
      throw new Error("Resource response missing resources array");
    }

    return {
      resources: payload.resources,
      source: "worker",
    };
  } catch {
    return {
      resources: filterResources(demoResources, filters),
      source: "fixture",
    };
  }
}

export async function loadRoutes(
  destinationResourceId: string,
  mode?: RouteMode,
  explicitWorkerUrl?: string,
): Promise<RouteResult> {
  const workerUrl = getWorkerUrl(explicitWorkerUrl);

  if (!workerUrl) {
    return {
      routes: filterRoutes(destinationResourceId, mode),
      source: "fixture",
    };
  }

  try {
    const response = await fetch(new URL("/routes", workerUrl), {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ destinationResourceId, mode }),
    });
    if (!response.ok) {
      throw new Error(`Route request failed: ${response.status}`);
    }

    const payload = (await response.json()) as { routes?: RouteOption[] };
    if (!Array.isArray(payload.routes)) {
      throw new Error("Route response missing routes array");
    }

    return {
      routes: payload.routes,
      source: "worker",
    };
  } catch {
    return {
      routes: filterRoutes(destinationResourceId, mode),
      source: "fixture",
    };
  }
}

function filterRoutes(destinationResourceId: string, mode?: RouteMode): RouteOption[] {
  const routes = demoRoutes[destinationResourceId] ?? demoRoutes["senior-corner"];
  return mode ? routes.filter((route) => route.mode === mode) : routes;
}
