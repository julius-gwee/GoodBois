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

describe("createMemoryRepos.cases", () => {
  beforeEach(() => _resetCounters());

  it("create assigns id, createdAt, status='queued'", async () => {
    const repos = createMemoryRepos(sampleAgencies);
    const created = await repos.cases.create({
      sessionId: "s1",
      language: "zh-Hans",
      summaryEnglish: "x",
      transcript: "y",
      suggestedNextSteps: [],
      kioskId: "demo-laptop",
    });
    expect(created.id).toMatch(/^GBC-\d{8}-\d{3}$/);
    expect(created.status).toBe("queued");
    expect(created.createdAt).toBeTruthy();
  });

  it("listForExport returns queued and exported cases", async () => {
    const repos = createMemoryRepos(sampleAgencies);
    const a = await repos.cases.create({
      sessionId: "s1",
      language: "en",
      summaryEnglish: "1",
      transcript: "1",
      suggestedNextSteps: [],
      kioskId: "demo-laptop",
    });
    const b = await repos.cases.create({
      sessionId: "s2",
      language: "en",
      summaryEnglish: "2",
      transcript: "2",
      suggestedNextSteps: [],
      kioskId: "demo-laptop",
    });
    await repos.cases.markExported(b.id, "2026-05-09T10:00:00+08:00");
    const list = await repos.cases.listForExport();
    expect(list.map((c) => c.id).sort()).toEqual([a.id, b.id].sort());
    expect(list.find((c) => c.id === b.id)?.status).toBe("exported");
  });
});

describe("createMemoryRepos.receipts", () => {
  beforeEach(() => _resetCounters());

  it("create assigns id, generatedAt, stores pdfUrl", async () => {
    const repos = createMemoryRepos(sampleAgencies);
    const r = await repos.receipts.create(
      { sessionId: "s1", caseId: "GBC-20260509-001", language: "zh-Hans" },
      "https://example.test/receipts/GBR-20260509-001",
    );
    expect(r.id).toMatch(/^GBR-\d{8}-\d{3}$/);
    expect(r.pdfUrl).toBe("https://example.test/receipts/GBR-20260509-001");
    expect(r.generatedAt).toBeTruthy();
    expect((await repos.receipts.getById(r.id))?.id).toBe(r.id);
  });
});
