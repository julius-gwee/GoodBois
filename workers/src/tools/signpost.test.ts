import { describe, it, expect } from "vitest";
import { signpost, AgencyNotAllowedError } from "./signpost";
import { createMemoryRepos } from "../db/memory";
import type { AgencyContact } from "../types/contracts";

const seed: AgencyContact[] = [
  {
    key: "active_one",
    name: "Active",
    category: "housing",
    multilingualBlurb: { en: "x", "zh-Hans": "x" },
    latitude: 1.287133554639335,
    longitude: 103.8070005167375,
    walkingDirectionsHint: "Follow the sheltered path around Blk 3 Jalan Bukit Merah.",
    active: true,
    source: "seed",
    updatedAt: "2026-05-09T00:00:00+08:00",
  },
  {
    key: "inactive_one",
    name: "Inactive",
    category: "housing",
    multilingualBlurb: { en: "x", "zh-Hans": "x" },
    active: false,
    source: "seed",
    updatedAt: "2026-05-09T00:00:00+08:00",
  },
];

describe("signpost", () => {
  it("returns the agency for an active known key", async () => {
    const repos = createMemoryRepos(seed);
    const a = await signpost({ agencyKey: "active_one" }, repos);
    expect(a.key).toBe("active_one");
  });

  it("preserves agency wayfinding fields for route rendering", async () => {
    const repos = createMemoryRepos(seed);
    const a = await signpost({ agencyKey: "active_one" }, repos);

    expect(a.latitude).toBe(1.287133554639335);
    expect(a.longitude).toBe(103.8070005167375);
    expect(a.walkingDirectionsHint).toMatch(/Bukit Merah/i);
  });

  it("throws AgencyNotAllowedError for unknown key", async () => {
    const repos = createMemoryRepos(seed);
    await expect(signpost({ agencyKey: "missing" }, repos)).rejects.toBeInstanceOf(
      AgencyNotAllowedError,
    );
  });

  it("throws AgencyNotAllowedError for inactive key", async () => {
    const repos = createMemoryRepos(seed);
    await expect(signpost({ agencyKey: "inactive_one" }, repos)).rejects.toBeInstanceOf(
      AgencyNotAllowedError,
    );
  });
});
