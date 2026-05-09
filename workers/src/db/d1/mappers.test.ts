import { describe, expect, it } from "vitest";
import {
  rowToAgency, agencyToRow,
  rowToSessionCase, sessionCaseToRow,
  rowToReceipt, receiptToRow,
} from "./mappers";
import type { LocationRow, SessionCaseRow, ReceiptRow } from "./types";

describe("rowToAgency", () => {
  it("parses a fully-populated row", () => {
    const row: LocationRow = {
      key: "test",
      name: "Test Agency",
      category: "healthcare",
      hotline: "1234-5678",
      address: "1 Test Rd",
      url: "https://example.test",
      opening_hours: "Mon–Fri 9–5",
      multilingual_blurb: '{"en":"hi","zh-Hans":"你好"}',
      latitude: 1.3521,
      longitude: 103.8198,
      walking_directions: "5 min walk",
      active: 1,
      source: "seed",
      updated_at: "2026-05-09T00:00:00+08:00",
    };
    const agency = rowToAgency(row);
    expect(agency.key).toBe("test");
    expect(agency.multilingualBlurb).toEqual({ en: "hi", "zh-Hans": "你好" });
    expect(agency.latitude).toBe(1.3521);
    expect(agency.active).toBe(true);
  });

  it("handles nullable fields", () => {
    const row: LocationRow = {
      key: "k", name: "n", category: "other",
      hotline: null, address: null, url: null,
      opening_hours: null, multilingual_blurb: "{}",
      latitude: null, longitude: null, walking_directions: null,
      active: 0, source: "seed", updated_at: "2026-05-09T00:00:00+08:00",
    };
    const agency = rowToAgency(row);
    expect(agency.hotline).toBeUndefined();
    expect(agency.latitude).toBeUndefined();
    expect(agency.active).toBe(false);
  });
});

describe("agencyToRow", () => {
  it("round-trips with rowToAgency", () => {
    const row: LocationRow = {
      key: "k", name: "n", category: "healthcare",
      hotline: null, address: null, url: null,
      opening_hours: "M-F", multilingual_blurb: '{"en":"x"}',
      latitude: null, longitude: null, walking_directions: null,
      active: 1, source: "seed", updated_at: "2026-05-09T00:00:00+08:00",
    };
    const agency = rowToAgency(row);
    const back = agencyToRow(agency);
    expect(back).toEqual(row);
  });
});

describe("rowToSessionCase", () => {
  it("parses history_json and tool_calls_json", () => {
    const row: SessionCaseRow = {
      id: "GBC-20260510-001",
      session_id: "sess-1", kiosk_id: "kiosk-1", src_lang: "en-SG",
      request_type: "signpost",
      history_json: '[{"role":"user","textEnglish":"hi","spokenAt":"2026-05-10T01:00:00Z"}]',
      tool_calls_json: '[{"name":"signpost","args":{"agencyKey":"x"}}]',
      kiosk_message: "hello",
      receipt_id: "GBR-20260510-001",
      hazard_reference_id: null,
      signposted_agency_key: "x",
      created_at: "2026-05-10T01:00:00Z",
    };
    const c = rowToSessionCase(row);
    expect(c.history).toHaveLength(1);
    expect(c.history[0].textEnglish).toBe("hi");
    expect(c.toolCalls[0].name).toBe("signpost");
    expect(c.receiptId).toBe("GBR-20260510-001");
    expect(c.hazardReferenceId).toBeUndefined();
  });
});

describe("rowToReceipt", () => {
  it("parses things_to_bring_json", () => {
    const row: ReceiptRow = {
      id: "GBR-20260510-001", session_id: "sess-1",
      language: "zh-SG", body: "...",
      things_to_bring_json: '["NRIC","glasses"]',
      case_summary: null,
      signposted_agency_key: null,
      hazard_reference_id: null,
      generated_at: "2026-05-10T01:00:00Z",
    };
    const r = rowToReceipt(row);
    expect(r.thingsToBring).toEqual(["NRIC", "glasses"]);
    expect(r.caseSummary).toBeUndefined();
  });
});

describe("sessionCaseToRow / receiptToRow round-trip", () => {
  it("case round-trips", () => {
    const c = {
      id: "GBC-1", sessionId: "s", kioskId: "k", srcLang: "en-SG",
      requestType: "signpost" as const,
      history: [{ role: "user" as const, textEnglish: "hi", spokenAt: "t" }],
      toolCalls: [{ name: "signpost" as const, args: {} }],
      kioskMessage: "msg",
      createdAt: "t",
    };
    const back = rowToSessionCase(sessionCaseToRow(c));
    expect(back).toEqual(c);
  });

  it("receipt round-trips", () => {
    const r = {
      id: "GBR-1", sessionId: "s", language: "zh-SG",
      body: "b", thingsToBring: ["a"], generatedAt: "t",
    };
    const back = rowToReceipt(receiptToRow(r));
    expect(back).toEqual(r);
  });
});
