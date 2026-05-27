// workers/src/ai/classifyLlm.ts
//
// LLM call #1 — the classifier entry point:
//
//   classify(input, env) → ClassifierDecision
//
// Owns its own system prompt, mock heuristics, and response validation.
// The backend pick and JSON parsing live in ./llmBackend.

import type {
  ClassifierDecision,
  ClassifierRequestType,
  KioskSessionMessage,
} from "../types/contracts";
import {
  historyToMessages,
  pickBackend,
  runLlm,
  tryParseJson,
  type LlmEnv,
  type LlmMessage,
} from "./llmBackend";

export type ClassifyInput = {
  transcriptEn: string;
  history: KioskSessionMessage[];
};

const CLASSIFIER_SYSTEM_PROMPT =
  "You are the classifier for an elderly-care kiosk in Singapore HDB void decks. " +
  "Read the resident's most recent request (already translated to English) along with the conversation history. " +
  "Pick exactly ONE requestType.\n\n" +
  "Allowed values:\n" +
  "- signpost: route the resident to a single agency (housing, transport, healthcare, MP/RC, town council, etc.)\n" +
  "- report_hazard: a public-safety hazard (broken void-deck light, lift outage, pothole, drainage, blocked ramp)\n" +
  "- out_of_scope: outside the kiosk's remit (medical or legal advice, true 995/999 emergencies, anything we should not handle)\n" +
  "- ask_followup: the request is unclear; ask ONE short clarifying question (no more than 15 words). " +
  "Do NOT ask a follow-up if the conversation already has 3 or more user turns — pick a terminal type instead.\n\n" +
  "Respond with JSON ONLY. No markdown, no commentary, no code fences. Schema:\n" +
  '{"requestType":"<type>","followupPrompt":"<English string, only when type is ask_followup>"}';

const CLASSIFIER_REQUEST_TYPES: ReadonlySet<ClassifierRequestType> = new Set([
  "signpost",
  "report_hazard",
  "out_of_scope",
  "ask_followup",
]);

function mockClassify(input: ClassifyInput): ClassifierDecision {
  const text = input.transcriptEn.toLowerCase();
  const userTurns = input.history.filter((h) => h.role === "user").length;

  // Hazard keywords
  if (
    /\b(broken light|void deck|pothole|spoilt|water leak|trip|drain blocked)\b/.test(
      text,
    ) ||
    text.includes("hazard")
  ) {
    return { requestType: "report_hazard" };
  }

  // Emergency / out-of-scope
  if (/\b(995|999|ambulance|emergency)\b/.test(text)) {
    return { requestType: "out_of_scope" };
  }

  // Lift fault without block/floor → followup (until we've already asked twice)
  if (
    (text.includes("lift") || text.includes("elevator")) &&
    !text.includes("block") &&
    !text.includes("level") &&
    userTurns < 3
  ) {
    return {
      requestType: "ask_followup",
      followupPrompt: "Which block and floor do you live at?",
    };
  }

  // Eye-check style query → followup once, but only if the resident hasn't
  // already named a clinic type. The followup question is "polyclinic or
  // hospital?" so we skip it if either word is already in the transcript.
  if (
    text.includes("eye") &&
    !text.includes("polyclinic") &&
    !text.includes("hospital") &&
    userTurns < 3
  ) {
    return {
      requestType: "ask_followup",
      followupPrompt: "Are you looking for a polyclinic or a hospital eye clinic?",
    };
  }

  return { requestType: "signpost" };
}

export async function classify(
  input: ClassifyInput,
  env: LlmEnv,
): Promise<ClassifierDecision> {
  if (pickBackend(env) === "mock") return mockClassify(input);

  const messages: LlmMessage[] = [
    { role: "system", content: CLASSIFIER_SYSTEM_PROMPT },
    ...historyToMessages(input.history),
    { role: "user", content: input.transcriptEn },
  ];

  const raw = await runLlm(messages, env);
  const parsed = tryParseJson<{
    requestType?: string;
    followupPrompt?: string;
  }>(raw);

  if (!parsed || !parsed.requestType) {
    return { requestType: "out_of_scope" };
  }

  const requestType = CLASSIFIER_REQUEST_TYPES.has(
    parsed.requestType as ClassifierRequestType,
  )
    ? (parsed.requestType as ClassifierRequestType)
    : "out_of_scope";

  if (requestType === "ask_followup") {
    const prompt = parsed.followupPrompt?.trim();
    if (!prompt) {
      return { requestType: "out_of_scope" };
    }
    return { requestType: "ask_followup", followupPrompt: prompt };
  }

  return { requestType };
}
