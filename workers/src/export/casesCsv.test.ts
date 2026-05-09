import { describe, it, expect } from "vitest";
import { casesToCsv } from "./casesCsv";
import type { Case } from "../types/contracts";

const HEADER =
  "id,createdAt,language,summaryEnglish,transcript,suggestedNextSteps,residentBlock,residentUnit,residentNameAlias,kioskId,status,sessionId";

const sample: Case = {
  id: "GBC-20260509-001",
  sessionId: "s1",
  language: "zh-Hans",
  summaryEnglish: 'Lift broken; "urgent" repair needed.',
  summaryUserLanguage: "电梯坏了。",
  transcript: "Block 123 lift broken.\nBlock 123 level 8.",
  suggestedNextSteps: ["Call HDB", "Talk to RC"],
  residentBlock: "123",
  residentUnit: "Level 8",
  kioskId: "demo-laptop",
  status: "queued",
  createdAt: "2026-05-09T10:00:00+08:00",
};

describe("casesToCsv", () => {
  it("emits the documented header on the first line", () => {
    const csv = casesToCsv([]);
    expect(csv.split("\r\n")[0]).toBe(HEADER);
  });

  it("emits one data row per case in the documented column order", () => {
    const csv = casesToCsv([sample]);
    const lines = csv.split("\r\n");
    expect(lines[0]).toBe(HEADER);
    expect(lines[1]).toContain("GBC-20260509-001");
    expect(lines[1]).toContain("zh-Hans");
  });

  it("joins suggestedNextSteps with ;", () => {
    const csv = casesToCsv([sample]);
    expect(csv).toContain("Call HDB;Talk to RC");
  });

  it("doubles embedded quotes and quotes fields with newlines", () => {
    const csv = casesToCsv([sample]);
    // Embedded quote in summaryEnglish
    expect(csv).toContain('"Lift broken; ""urgent"" repair needed."');
    // Newline in transcript
    expect(csv).toMatch(/"Block 123 lift broken\.\nBlock 123 level 8\."/);
  });

  it("emits empty fields for missing optional values", () => {
    const minimal: Case = {
      ...sample,
      summaryUserLanguage: undefined,
      residentBlock: undefined,
      residentUnit: undefined,
      residentNameAlias: undefined,
    };
    const csv = casesToCsv([minimal]);
    // residentBlock, residentUnit, residentNameAlias should appear as empty between commas
    expect(csv).toMatch(/,demo-laptop,/);
  });
});
