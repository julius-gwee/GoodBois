import { describe, expect, it } from "vitest";
import app from "../index";

describe("POST /routes", () => {
  const env = { EXPORT_TOKEN: "test" };

  it("returns fixture routes for a linked Jalan Kukoh agency resource without OneMap credentials", async () => {
    const res = await app.request(
      "/routes",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          destinationResourceId: "active-ageing-centre-jalan-kukoh",
          mode: "wheelchair",
        }),
      },
      env,
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as { routes: Array<{ destinationResourceId: string; providerLabel: string }> };
    expect(body.routes).toHaveLength(1);
    expect(body.routes[0].destinationResourceId).toBe("active-ageing-centre-jalan-kukoh");
    expect(body.routes[0].providerLabel).toMatch(/fixture fallback/i);
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
