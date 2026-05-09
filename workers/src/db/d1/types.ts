// D1 row shapes (snake_case columns) and domain types for the new
// post-refactor schema. Lives in its own folder so it doesn't collide
// with the legacy Case/Receipt types in ../../types/contracts.ts —
// those will be deleted when the orchestrator refactor lands.

import type { AgencyContact } from "../../types/contracts";

// =========================================================================
// Domain types (camelCase) — what app code sees.
// =========================================================================

/** Alias: the locations table holds AgencyContact rows. */
export type Location = AgencyContact;

export type SessionCaseRequestType = "signpost" | "report_hazard" | "out_of_scope";

export type SessionCaseHistoryEntry = {
  role: "user" | "kiosk";
  textEnglish: string;
  spokenAt: string;          // ISO 8601
};

export type SessionCaseToolCall = {
  name: "signpost" | "reportHazard" | "generateReceipt";
  args: unknown;             // tool-specific; shape lives in the tool itself
};

export type SessionCase = {
  id: string;                // "GBC-20260510-001"
  sessionId: string;
  kioskId: string;
  srcLang: string;           // BCP-47
  requestType: SessionCaseRequestType;
  history: SessionCaseHistoryEntry[];
  toolCalls: SessionCaseToolCall[];
  kioskMessage: string;      // English
  receiptId?: string;
  hazardReferenceId?: string;
  signpostedAgencyKey?: string;
  createdAt: string;         // ISO 8601
};

export type SessionReceipt = {
  id: string;                // "GBR-20260510-001"
  sessionId: string;
  language: string;          // BCP-47
  body: string;              // English body
  thingsToBring: string[];
  caseSummary?: string;
  signpostedAgencyKey?: string;
  hazardReferenceId?: string;
  generatedAt: string;       // ISO 8601
};

// =========================================================================
// D1 row shapes (snake_case) — what the SQL driver returns.
// Keep these in sync with migrations/0001_initial.sql columns.
// =========================================================================

export type LocationRow = {
  key: string;
  name: string;
  category: string;
  hotline: string | null;
  address: string | null;
  url: string | null;
  opening_hours: string | null;
  multilingual_blurb: string;     // JSON-encoded Record<string, string>
  latitude: number | null;
  longitude: number | null;
  walking_directions: string | null;
  active: number;                  // 0 | 1
  source: string;
  updated_at: string;
};

export type SessionCaseRow = {
  id: string;
  session_id: string;
  kiosk_id: string;
  src_lang: string;
  request_type: string;
  history_json: string;            // JSON-encoded SessionCaseHistoryEntry[]
  tool_calls_json: string;         // JSON-encoded SessionCaseToolCall[]
  kiosk_message: string;
  receipt_id: string | null;
  hazard_reference_id: string | null;
  signposted_agency_key: string | null;
  created_at: string;
};

export type SessionReceiptRow = {
  id: string;
  session_id: string;
  language: string;
  body: string;
  things_to_bring_json: string;    // JSON-encoded string[]
  case_summary: string | null;
  signposted_agency_key: string | null;
  hazard_reference_id: string | null;
  generated_at: string;
};
