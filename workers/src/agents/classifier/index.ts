// workers/src/agents/classifier/index.ts
//
// LLM call #1. Tags the resident's request with a requestType. Stateless —
// the *loop* lives in the orchestrator (spec §2 stage 2). This file owns the
// invariants:
//
//   1. ask_followup is only legal while the resident has had < MAX_FOLLOWUPS user
//      turns. Beyond that we force a terminal decision so the kiosk never loops
//      forever.
//   2. ask_followup MUST carry a non-empty followupPrompt; otherwise downgrade
//      to out_of_scope.
//
// The system prompt + JSON parsing live in workers/src/ai/llmAdapter.ts; this
// agent is the contract surface the orchestrator imports.

import { classify, type LlmEnv } from "../../ai/llmAdapter";
import type {
  ClassifierDecision,
  KioskSessionMessage,
} from "../../types/contracts";

export type ClassifierInput = {
  transcriptEn: string;
  history: KioskSessionMessage[];
};

export const MAX_FOLLOWUPS = 3;

function userTurnCount(history: KioskSessionMessage[]): number {
  return history.filter((h) => h.role === "user").length;
}

export async function runClassifier(
  input: ClassifierInput,
  env: LlmEnv,
): Promise<ClassifierDecision> {
  const decision = await classify(input, env);

  // Cap on followups — once we've asked and listened MAX_FOLLOWUPS times, the
  // resident's request is terminal regardless of what the LLM says.
  if (decision.requestType === "ask_followup") {
    if (userTurnCount(input.history) >= MAX_FOLLOWUPS) {
      return { requestType: "out_of_scope" };
    }
    if (!decision.followupPrompt?.trim()) {
      return { requestType: "out_of_scope" };
    }
  }

  return decision;
}
