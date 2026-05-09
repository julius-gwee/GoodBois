// workers/src/orchestrator/runProcessingStub.ts
//
// LOCAL STUB for Dev B's runProcessing function. Replace this import with
// `import { runProcessing } from "../agents/processing"` once Dev B's
// `jacksonB/tools-and-cases` branch lands.

import type { AgencyContact, Case, Receipt } from "../types/contracts";

export type ProcessingInput = {
  sessionId: string;
  language: string;
  triage: {
    outcome: string;
    selectedAgencyKey?: string;
    selectedToolName?: string;
  };
  transcriptEnglish: string;
  resident?: { block?: string; unit?: string; alias?: string };
};

export type ProcessingErrorCode =
  | "AGENCY_NOT_ALLOWED"
  | "TOOL_NOT_ALLOWED"
  | "PROCESSING_FAILED";

export type ProcessingOutput = {
  toolName?: string;
  agencyContact?: AgencyContact;
  agencyContacts?: AgencyContact[];
  case?: Case;
  receipt?: Receipt;
  error?: {
    code: ProcessingErrorCode;
    message: string;
    fallbackAvailable: boolean;
  };
};

const STUB_AGENCIES: Record<string, AgencyContact> = {
  hdb_essential_maintenance: {
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
  },
  scdf_emergency: {
    key: "scdf_emergency",
    name: "SCDF Emergency",
    hotline: "995",
    category: "healthcare",
    openingHours: "24/7",
    multilingualBlurb: {
      en: "Singapore Civil Defence Force emergency line for medical emergencies, fires, and rescues.",
      "zh-Hans": "新加坡民防部队紧急热线，处理医疗紧急情况、火灾和救援。",
    },
    active: true,
    source: "official",
    updatedAt: "2026-05-09T00:00:00+08:00",
  },
  aic_hotline: {
    key: "aic_hotline",
    name: "Agency for Integrated Care Hotline",
    hotline: "1800-650-6060",
    category: "social_services",
    openingHours: "Mon–Fri 8.30am–8.30pm; Sat 8.30am–4pm",
    multilingualBlurb: {
      en: "AIC eldercare hotline for general help, signposting and case follow-up.",
      "zh-Hans": "新加坡综合护理机构热线，提供老年护理一般帮助、转介和案件跟进。",
    },
    active: true,
    source: "official",
    updatedAt: "2026-05-09T00:00:00+08:00",
  },
};

function pad3(n: number): string {
  return String(Math.max(1, Math.min(999, n))).padStart(3, "0");
}

function todayCompact(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}${m}${day}`;
}

export async function runProcessingStub(
  input: ProcessingInput,
  env: unknown
): Promise<ProcessingOutput> {
  void env;
  const { triage, sessionId, language, transcriptEnglish } = input;

  if (triage.outcome === "signpost" || triage.outcome === "out_of_scope") {
    if (!triage.selectedAgencyKey) {
      return {
        error: {
          code: "AGENCY_NOT_ALLOWED",
          message: "Triage selected no agency key.",
          fallbackAvailable: true,
        },
      };
    }
    const agency = STUB_AGENCIES[triage.selectedAgencyKey];
    if (!agency) {
      return {
        error: {
          code: "AGENCY_NOT_ALLOWED",
          message: `Agency '${triage.selectedAgencyKey}' is not in the allowlist.`,
          fallbackAvailable: true,
        },
      };
    }
    return { toolName: "signpost", agencyContact: agency };
  }

  if (triage.outcome === "escalate") {
    const counter = pad3(Math.floor(Math.random() * 999) + 1);
    const date = todayCompact();
    const caseId = `GBC-${date}-${counter}`;
    const receiptId = `GBR-${date}-${counter}`;
    const now = new Date().toISOString();

    return {
      toolName: "escalateToMpRc",
      case: {
        id: caseId,
        sessionId,
        language,
        summaryEnglish: transcriptEnglish,
        transcript: transcriptEnglish,
        suggestedNextSteps: ["RC volunteer to follow up with resident."],
        kioskId: "demo-laptop",
        status: "queued",
        createdAt: now,
        exportChannel: "csv",
      },
      receipt: {
        id: receiptId,
        sessionId,
        caseId,
        language,
        pdfUrl: "/fixtures/receipts/GBR-20260509-001.html",
        generatedAt: now,
      },
    };
  }

  if (triage.outcome === "simulate_booking") {
    return {
      error: {
        code: "TOOL_NOT_ALLOWED",
        message: "simulateBooking is not enabled in MVP.",
        fallbackAvailable: true,
      },
    };
  }

  return {
    error: {
      code: "PROCESSING_FAILED",
      message: `No handler for triage outcome: ${triage.outcome}`,
      fallbackAvailable: true,
    },
  };
}
