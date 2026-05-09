export type UtteranceMode = "voice" | "touch" | "scripted_demo";

export type TriageOutcome =
  | "signpost"
  | "find_nearby"
  | "simulate_booking"
  | "ask_followup"
  | "escalate"
  | "out_of_scope";

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
  active: boolean;
  source: "seed" | "partner" | "official";
  updatedAt: string;
};

export type Case = {
  id: string;
  sessionId: string;
  language: string;
  summaryEnglish: string;
  summaryUserLanguage?: string;
  transcript: string;
  suggestedNextSteps: string[];
  residentBlock?: string;
  residentUnit?: string;
  residentNameAlias?: string;
  kioskId: string;
  status: "queued" | "exported" | "received" | "closed";
  createdAt: string;
  exportedAt?: string;
  exportChannel?: "csv" | "webhook" | "email";
};

export type Receipt = {
  id: string;
  sessionId: string;
  caseId?: string;
  language: string;
  pdfUrl: string;
  generatedAt: string;
};

export type TurnRequest = {
  sessionId?: string;
  kioskId: string;
  language: string;
  mode: UtteranceMode;
  text?: string;
  audioBase64?: string;
  scriptedStep?: "initial_request" | "followup_answer" | "accept_escalation";
};

export type TurnResponse = {
  sessionId: string;
  state: "listening" | "thinking" | "followup" | "response" | "receipt" | "error";
  transcript?: {
    original: string;
    english?: string;
    language: string;
  };
  kioskMessage: {
    original: string;
    english: string;
    language: string;
  };
  triage?: {
    outcome: TriageOutcome;
    confidence: "high" | "medium" | "low";
    selectedToolName?: string;
    selectedAgencyKey?: string;
  };
  agencyContact?: AgencyContact;
  case?: Case;
  receipt?: Receipt;
  audioUrl?: string;
  nextActions: Array<
    | "listen"
    | "type"
    | "accept_escalation"
    | "decline_escalation"
    | "show_receipt"
    | "reset"
  >;
  error?: {
    code: string;
    message: string;
    fallbackAvailable: boolean;
  };
};

export type TriageResult = {
  id: string;
  sessionId: string;
  outcome: TriageOutcome;
  confidence: "high" | "medium" | "low";
  selectedToolName?: string;
  selectedAgencyKey?: string;
  followupQuestion?: string;
  reasoningSummary: string;
  createdAt: string;
};

export type ToolInvocation = {
  id: string;
  sessionId: string;
  toolName: string;
  argumentsJson: string;
  resultJson: string;
  startedAt: string;
  completedAt: string;
  success: boolean;
  errorMessage?: string;
};
