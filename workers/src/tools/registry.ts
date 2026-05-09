// workers/src/tools/registry.ts
//
// The single surface between the orchestrator and the tool layer. The
// orchestrator never imports a specific tool file — it walks
// LLMTurnDecision.toolCalls in array order and calls invokeTool(name, args)
// for each one.
//
// Tools NEVER throw to the orchestrator. They return ToolResult<T>.

import type {
  GenerateReceiptArgs,
  GenerateReceiptResult,
  ReportHazardResult,
  SignpostResult,
  ToolError,
  ToolResult,
} from "../types/contracts";
import type { Repos } from "../db/repos";
import type { HazardMailer } from "../integrations/email";
import { signpost, AgencyNotAllowedError } from "./signpost";
import { reportHazard } from "./reportHazard";
import { generateReceipt } from "./generateReceipt";

export const ALLOWLIST = [
  "signpost",
  "reportHazard",
  "generateReceipt",
] as const;

export type ToolName = (typeof ALLOWLIST)[number];

const allowedSet = new Set<string>(ALLOWLIST);

export function isAllowedTool(name: string): name is ToolName {
  return allowedSet.has(name);
}

// Context the orchestrator passes through on every invokeTool call. Tools
// pick what they need; the registry hydrates inter-tool data from
// `priorToolResults` (e.g. generateReceipt reads the referenceId from a
// preceding reportHazard call).
export type ToolCtx = {
  repos: Repos;
  workerUrl: string;
  sessionId: string;
  srcLang: string;
  kioskId?: string;
  hazardMailer?: HazardMailer;
  priorToolResults: Partial<{
    signpost: SignpostResult;
    reportHazard: ReportHazardResult;
    generateReceipt: GenerateReceiptResult;
  }>;
};

export type ToolArgs =
  | { name: "signpost"; args: { agencyKey: string } }
  | {
      name: "reportHazard";
      args: { category: string; location: string; description: string };
    }
  | { name: "generateReceipt"; args: GenerateReceiptArgs };

export async function invokeTool(
  call: ToolArgs,
  ctx: ToolCtx,
): Promise<ToolResult> {
  if (!isAllowedTool(call.name)) {
    return err("TOOL_NOT_ALLOWED", `Tool "${call.name}" is not in the allowlist.`);
  }

  try {
    switch (call.name) {
      case "signpost": {
        const agency = await signpost(call.args, ctx.repos);
        const result: SignpostResult = { agency };
        return ok(result);
      }

      case "reportHazard": {
        const result = await reportHazard(call.args, {
          mailer: ctx.hazardMailer,
          sessionId: ctx.sessionId,
          srcLang: ctx.srcLang,
        });
        return ok(result);
      }

      case "generateReceipt": {
        // Spec invariant 8: inter-tool data flow is orchestrator-side, not
        // LLM-predicted. If a reportHazard ran earlier in this turn, its
        // referenceId always wins over whatever the LLM emitted (which in
        // practice is often a literal placeholder like "[HAZARD_REFERENCE_ID]"
        // because the model can't know the runtime id).
        const priorHazardRef = ctx.priorToolResults.reportHazard?.referenceId;
        const hydrated: GenerateReceiptArgs = {
          ...call.args,
          hazardReferenceId: priorHazardRef ?? call.args.hazardReferenceId,
        };
        const result = await generateReceipt(hydrated, {
          repos: ctx.repos,
          workerUrl: ctx.workerUrl,
          sessionId: ctx.sessionId,
        });
        return ok(result);
      }
    }
  } catch (e) {
    if (e instanceof AgencyNotAllowedError) {
      return err("AGENCY_NOT_ALLOWED", e.message);
    }
    return err("TOOL_FAILED", e instanceof Error ? e.message : String(e));
  }
}

function ok<T>(data: T): ToolResult<T> {
  return { ok: true, data };
}

function err(code: ToolError["code"], message: string): ToolResult {
  return {
    ok: false,
    error: { code, message, fallbackAvailable: true },
  };
}
