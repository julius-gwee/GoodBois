// workers/src/agents/triage/index.ts
//
// Triage agent — classifies the resident's request into one of the allowed
// outcomes and picks an allowlisted agency key when applicable. Mock-mode
// uses keyword heuristics; real-mode calls the LLM adapter and clamps the
// response to the allowlist.

import { llmAdapter, type LlmEnv } from "../../ai/llmAdapter";
import type { TriageOutcome } from "../../types/contracts";

export type TriageInput = {
  transcriptEnglish: string;
  language: string;
};

// Decision returned by the agent; the orchestrator wraps this into the full
// `TriageResult` audit row defined in `../../types/contracts.ts` before
// passing it to runProcessing.
export type TriageDecision = {
  outcome: TriageOutcome;
  confidence: "high" | "medium" | "low";
  selectedToolName?: string;
  selectedAgencyKey?: string;
};

const ALLOWED_AGENCY_KEYS = new Set<string>([
  "hdb_essential_maintenance",
  "scdf_emergency",
  "aic_hotline",
]);

const ALLOWED_OUTCOMES = new Set<TriageOutcome>([
  "signpost",
  "find_nearby",
  "ask_followup",
  "escalate",
  "out_of_scope",
]);

const SYSTEM_PROMPT =
  "You are an eldercare kiosk triage agent. Read the resident's English-translated " +
  "request and pick ONE outcome from the allowed list. The outcome guides what the " +
  "kiosk does next.\n\n" +
  "Allowed outcomes: signpost, find_nearby, ask_followup, escalate, out_of_scope.\n" +
  "Allowed agency keys (only use these): hdb_essential_maintenance, scdf_emergency, aic_hotline.\n" +
  "DO NOT invent agency keys.\n\n" +
  "Respond with JSON only:\n" +
  '{"outcome":"<outcome>","confidence":"high|medium|low","selectedToolName":"<tool if relevant>","selectedAgencyKey":"<key if signpost or out_of_scope>"}';

function isMockMode(env: LlmEnv): boolean {
  return env.LLM_MOCK === "true" || !env.AI;
}

function mockTriage(transcriptEnglish: string): TriageDecision {
  const text = transcriptEnglish.toLowerCase();

  if (text.includes("emergency") || text.includes("995") || text.includes("ambulance")) {
    return {
      outcome: "out_of_scope",
      confidence: "high",
      selectedToolName: "signpost",
      selectedAgencyKey: "scdf_emergency",
    };
  }

  if (
    text.includes("block") ||
    text.includes("level") ||
    text.includes("floor")
  ) {
    return {
      outcome: "signpost",
      confidence: "high",
      selectedToolName: "signpost",
      selectedAgencyKey: "hdb_essential_maintenance",
    };
  }

  if (text.includes("accept") || text.includes("yes")) {
    return {
      outcome: "escalate",
      confidence: "high",
      selectedToolName: "escalateToMpRc",
    };
  }

  return {
    outcome: "out_of_scope",
    confidence: "low",
    selectedToolName: "signpost",
    selectedAgencyKey: "aic_hotline",
  };
}

export async function runTriage(
  input: TriageInput,
  env: LlmEnv
): Promise<TriageDecision> {
  if (isMockMode(env)) {
    return mockTriage(input.transcriptEnglish);
  }

  const result = await llmAdapter<TriageDecision>(
    {
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: input.transcriptEnglish },
      ],
    },
    env
  );

  if (!result.parsed) {
    return { outcome: "out_of_scope", confidence: "low" };
  }

  const outcome = ALLOWED_OUTCOMES.has(result.parsed.outcome)
    ? result.parsed.outcome
    : "out_of_scope";

  const agencyKey =
    result.parsed.selectedAgencyKey &&
    ALLOWED_AGENCY_KEYS.has(result.parsed.selectedAgencyKey)
      ? result.parsed.selectedAgencyKey
      : undefined;

  return {
    outcome,
    confidence: result.parsed.confidence ?? "medium",
    selectedToolName: result.parsed.selectedToolName,
    selectedAgencyKey: agencyKey,
  };
}
