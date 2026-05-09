import { describe, it, expect } from "vitest";
import { renderReceiptHtml } from "./render";
import type { Receipt, Case } from "../types/contracts";

const receipt: Receipt = {
  id: "GBR-20260509-001",
  sessionId: "s1",
  caseId: "GBC-20260509-001",
  language: "zh-Hans",
  pdfUrl: "https://goodbois.example/receipts/GBR-20260509-001",
  generatedAt: "2026-05-09T10:00:00+08:00",
};

const linkedCase: Case = {
  id: "GBC-20260509-001",
  sessionId: "s1",
  language: "zh-Hans",
  summaryEnglish: "Resident reports a broken lift.",
  summaryUserLanguage: "居民报告电梯故障。",
  transcript: "Block 123 lift broken.",
  suggestedNextSteps: ["Call HDB hotline 1800-225-5432"],
  kioskId: "demo-laptop",
  status: "queued",
  createdAt: "2026-05-09T10:00:00+08:00",
};

describe("renderReceiptHtml", () => {
  it("includes the receipt id, case id, and disclaimer", () => {
    const html = renderReceiptHtml({ receipt, case: linkedCase });
    expect(html).toContain("GBR-20260509-001");
    expect(html).toContain("GBC-20260509-001");
    expect(html).toContain("This is not an official agency dispatch");
  });

  it("includes both language summaries when available", () => {
    const html = renderReceiptHtml({ receipt, case: linkedCase });
    expect(html).toContain("Resident reports a broken lift");
    expect(html).toContain("居民报告电梯故障");
  });

  it("renders without a case", () => {
    const html = renderReceiptHtml({ receipt });
    expect(html).toContain("GBR-20260509-001");
    expect(html).toContain("This is not an official agency dispatch");
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
