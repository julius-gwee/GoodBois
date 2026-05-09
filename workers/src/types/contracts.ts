// workers/src/types/contracts.ts
//
// Worker-side data contracts. SSOT mirror of docs/standards/data-contracts.md.
// If anything here drifts from the refactor spec at
// docs/refactor/2026-05-09-llm-turn-decision.md, the spec wins.

// ---------------------------------------------------------------------------
// Pipeline schemas (LLM I/O)
// ---------------------------------------------------------------------------

export type STTResult = {
  transcript_en: string;
  srcLang: string;
};

export type ClassifierRequestType =
  | "signpost"
  | "report_hazard"
  | "out_of_scope"
  | "ask_followup";

export type ClassifierDecision = {
  requestType: ClassifierRequestType;
  followupPrompt?: string;
};

export type MainRequestType = "signpost" | "report_hazard" | "out_of_scope";

export type SignpostToolCall = {
  name: "signpost";
  args: { agencyKey: string };
};

export type ReportHazardToolCall = {
  name: "reportHazard";
  args: {
    category: string;
    location: string;
    description: string;
  };
};

export type GenerateReceiptToolCall = {
  name: "generateReceipt";
  args: GenerateReceiptArgs;
};

export type ToolCall =
  | SignpostToolCall
  | ReportHazardToolCall
  | GenerateReceiptToolCall;

export type LLMTurnDecision = {
  requestType: MainRequestType;
  kioskMessage: string;
  toolCalls: ToolCall[];
};

export type GenerateReceiptArgs = {
  body: string;
  thingsToBring?: string[];
  caseSummary?: string;
  signpostedAgencyKey?: string;
  hazardReferenceId?: string;
  language: string;
};

// ---------------------------------------------------------------------------
// Tool result envelope
// ---------------------------------------------------------------------------

export type ToolErrorCode =
  | "AGENCY_NOT_ALLOWED"
  | "TOOL_NOT_ALLOWED"
  | "VALIDATION_FAILED"
  | "TOOL_FAILED";

export type ToolError = {
  code: ToolErrorCode;
  message: string;
  fallbackAvailable: boolean;
};

export type ToolResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: ToolError };

export type SignpostResult = { agency: AgencyContact };
export type ReportHazardResult = { referenceId: string; routedTo: string };
export type GenerateReceiptResult = { receiptId: string; url: string };

// ---------------------------------------------------------------------------
// Worker ↔ frontend
// ---------------------------------------------------------------------------

export type TurnRequest = {
  sessionId?: string;
  kioskId: string;
  audioBase64?: string;
  text?: string;
};

export type TurnState = "listening" | "followup" | "done";

export type TurnResponse = {
  sessionId: string;
  state: TurnState;
  transcript: { english: string; srcLang: string };
  kioskMessage: string;
  audioUrl?: string;
  receiptUrl?: string;
  error?: { code: string; message: string; fallbackAvailable: boolean };
};

// ---------------------------------------------------------------------------
// KV-backed session state
// ---------------------------------------------------------------------------

export type KioskSessionMessage = {
  role: "user" | "kiosk";
  textEnglish: string;
  spokenAt: string;
};

export type KioskSession = {
  id: string;
  kioskId: string;
  history: KioskSessionMessage[];
  srcLang?: string;
  startedAt: string;
};

// ---------------------------------------------------------------------------
// Agency directory
// ---------------------------------------------------------------------------

export type AgencyCategory =
  | "housing"
  | "transport"
  | "healthcare"
  | "social_services"
  | "legal"
  | "financial_assistance"
  | "elderly_activity"
  | "digital_help"
  | "mp_meet_the_people"
  | "rc_visit"
  | "town_council"
  | "hazard_authority"
  | "other";

export type AgencyContact = {
  key: string;
  name: string;
  hotline?: string;
  address?: string;
  url?: string;
  openingHours?: string;
  category: AgencyCategory;
  multilingualBlurb: Record<string, string>;
  latitude?: number;
  longitude?: number;
  walkingDirectionsHint?: string;
  active: boolean;
  source: "seed" | "partner" | "official";
  updatedAt: string;
};

// ---------------------------------------------------------------------------
// Receipt
// ---------------------------------------------------------------------------

export type Receipt = {
  id: string;
  sessionId: string;
  language: string;
  body: string;
  thingsToBring: string[];
  caseSummary?: string;
  signpostedAgencyKey?: string;
  hazardReferenceId?: string;
  generatedAt: string;
};

// ---------------------------------------------------------------------------
// Audit log (optional for the demo, cheap to keep)
// ---------------------------------------------------------------------------

export type ToolName = "signpost" | "reportHazard" | "generateReceipt";

export type ToolInvocation = {
  id: string;
  sessionId: string;
  toolName: ToolName;
  argumentsJson: string;
  resultJson: string;
  startedAt: string;
  completedAt: string;
  success: boolean;
  errorMessage?: string;
};
