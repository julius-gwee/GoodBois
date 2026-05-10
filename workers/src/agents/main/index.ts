// workers/src/agents/main/index.ts
//
// LLM call #2. Emits the full LLMTurnDecision (kioskMessage + toolCalls[]).
// The orchestrator calls this exactly once per conversation (modulo the
// retry guard).
//
// Invariants this agent owns (spec §9):
//   5. generateReceipt is MANDATORY in toolCalls. We retry once with an
//      explicit hint; if the model still omits it, we synthesise a minimal
//      generateReceipt call from the decision's kioskMessage so the demo
//      always produces a receipt artifact.
//
// Tool-name validation lives in the LLM adapter's sanitiseToolCalls — by the
// time decisions reach this agent, unknown / malformed tool calls have
// already been stripped.

import { decide, type LlmEnv } from "../../ai/llmAdapter";
import type {
  GenerateReceiptArgs,
  KioskSessionMessage,
  LLMTurnDecision,
  MainRequestType,
  ToolCall,
} from "../../types/contracts";

export type MainAgentInput = {
  requestType: MainRequestType;
  transcriptEn: string;
  history: KioskSessionMessage[];
  agencyKeys: string[];
  srcLang: string;
};

// Number of retries after the initial call. 1 retry → up to 2 total calls.
export const MAX_RETRIES = 1;

const RETRY_HINT =
  "Your previous response omitted the generateReceipt tool call. " +
  "generateReceipt is MANDATORY in every terminal turn — every LLMTurnDecision " +
  "must include exactly one generateReceipt call as the LAST entry in toolCalls. " +
  "Re-emit your decision with a generateReceipt call appended to toolCalls.";

function hasGenerateReceipt(toolCalls: ToolCall[]): boolean {
  return toolCalls.some((c) => c.name === "generateReceipt");
}

function pickSignpostedAgencyKey(toolCalls: ToolCall[]): string | undefined {
  for (const c of toolCalls) {
    if (c.name === "signpost") return c.args.agencyKey;
  }
  return undefined;
}

// Synthesise a minimal generateReceipt call when the LLM keeps omitting it.
// The kioskMessage is the LLM's stated intent so it makes a reasonable body;
// the signposted agency (if any) carries through so the receipt template
// still hydrates an agency block.
function synthesiseReceipt(
  decision: LLMTurnDecision,
  input: MainAgentInput,
): LLMTurnDecision {
  const args: GenerateReceiptArgs = {
    body: decision.kioskMessage,
    thingsToBring: [],
    signpostedAgencyKey: pickSignpostedAgencyKey(decision.toolCalls),
    language: input.srcLang,
  };
  return {
    ...decision,
    toolCalls: [...decision.toolCalls, { name: "generateReceipt", args }],
  };
}

export async function runMainAgent(
  input: MainAgentInput,
  env: LlmEnv,
): Promise<LLMTurnDecision> {
  let decision = await decide(input, env);

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    if (hasGenerateReceipt(decision.toolCalls)) return decision;
    decision = await decide({ ...input, retryHint: RETRY_HINT }, env);
  }

  if (!hasGenerateReceipt(decision.toolCalls)) {
    return synthesiseReceipt(decision, input);
  }

  return decision;
}
