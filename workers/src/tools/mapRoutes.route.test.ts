import { describe, expect, it } from "vitest";
import app from "../index";

describe("POST /routes", () => {
  const env = { EXPORT_TOKEN: "test" };

  it("returns fixture routes from Blk 3 Jalan Bukit Merah for ServiceSG without OneMap credentials", async () => {
    const res = await app.request(
      "/routes",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          destinationResourceId: "servicesg-bukit-merah",
          mode: "wheelchair",
        }),
      },
      env,
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      routes: Array<{
        destinationResourceId: string;
        providerLabel: string;
        origin: { latitude: number; longitude: number; label: { en: string } };
        polyline: Array<{ latitude: number; longitude: number }>;
      }>;
    };
    expect(body.routes).toHaveLength(1);
    expect(body.routes[0].destinationResourceId).toBe("servicesg-bukit-merah");
    expect(body.routes[0].origin.label.en).toBe("GoodBois kiosk at Blk 3 Jalan Bukit Merah");
    expect(body.routes[0].origin.latitude).toBe(1.287133554639335);
    expect(body.routes[0].providerLabel).toMatch(/fixture fallback/i);
    expect(body.routes[0].polyline.length).toBeGreaterThan(3);
  });

  it("returns a controlled error for an unknown destination resource", async () => {
    const res = await app.request(
      "/routes",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          destinationResourceId: "unknown-place",
          mode: "wheelchair",
        }),
      },
      env,
    );

    expect(res.status).toBe(404);
    const body = (await res.json()) as { error: { code: string; fallbackAvailable: boolean } };
    expect(body.error.code).toBe("RESOURCE_NOT_FOUND");
    expect(body.error.fallbackAvailable).toBe(true);
  });
});
