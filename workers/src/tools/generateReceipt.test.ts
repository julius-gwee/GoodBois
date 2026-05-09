import { describe, it, expect, beforeEach } from "vitest";
import { generateReceipt } from "./generateReceipt";
import { createMemoryRepos } from "../db/memory";
import { _resetCounters } from "../db/ids";

describe("generateReceipt", () => {
  beforeEach(() => _resetCounters());

  it("creates a receipt with pdfUrl pointing to the worker route", async () => {
    const repos = createMemoryRepos([]);
    const r = await generateReceipt(
      {
        sessionId: "s1",
        caseId: "GBC-20260509-001",
        language: "zh-Hans",
        workerUrl: "https://goodbois.example",
      },
      repos,
    );
    expect(r.id).toMatch(/^GBR-\d{8}-\d{3}$/);
    expect(r.pdfUrl).toBe(`https://goodbois.example/receipts/${r.id}`);
    expect(r.language).toBe("zh-Hans");
    expect(r.caseId).toBe("GBC-20260509-001");
  });

  it("works without a caseId (signpost-only receipts)", async () => {
    const repos = createMemoryRepos([]);
    const r = await generateReceipt(
      { sessionId: "s2", language: "en", workerUrl: "https://goodbois.example" },
      repos,
    );
    expect(r.caseId).toBeUndefined();
  });
});
