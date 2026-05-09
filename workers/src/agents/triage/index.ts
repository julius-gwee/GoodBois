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

// Agency keys must match Dev B's seeded directory at workers/src/db/seeds/agencies.ts.
// Keep this list aligned with that file (subset is fine; superset will fail at runProcessing).
const ALLOWED_AGENCY_KEYS = new Set<string>([
  "hdb_essential_maintenance",
  "hdb_branch_office",
  "lta_customer_service",
  "transport_aid_silver_generation",
  "aic_eldercare_hotline",
  "scdf_emergency",
  "police_non_emergency",
  "legal_aid_bureau",
  "family_service_centre",
  "silver_generation_office",
  "comcare_hotline",
  "cpf_senior_hotline",
  "peoples_association",
  "active_ageing_centre",
  "skillsfuture_singapore",
  "sg_digital_office_seniors_go_digital",
  "mp_meet_the_people_session",
  "rc_visit",
]);

const ALLOWED_OUTCOMES = new Set<TriageOutcome>([
  "signpost",
  "find_nearby",
  "ask_followup",
  "escalate",
  "out_of_scope",
]);

const SYSTEM_PROMPT =
  "You are the triage agent for an elderly-care kiosk in Singapore HDB void decks. " +
  "Read the resident's request (already translated to English) and pick ONE outcome " +
  "and ONE agency key from the allowed lists.\n\n" +
  "Allowed outcomes:\n" +
  "- signpost: refer the resident to a single agency that directly handles their issue.\n" +
  "- escalate: complex case, hand off to MP/RC volunteer with a structured Case + receipt.\n" +
  "- ask_followup: the request is unclear; orchestrator will handle this separately, only pick if no other outcome fits.\n" +
  "- out_of_scope: medical/legal/emergency that's outside our remit; signpost to a curated emergency hotline.\n" +
  "- find_nearby: resident wants to find a nearby service of a category.\n\n" +
  "Allowed agency keys (use exactly one of these, do NOT invent new keys):\n" +
  "- hdb_essential_maintenance — lift faults, water leaks, urgent housing maintenance\n" +
  "- hdb_branch_office — non-urgent housing matters\n" +
  "- lta_customer_service — public transport accessibility, concession cards\n" +
  "- transport_aid_silver_generation — transport help for elderly to medical appointments\n" +
  "- aic_eldercare_hotline — general eldercare help, signposting, case follow-up (Agency for Integrated Care)\n" +
  "- scdf_emergency — medical emergencies, fires, rescues (995)\n" +
  "- police_non_emergency — police matters that aren't 999 emergencies\n" +
  "- legal_aid_bureau — legal advice for low-income residents\n" +
  "- family_service_centre — family / social support, mental health\n" +
  "- silver_generation_office — wellness checks, befriender services\n" +
  "- comcare_hotline — financial assistance for low-income\n" +
  "- cpf_senior_hotline — CPF withdrawals, retirement\n" +
  "- peoples_association — grassroots / community activities\n" +
  "- active_ageing_centre — senior activities, social engagement\n" +
  "- skillsfuture_singapore — adult learning credits\n" +
  "- sg_digital_office_seniors_go_digital — digital literacy help\n" +
  "- mp_meet_the_people_session — weekly MP session for complex cases\n" +
  "- rc_visit — Residents' Committee community visit\n\n" +
  "Tools you may select (selectedToolName field):\n" +
  "- signpost — for outcome=signpost or out_of_scope\n" +
  "- escalateToMpRc — for outcome=escalate\n" +
  "- findNearby — for outcome=find_nearby\n\n" +
  "Respond with JSON ONLY. No markdown, no commentary, no code fences. Schema:\n" +
  '{"outcome":"<outcome>","confidence":"high"|"medium"|"low","selectedToolName":"<tool>","selectedAgencyKey":"<agency key>"}';

function isMockMode(env: LlmEnv): boolean {
  if (env.LLM_MOCK === "true") return true;
  if (env.AI || env.SEALION_API_KEY) return false;
  return true;
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
    selectedAgencyKey: "aic_eldercare_hotline",
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
