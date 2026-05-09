import { describe, it, expect } from "vitest";
import { renderReceiptHtml } from "./render";
import type { AgencyContact, Receipt } from "../types/contracts";

const receipt: Receipt = {
  id: "GBR-20260509-001",
  sessionId: "s1",
  language: "zh-Hans",
  body: "Bedok Polyclinic — Eye Check\nWalk-in until 4pm.",
  thingsToBring: ["NRIC", "Medisave card", "current glasses"],
  signpostedAgencyKey: "polyclinic-bedok",
  generatedAt: "2026-05-09T10:00:00+08:00",
};

const agency: AgencyContact = {
  key: "polyclinic-bedok",
  name: "Bedok Polyclinic",
  hotline: "6555-0000",
  address: "11 Bedok North Street 1",
  openingHours: "Mon–Fri 8am–5pm",
  category: "healthcare",
  multilingualBlurb: {
    en: "Walk-in eye checks and chronic disease care.",
    "zh-Hans": "提供视力检查与慢性病护理。",
  },
  active: true,
  source: "seed",
  updatedAt: "2026-05-09T00:00:00+08:00",
};

describe("renderReceiptHtml", () => {
  it("includes the receipt id, body, and disclaimer", () => {
    const html = renderReceiptHtml({ receipt });
    expect(html).toContain("GBR-20260509-001");
    expect(html).toContain("Bedok Polyclinic — Eye Check");
    expect(html).toContain("This is not an official agency dispatch");
  });

  it("renders the things-to-bring checklist", () => {
    const html = renderReceiptHtml({ receipt });
    expect(html).toContain("NRIC");
    expect(html).toContain("Medisave card");
    expect(html).toContain("current glasses");
  });

  it("renders an agency block when one is supplied", () => {
    const html = renderReceiptHtml({ receipt, agency });
    expect(html).toContain("Bedok Polyclinic");
    expect(html).toContain("6555-0000");
    expect(html).toContain("11 Bedok North Street 1");
    expect(html).toContain("提供视力检查与慢性病护理");
  });

  it("renders a hazard reference id when present", () => {
    const html = renderReceiptHtml({
      receipt: { ...receipt, hazardReferenceId: "HZ-20260509-012" },
    });
    expect(html).toContain("HZ-20260509-012");
  });

  it("renders a case summary when present", () => {
    const html = renderReceiptHtml({
      receipt: {
        ...receipt,
        caseSummary: "Resident wants to sell flat; spouse refuses.",
      },
    });
    expect(html).toContain("Resident wants to sell flat");
  });
});

import app from "../index";

describe("GET /receipts/:id", () => {
  it("returns 400 for a malformed id", async () => {
    const res = await app.request("/receipts/not-an-id");
    expect(res.status).toBe(400);
  });

  it("returns 404 for an unknown id", async () => {
    const res = await app.request("/receipts/GBR-20260509-999");
    expect(res.status).toBe(404);
  });
});
