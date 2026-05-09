import { describe, it, expect, beforeEach } from "vitest";
import { createMemoryRepos } from "./memory";
import { _resetCounters } from "./ids";
import type { AgencyContact } from "../types/contracts";

const sampleAgencies: AgencyContact[] = [
  {
    key: "alpha",
    name: "Alpha",
    category: "housing",
    multilingualBlurb: { en: "A", "zh-Hans": "甲" },
    active: true,
    source: "seed",
    updatedAt: "2026-05-09T00:00:00+08:00",
  },
  {
    key: "beta",
    name: "Beta",
    category: "transport",
    multilingualBlurb: { en: "B", "zh-Hans": "乙" },
    active: false,
    source: "seed",
    updatedAt: "2026-05-09T00:00:00+08:00",
  },
];

describe("createMemoryRepos.agencies", () => {
  it("getByKey returns the agency or null", async () => {
    const repos = createMemoryRepos(sampleAgencies);
    expect((await repos.agencies.getByKey("alpha"))?.name).toBe("Alpha");
    expect(await repos.agencies.getByKey("nope")).toBeNull();
  });

  it("exists is true only for known keys", async () => {
    const repos = createMemoryRepos(sampleAgencies);
    expect(await repos.agencies.exists("alpha")).toBe(true);
    expect(await repos.agencies.exists("nope")).toBe(false);
  });

  it("list filters by category and activeOnly", async () => {
    const repos = createMemoryRepos(sampleAgencies);
    const housing = await repos.agencies.list({ category: "housing" });
    expect(housing.map((a) => a.key)).toEqual(["alpha"]);
    const active = await repos.agencies.list({ activeOnly: true });
    expect(active.map((a) => a.key)).toEqual(["alpha"]);
  });
});

describe("createMemoryRepos.receipts", () => {
  beforeEach(() => _resetCounters());

  it("create assigns id, generatedAt, and persists the body", async () => {
    const repos = createMemoryRepos(sampleAgencies);
    const r = await repos.receipts.create({
      sessionId: "s1",
      language: "zh-Hans",
      body: "Bedok Polyclinic — Eye Check\nWalk-in until 4pm.",
      thingsToBring: ["NRIC", "Medisave card"],
      signpostedAgencyKey: "alpha",
    });
    expect(r.id).toMatch(/^GBR-\d{8}-\d{3}$/);
    expect(r.generatedAt).toBeTruthy();
    expect(r.body).toContain("Bedok Polyclinic");
    expect(r.thingsToBring).toEqual(["NRIC", "Medisave card"]);
    expect(r.signpostedAgencyKey).toBe("alpha");
    expect((await repos.receipts.getById(r.id))?.id).toBe(r.id);
  });

  it("supports hazardReferenceId and caseSummary fields", async () => {
    const repos = createMemoryRepos(sampleAgencies);
    const r = await repos.receipts.create({
      sessionId: "s2",
      language: "en-SG",
      body: "Hazard report filed.",
      thingsToBring: [],
      caseSummary: "Resident reports broken void-deck light.",
      hazardReferenceId: "HZ-20260509-012",
    });
    expect(r.caseSummary).toContain("void-deck");
    expect(r.hazardReferenceId).toBe("HZ-20260509-012");
  });
});
