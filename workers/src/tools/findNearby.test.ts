import { describe, it, expect } from "vitest";
import { findNearby } from "./findNearby";
import { createMemoryRepos } from "../db/memory";
import type { AgencyContact } from "../types/contracts";

function fixture(key: string, active = true): AgencyContact {
  return {
    key,
    name: key,
    category: "healthcare",
    multilingualBlurb: { en: "x", "zh-Hans": "x" },
    active,
    source: "seed",
    updatedAt: "2026-05-09T00:00:00+08:00",
  };
}

describe("findNearby", () => {
  it("returns up to 3 active agencies in the category", async () => {
    const repos = createMemoryRepos([
      fixture("h1"),
      fixture("h2"),
      fixture("h3"),
      fixture("h4"),
      { ...fixture("inactive"), active: false },
    ]);
    const result = await findNearby({ category: "healthcare" }, repos);
    expect(result.length).toBe(3);
    expect(result.every((a) => a.active)).toBe(true);
  });

  it("returns an empty array when no active agencies match", async () => {
    const repos = createMemoryRepos([{ ...fixture("inactive"), active: false }]);
    const result = await findNearby({ category: "healthcare" }, repos);
    expect(result).toEqual([]);
  });
});
