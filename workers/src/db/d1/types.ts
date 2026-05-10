// D1 row shapes (snake_case columns) and SessionCase domain types.
// Row types stay in sync with migrations/0001_initial.sql columns.
// Location and Receipt domain types come from ../../types/contracts directly.

// =========================================================================
// SessionCase domain types (camelCase) — what app code sees.
// =========================================================================

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

export type ReceiptRow = {
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
