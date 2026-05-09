import { describe, it, expect, beforeEach } from "vitest";
import {
  ALLOWLIST,
  isAllowedTool,
  invokeTool,
  type ToolCtx,
} from "./registry";
import { createMemoryRepos } from "../db/memory";
import { _resetCounters } from "../db/ids";
import type { AgencyContact } from "../types/contracts";

const seed: AgencyContact[] = [
  {
    key: "town-council-east-coast",
    name: "East Coast Town Council",
    category: "town_council",
    multilingualBlurb: { en: "Lighting / cleanliness / common areas." },
    active: true,
    source: "seed",
    updatedAt: "2026-05-09T00:00:00+08:00",
  },
];

function makeCtx(): ToolCtx {
  return {
    repos: createMemoryRepos(seed),
    workerUrl: "https://kiosk.example",
    sessionId: "session-1",
    srcLang: "en-SG",
    priorToolResults: {},
  };
}

describe("tool registry", () => {
  beforeEach(() => _resetCounters());

  it("ALLOWLIST contains exactly the three MVP tools", () => {
    expect([...ALLOWLIST].sort()).toEqual(
      ["generateReceipt", "reportHazard", "signpost"].sort(),
    );
  });

  it("isAllowedTool accepts allowlisted names", () => {
    expect(isAllowedTool("signpost")).toBe(true);
    expect(isAllowedTool("reportHazard")).toBe(true);
    expect(isAllowedTool("generateReceipt")).toBe(true);
  });

  it("rejects retired tools and unknown names", () => {
    expect(isAllowedTool("findNearby")).toBe(false);
    expect(isAllowedTool("escalateToMpRc")).toBe(false);
    expect(isAllowedTool("simulateBooking")).toBe(false);
  });

  it("invokeTool(signpost) returns the agency record", async () => {
    const ctx = makeCtx();
    const res = await invokeTool(
      { name: "signpost", args: { agencyKey: "town-council-east-coast" } },
      ctx,
    );
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect((res.data as { agency: AgencyContact }).agency.key).toBe(
        "town-council-east-coast",
      );
    }
  });

  it("invokeTool(signpost) returns AGENCY_NOT_ALLOWED for an unknown key", async () => {
    const ctx = makeCtx();
    const res = await invokeTool(
      { name: "signpost", args: { agencyKey: "unknown-agency" } },
      ctx,
    );
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe("AGENCY_NOT_ALLOWED");
  });

  it("invokeTool(reportHazard) returns a referenceId", async () => {
    const ctx = makeCtx();
    const res = await invokeTool(
      {
        name: "reportHazard",
        args: { category: "lighting", location: "void deck", description: "broken" },
      },
      ctx,
    );
    expect(res.ok).toBe(true);
    if (res.ok) {
      const data = res.data as { referenceId: string; routedTo: string };
      expect(data.referenceId).toMatch(/^HZ-\d{8}-\d{3}$/);
      expect(data.routedTo).toBe("town-council");
    }
  });

  it("invokeTool(generateReceipt) hydrates hazardReferenceId from prior tool results", async () => {
    const ctx = makeCtx();
    ctx.priorToolResults.reportHazard = {
      referenceId: "HZ-20260509-012",
      routedTo: "town-council",
    };
    const res = await invokeTool(
      {
        name: "generateReceipt",
        args: {
          body: "Hazard report filed.",
          thingsToBring: [],
          signpostedAgencyKey: "town-council-east-coast",
          language: "en-SG",
        },
      },
      ctx,
    );
    expect(res.ok).toBe(true);
    if (res.ok) {
      const data = res.data as { receiptId: string; url: string };
      expect(data.receiptId).toMatch(/^GBR-\d{8}-\d{3}$/);
      expect(data.url).toBe(`https://kiosk.example/receipts/${data.receiptId}`);
      const stored = await ctx.repos.receipts.getById(data.receiptId);
      expect(stored?.hazardReferenceId).toBe("HZ-20260509-012");
    }
  });
});
