// workers/src/tools/fallbackRoutes.ts
//
// Demo/offline route builder. When OneMap returns nothing (no token, API down,
// CI), findRoutes falls back to these fixture routes so the map still renders a
// believable journey. Each route is tagged "(fixture fallback)" so it's never
// mistaken for a live OneMap result.

import type { RouteMode, RouteOption } from "../types/contracts";
import { workerDemoRoutes } from "../fixtures/map-demo";

export function getFallbackRoutes(destinationResourceId: string, mode?: RouteMode): RouteOption[] {
  const routes = workerDemoRoutes[destinationResourceId] ?? Object.values(workerDemoRoutes)[0] ?? [];
  const filteredRoutes = mode ? routes.filter((route) => route.mode === mode) : routes;
  return filteredRoutes.map((route) => ({
    ...route,
    providerLabel: route.providerLabel.toLocaleLowerCase().includes("fixture fallback")
      ? route.providerLabel
      : `${route.providerLabel} (fixture fallback)`,
  }));
}
