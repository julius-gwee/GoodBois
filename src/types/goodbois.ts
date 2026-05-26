// src/types/goodbois.ts
//
// Frontend entry point for the shared data contracts. The shapes themselves are
// the SSOT in workers/src/types/contracts.shared.ts — this file re-exports them
// (type-only, so nothing from the worker is bundled into the Next build) and
// adds the one frontend-only type. Components keep importing from
// "@/types/goodbois" unchanged.

export type * from "../../workers/src/types/contracts.shared";

import type { RouteMode } from "../../workers/src/types/contracts.shared";

// ---------------------------------------------------------------------------
// Frontend-only: the print payload the map directory hands to the print sheet.
// ---------------------------------------------------------------------------

export type RoutePrintPayload = {
  destinationName: string;
  routeMode: RouteMode;
  distanceMeters: number;
  durationMinutes: number;
  generatedAt: string;
  kioskLocation: string;
  steps: string[];
  disclaimerEnglish: string;
};
