import type {
  AgencyCategory,
  AgencyContact,
  Case,
  Receipt,
  ToolInvocation,
  TriageResult,
} from "../../types/contracts";
import type { Repos } from "../../db/repos";
import { signpost, AgencyNotAllowedError } from "../../tools/signpost";
import { findNearby } from "../../tools/findNearby";
import { generateReceipt } from "../../tools/generateReceipt";
import { escalateToMpRc } from "../../tools/escalateToMpRc";
import { isAllowedTool } from "../../tools/registry";

export type ProcessingErrorCode =
  | "AGENCY_NOT_ALLOWED"
  | "TOOL_NOT_ALLOWED"
  | "PROCESSING_FAILED";

export type ProcessingInput = {
  sessionId: string;
  language: string;
  triage: TriageResult;
  transcriptEnglish: string;
  workerUrl: string;
  resident?: { block?: string; unit?: string; alias?: string };
  findNearbyCategory?: AgencyCategory;
  summaryEnglish?: string;
  summaryUserLanguage?: string;
  suggestedNextSteps?: string[];
  kioskId?: string;
};

export type ProcessingOutput = {
  toolName: string;
  agencyContact?: AgencyContact;
  agencyContacts?: AgencyContact[];
  case?: Case;
  receipt?: Receipt;
  toolInvocation: ToolInvocation;
  error?: { code: ProcessingErrorCode; message: string; fallbackAvailable: boolean };
};

export async function runProcessing(
  input: ProcessingInput,
  repos: Repos,
): Promise<ProcessingOutput> {
  const startedAt = new Date().toISOString();

  const requestedTool = input.triage.selectedToolName;
  if (requestedTool && !isAllowedTool(requestedTool)) {
    return errorOut(
      "TOOL_NOT_ALLOWED",
      `Tool "${requestedTool}" is not in the allowlist.`,
      requestedTool,
      startedAt,
      repos,
    );
  }

  if (input.triage.outcome === "simulate_booking") {
    return errorOut(
      "TOOL_NOT_ALLOWED",
      "simulateBooking is not enabled in this build.",
      "simulateBooking",
      startedAt,
      repos,
    );
  }

  try {
    switch (input.triage.outcome) {
      case "signpost":
      case "out_of_scope": {
        const key = input.triage.selectedAgencyKey ?? "";
        const agency = await signpost({ agencyKey: key }, repos);
        return ok("signpost", { agencyContact: agency }, startedAt, repos, input.sessionId, {
          agencyKey: key,
        });
      }
      case "find_nearby": {
        const cat = input.findNearbyCategory;
        if (!cat) {
          return errorOut(
            "PROCESSING_FAILED",
            "find_nearby requires a category.",
            "findNearby",
            startedAt,
            repos,
          );
        }
        const agencies = await findNearby({ category: cat }, repos);
        return ok(
          "findNearby",
          { agencyContacts: agencies },
          startedAt,
          repos,
          input.sessionId,
          { category: cat },
        );
      }
      case "escalate": {
        const summaryEnglish = input.summaryEnglish ?? input.transcriptEnglish.slice(0, 300);
        const c = await escalateToMpRc(
          {
            sessionId: input.sessionId,
            language: input.language,
            summaryEnglish,
            summaryUserLanguage: input.summaryUserLanguage,
            transcript: input.transcriptEnglish,
            suggestedNextSteps: input.suggestedNextSteps ?? [],
            residentBlock: input.resident?.block,
            residentUnit: input.resident?.unit,
            residentNameAlias: input.resident?.alias,
            kioskId: input.kioskId ?? "demo-laptop",
            exportChannel: "csv",
          },
          repos,
        );
        const r = await generateReceipt(
          {
            sessionId: input.sessionId,
            caseId: c.id,
            language: input.language,
            workerUrl: input.workerUrl,
          },
          repos,
        );
        return ok(
          "escalateToMpRc+generateReceipt",
          { case: c, receipt: r },
          startedAt,
          repos,
          input.sessionId,
          { caseId: c.id, receiptId: r.id },
        );
      }
      case "ask_followup":
        return errorOut(
          "PROCESSING_FAILED",
          "ask_followup is owned by the orchestrator, not the processing agent.",
          "n/a",
          startedAt,
          repos,
        );
      default:
        return errorOut(
          "PROCESSING_FAILED",
          `Unknown triage outcome: ${input.triage.outcome}`,
          "n/a",
          startedAt,
          repos,
        );
    }
  } catch (e) {
    if (e instanceof AgencyNotAllowedError) {
      return errorOut(
        "AGENCY_NOT_ALLOWED",
        e.message,
        input.triage.selectedToolName ?? "signpost",
        startedAt,
        repos,
      );
    }
    return errorOut(
      "PROCESSING_FAILED",
      e instanceof Error ? e.message : String(e),
      input.triage.selectedToolName ?? "n/a",
      startedAt,
      repos,
    );
  }
}

async function ok(
  toolName: string,
  payload: Pick<
    ProcessingOutput,
    "agencyContact" | "agencyContacts" | "case" | "receipt"
  >,
  startedAt: string,
  repos: Repos,
  sessionId: string,
  args: Record<string, unknown>,
): Promise<ProcessingOutput> {
  const completedAt = new Date().toISOString();
  const invocation: ToolInvocation = {
    id: `${sessionId}-${completedAt}`,
    sessionId,
    toolName,
    argumentsJson: JSON.stringify(args),
    resultJson: JSON.stringify(payload),
    startedAt,
    completedAt,
    success: true,
  };
  await repos.toolInvocations.record(invocation);
  return { toolName, ...payload, toolInvocation: invocation };
}

async function errorOut(
  code: ProcessingErrorCode,
  message: string,
  toolName: string,
  startedAt: string,
  repos: Repos,
): Promise<ProcessingOutput> {
  const completedAt = new Date().toISOString();
  const invocation: ToolInvocation = {
    id: `err-${completedAt}`,
    sessionId: "",
    toolName,
    argumentsJson: "{}",
    resultJson: JSON.stringify({ code, message }),
    startedAt,
    completedAt,
    success: false,
    errorMessage: message,
  };
  await repos.toolInvocations.record(invocation);
  return {
    toolName,
    toolInvocation: invocation,
    error: { code, message, fallbackAvailable: true },
  };
}
