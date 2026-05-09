import type { AgencyContact, Case, Receipt, TurnResponse } from "@/types/goodbois";

export const mockAgencyContact: AgencyContact = {
  key: "hdb_essential_maintenance",
  name: "HDB Essential Maintenance Service Unit",
  hotline: "1800-225-5432",
  category: "housing",
  openingHours: "24 hours for essential maintenance",
  multilingualBlurb: {
    en: "For urgent HDB estate maintenance issues such as lift faults and water leaks.",
    "zh-Hans": "处理紧急组屋维修问题，例如电梯故障和漏水。",
  },
  active: true,
  source: "seed",
  updatedAt: "2026-05-09T00:00:00+08:00",
};

export const mockCase: Case = {
  id: "GBC-20260509-001",
  sessionId: "demo-session-001",
  language: "zh-Hans",
  summaryEnglish: "Resident reports a broken lift and needs help getting to dialysis.",
  summaryUserLanguage: "居民报告电梯故障，需要协助前往医院洗肾。",
  transcript: "My lift is broken and I cannot go to the hospital for dialysis. Block 123, level 8.",
  suggestedNextSteps: [
    "Call HDB Essential Maintenance Service Unit about the lift fault.",
    "Escalate to MP/RC volunteer team for transport-aid follow-up.",
  ],
  residentBlock: "123",
  residentUnit: "Level 8",
  kioskId: "demo-laptop",
  status: "queued",
  createdAt: "2026-05-09T10:00:00+08:00",
  exportChannel: "csv",
};

export const mockReceipt: Receipt = {
  id: "GBR-20260509-001",
  sessionId: "demo-session-001",
  caseId: mockCase.id,
  language: "zh-Hans",
  pdfUrl: "/fixtures/receipts/GBR-20260509-001.html",
  generatedAt: "2026-05-09T10:01:00+08:00",
};

export const mockTurnResponses: Record<string, TurnResponse> = {
  initial_request: {
    sessionId: "demo-session-001",
    state: "followup",
    transcript: {
      original: "我的电梯坏了，我没办法去医院洗肾。",
      english: "My lift is broken and I cannot go to the hospital for dialysis.",
      language: "zh-Hans",
    },
    kioskMessage: {
      original: "请问您住在哪一座和哪一层？",
      english: "Which block and floor do you live at?",
      language: "zh-Hans",
    },
    triage: {
      outcome: "ask_followup",
      confidence: "high",
    },
    nextActions: ["listen", "type"],
  },
  followup_answer: {
    sessionId: "demo-session-001",
    state: "response",
    transcript: {
      original: "Block 123，八楼。",
      english: "Block 123, level 8.",
      language: "zh-Hans",
    },
    kioskMessage: {
      original: "我可以帮您记录给居民委员会或议员团队跟进交通援助，也会显示 HDB 维修热线。",
      english:
        "I can record this for the RC or MP volunteer team to follow up on transport aid, and show the HDB maintenance hotline.",
      language: "zh-Hans",
    },
    triage: {
      outcome: "signpost",
      confidence: "high",
      selectedToolName: "signpost",
      selectedAgencyKey: "hdb_essential_maintenance",
    },
    agencyContact: mockAgencyContact,
    nextActions: ["accept_escalation", "decline_escalation", "show_receipt"],
  },
  accept_escalation: {
    sessionId: "demo-session-001",
    state: "receipt",
    kioskMessage: {
      original: "已经记录。请保留这张收据，居民委员会或议员团队可用案件编号跟进。",
      english:
        "Recorded. Please keep this receipt; the RC or MP volunteer team can follow up using the case ID.",
      language: "zh-Hans",
    },
    triage: {
      outcome: "escalate",
      confidence: "high",
      selectedToolName: "escalateToMpRc",
    },
    agencyContact: mockAgencyContact,
    case: mockCase,
    receipt: mockReceipt,
    nextActions: ["reset"],
  },
  decline_escalation: {
    sessionId: "demo-session-001",
    state: "response",
    kioskMessage: {
      original: "好的，请保留 HDB 维修热线。如果之后需要交通援助，可以再来这里。",
      english:
        "Okay. Please keep the HDB maintenance hotline. If you need transport help later, come back here.",
      language: "zh-Hans",
    },
    triage: {
      outcome: "signpost",
      confidence: "high",
      selectedToolName: "signpost",
      selectedAgencyKey: "hdb_essential_maintenance",
    },
    agencyContact: mockAgencyContact,
    nextActions: ["reset"],
  },
};
