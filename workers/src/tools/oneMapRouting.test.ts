import { afterEach, describe, expect, it, vi } from "vitest";
import type { Resource } from "../types/contracts";
import { findRoutes, type WorkerEnv } from "./oneMapRouting";

const destination: Resource = {
  id: "servicesg-bukit-merah",
  name: { en: "ServiceSG Centre Bukit Merah" },
  category: "government_service",
  description: { en: "Assisted access to government services." },
  address: { en: "166 Bukit Merah Central, #03-3529A" },
  latitude: 1.283092625749734,
  longitude: 103.8176672025981,
  languages: ["en"],
  accessibilityFeatures: [{ en: "Step-free access" }],
  practicalNotes: [{ en: "Use the lift to level 4." }],
  photos: [],
  verificationStatus: "verified",
  confidenceLevel: "high",
  source: "seed",
  currentHazardStatus: "none",
  details: { type: "government_service", agencies: ["ServiceSG"], services: ["government services"] },
  createdAt: "2026-05-09T00:00:00+08:00",
  updatedAt: "2026-05-09T00:00:00+08:00",
};

const oneMapPayload = {
  status_message: "Found route between points",
  status: 0,
  route_summary: {
    total_time: 180,
    total_distance: 220,
  },
  route_instructions: [
    ["Left", "covered footpath", 120, "1.28690,103.80820", 90, "120m", "East", "East", "walking", "Head East On Covered Footpath"],
    ["Destination", "footpath", 0, "1.28309,103.81766", 0, "0m", "East", "South", "walking", "You Have Arrived"],
  ],
};

const oneMapEnv = {
  [["ONEMAP", "ACCESS", "TOKEN"].join("_")]: "stub",
} as WorkerEnv;

afterEach(() => {
  vi.restoreAllMocks();
});

describe("findRoutes OneMap integration", () => {
  it("labels seeded routes as fixture fallback when OneMap auth is unavailable", async () => {
    const routes = await findRoutes(destination, "wheelchair", {});

    expect(routes[0].providerLabel).toMatch(/fixture fallback/i);
  });

  it("calls the OneMap BFA endpoint first for wheelchair routes", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(oneMapPayload), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    const routes = await findRoutes(destination, "wheelchair", oneMapEnv);

    const firstUrl = new URL(String(fetchMock.mock.calls[0][0]));
    expect(firstUrl.pathname).toBe("/api/bfa/routingsvc/route");
    expect(firstUrl.searchParams.has("routeType")).toBe(false);
    expect(routes[0].providerLabel).toBe("OneMap Barrier-Free Access route");
  });

  it("falls back from failed BFA routing to public walking for wheelchair routes", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify({ message: "BFA unavailable" }), { status: 503 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify(oneMapPayload), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      );

    const routes = await findRoutes(destination, "wheelchair", oneMapEnv);

    const bfaUrl = new URL(String(fetchMock.mock.calls[0][0]));
    const walkUrl = new URL(String(fetchMock.mock.calls[1][0]));
    expect(bfaUrl.pathname).toBe("/api/bfa/routingsvc/route");
    expect(walkUrl.pathname).toBe("/api/public/routingsvc/route");
    expect(walkUrl.searchParams.get("routeType")).toBe("walk");
    expect(routes[0].providerLabel).toBe("OneMap walking fallback");
  });

  it("maps public walk route responses into RouteOption", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(oneMapPayload), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    const routes = await findRoutes(destination, "walk", oneMapEnv);

    expect(routes[0]).toMatchObject({
      destinationResourceId: "servicesg-bukit-merah",
      mode: "walk",
      durationMinutes: 3,
      distanceMeters: 220,
      providerLabel: "OneMap walking route",
    });
    expect(routes[0].steps).toHaveLength(2);
  });

  it("uses instruction coordinates when OneMap omits route geometry", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(oneMapPayload), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    const routes = await findRoutes(destination, "walk", oneMapEnv);

    expect(routes[0].polyline).toEqual([
      { latitude: 1.287133554639335, longitude: 103.8070005167375 },
      { latitude: 1.2869, longitude: 103.8082 },
      { latitude: 1.28309, longitude: 103.81766 },
      { latitude: 1.283092625749734, longitude: 103.8176672025981 },
    ]);
  });
});
