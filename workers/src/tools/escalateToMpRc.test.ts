import { describe, it, expect, beforeEach, vi } from "vitest";
import { escalateToMpRc } from "./escalateToMpRc";
import { createMemoryRepos } from "../db/memory";
import { _resetCounters } from "../db/ids";
import type { AgencyContact } from "../types/contracts";

const seed: AgencyContact[] = [
  {
    key: "scdf_emergency",
    name: "SCDF",
    hotline: "995",
    category: "healthcare",
    multilingualBlurb: { en: "x", "zh-Hans": "x" },
    active: true,
    source: "seed",
    updatedAt: "2026-05-09T00:00:00+08:00",
  },
  {
    key: "hdb",
    name: "HDB",
    hotline: "1800-225-5432",
    category: "housing",
    multilingualBlurb: { en: "x", "zh-Hans": "x" },
    active: true,
    source: "seed",
    updatedAt: "2026-05-09T00:00:00+08:00",
  },
];

describe("escalateToMpRc", () => {
  beforeEach(() => _resetCounters());

  it("creates a case with status='queued' and the supplied fields", async () => {
    const repos = createMemoryRepos(seed);
    const c = await escalateToMpRc(
      {
        sessionId: "s1",
        language: "zh-Hans",
        summaryEnglish: "broken lift",
        summaryUserLanguage: "电梯坏了",
        transcript: "block 123 lift broken",
        suggestedNextSteps: ["Call HDB hotline 1800-225-5432"],
        kioskId: "demo-laptop",
      },
      repos,
    );
    expect(c.id).toMatch(/^GBC-\d{8}-\d{3}$/);
    expect(c.status).toBe("queued");
    expect(c.summaryEnglish).toBe("broken lift");
    expect(c.kioskId).toBe("demo-laptop");
    expect(await repos.cases.getById(c.id)).not.toBeNull();
  });

  it("warns on suggested steps containing unknown phone numbers", async () => {
    const repos = createMemoryRepos(seed);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    await escalateToMpRc(
      {
        sessionId: "s1",
        language: "en",
        summaryEnglish: "x",
        transcript: "x",
        suggestedNextSteps: ["Call 8888-7777 for unknown help"],
        kioskId: "demo-laptop",
      },
      repos,
    );
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it("does not warn when all numbers are in the directory", async () => {
    const repos = createMemoryRepos(seed);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    await escalateToMpRc(
      {
        sessionId: "s1",
        language: "en",
        summaryEnglish: "x",
        transcript: "x",
        suggestedNextSteps: ["Call 1800-225-5432 (HDB)", "Talk to your RC chairman"],
        kioskId: "demo-laptop",
      },
      repos,
    );
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });
});
