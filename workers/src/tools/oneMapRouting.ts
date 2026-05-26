// workers/src/tools/oneMapRouting.ts
//
// Routing entry point. Tries OneMap live routes (see ./oneMapClient) for each
// requested mode and falls back to fixture routes (see ./fallbackRoutes) when
// OneMap returns nothing. Keeps the historical `./oneMapRouting` import path
// and re-exports WorkerEnv + getFallbackRoutes for existing callers.

import type { Resource, RouteMode, RouteOption } from "../types/contracts";
import { defaultKioskOrigin, resolveOneMapRoute, type WorkerEnv } from "./oneMapClient";
import { getFallbackRoutes } from "./fallbackRoutes";

export type { WorkerEnv } from "./oneMapClient";
export { getFallbackRoutes } from "./fallbackRoutes";

export async function findRoutes(
  resource: Resource | undefined,
  mode: RouteMode | undefined,
  env: WorkerEnv,
): Promise<RouteOption[]> {
  if (!resource) {
    return getFallbackRoutes("", mode);
  }

  const requestedModes: RouteMode[] = mode ? [mode] : ["wheelchair", "walk", "drive"];
  const resolvedRoutes = await Promise.all(
    requestedModes.map((routeMode) => resolveOneMapRoute(defaultKioskOrigin, resource, routeMode, env)),
  );
  const liveRoutes = resolvedRoutes.filter((route): route is RouteOption => Boolean(route));

  if (liveRoutes.length > 0) {
    return liveRoutes;
  }

  return getFallbackRoutes(resource.id, mode);
}
