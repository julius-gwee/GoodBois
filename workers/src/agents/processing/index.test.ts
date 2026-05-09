import { describe, it, expect, beforeEach } from "vitest";
import { runProcessing } from "./index";
import { createMemoryRepos } from "../../db/memory";
import { _resetCounters } from "../../db/ids";
import type { AgencyContact, TriageResult } from "../../types/contracts";

const seed: AgencyContact[] = [
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
  {
    key: "scdf",
    name: "SCDF",
    hotline: "995",
    category: "healthcare",
    multilingualBlurb: { en: "x", "zh-Hans": "x" },
    active: true,
    source: "seed",
    updatedAt: "2026-05-09T00:00:00+08:00",
  },
];

function triage(overrides: Partial<TriageResult>): TriageResult {
  return {
    id: "t1",
    sessionId: "s1",
    outcome: "signpost",
    confidence: "high",
    reasoningSummary: "test",
    createdAt: "2026-05-09T10:00:00+08:00",
    ...overrides,
  };
}

const baseInput = {
  sessionId: "s1",
  language: "zh-Hans",
  transcriptEnglish: "broken lift, dialysis transport needed",
  workerUrl: "https://goodbois.example",
};

describe("runProcessing", () => {
  beforeEach(() => _resetCounters());

  it("signpost outcome calls signpost and returns agencyContact", async () => {
    const repos = createMemoryRepos(seed);
    const out = await runProcessing(
      {
        ...baseInput,
        triage: triage({ outcome: "signpost", selectedAgencyKey: "hdb" }),
      },
      repos,
    );
    expect(out.toolName).toBe("signpost");
    expect(out.agencyContact?.key).toBe("hdb");
    expect(out.error).toBeUndefined();
  });

  it("signpost with unknown agency returns AGENCY_NOT_ALLOWED", async () => {
    const repos = createMemoryRepos(seed);
    const out = await runProcessing(
      {
        ...baseInput,
        triage: triage({ outcome: "signpost", selectedAgencyKey: "unknown" }),
      },
      repos,
    );
    expect(out.error?.code).toBe("AGENCY_NOT_ALLOWED");
    expect(out.error?.fallbackAvailable).toBe(true);
  });

  it("find_nearby returns up to 3 agencies", async () => {
    const repos = createMemoryRepos(seed);
    const out = await runProcessing(
      {
        ...baseInput,
        triage: triage({ outcome: "find_nearby", selectedAgencyKey: undefined }),
        findNearbyCategory: "housing",
      },
      repos,
    );
    expect(out.toolName).toBe("findNearby");
    expect(out.agencyContacts?.length ?? 0).toBeGreaterThan(0);
  });

  it("escalate writes a case and a receipt", async () => {
    const repos = createMemoryRepos(seed);
    const out = await runProcessing(
      {
        ...baseInput,
        triage: triage({ outcome: "escalate" }),
        suggestedNextSteps: ["Talk to RC chairman"],
        summaryEnglish: "broken lift",
      },
      repos,
    );
    expect(out.toolName).toBe("escalateToMpRc+generateReceipt");
    expect(out.case?.status).toBe("queued");
    expect(out.receipt?.pdfUrl).toMatch(/^https:\/\/goodbois\.example\/receipts\/GBR-/);
  });

  it("simulate_booking returns TOOL_NOT_ALLOWED", async () => {
    const repos = createMemoryRepos(seed);
    const out = await runProcessing(
      { ...baseInput, triage: triage({ outcome: "simulate_booking" }) },
      repos,
    );
    expect(out.error?.code).toBe("TOOL_NOT_ALLOWED");
  });

  it("out_of_scope falls back to a curated hotline signpost", async () => {
    const repos = createMemoryRepos(seed);
    const out = await runProcessing(
      {
        ...baseInput,
        triage: triage({ outcome: "out_of_scope", selectedAgencyKey: "scdf" }),
      },
      repos,
    );
    expect(out.toolName).toBe("signpost");
    expect(out.agencyContact?.key).toBe("scdf");
  });

  it("records a tool invocation on success", async () => {
    const repos = createMemoryRepos(seed);
    const out = await runProcessing(
      {
        ...baseInput,
        triage: triage({ outcome: "signpost", selectedAgencyKey: "hdb" }),
      },
      repos,
    );
    expect(out.toolInvocation.toolName).toBe("signpost");
    expect(out.toolInvocation.success).toBe(true);
  });
});
