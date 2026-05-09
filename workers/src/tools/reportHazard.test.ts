import { describe, it, expect } from "vitest";
import { reportHazard } from "./reportHazard";

describe("reportHazard (demo stub)", () => {
  it("returns a reference id in HZ-YYYYMMDD-NNN format", async () => {
    const r = await reportHazard({
      category: "lighting",
      location: "void deck",
      description: "broken light",
    });
    expect(r.referenceId).toMatch(/^HZ-\d{8}-\d{3}$/);
  });

  it("routes by category to a default authority", async () => {
    const lighting = await reportHazard({
      category: "lighting",
      location: "void deck",
      description: "x",
    });
    const pothole = await reportHazard({
      category: "pothole",
      location: "main road",
      description: "x",
    });
    const lift = await reportHazard({
      category: "lift",
      location: "block 123",
      description: "x",
    });
    expect(lighting.routedTo).toBe("town-council");
    expect(pothole.routedTo).toBe("lta");
    expect(lift.routedTo).toBe("hdb");
  });

  it("falls back to town-council for unknown categories", async () => {
    const r = await reportHazard({
      category: "unspecified-category",
      location: "x",
      description: "y",
    });
    expect(r.routedTo).toBe("town-council");
  });
});
