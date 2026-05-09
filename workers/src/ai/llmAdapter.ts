// workers/src/ai/llmAdapter.ts
//
// LLM adapter exposing the two named entry points the spec requires:
//
//   classify(input, env) → ClassifierDecision
//   decide(input, env)   → LLMTurnDecision
//
// Each entry point owns its own system prompt and validation. Both share the
// backend pick (SEALion / Workers AI / mock) and the JSON-parsing helper.
// Backends in priority order:
//   1. SEALion (Gemma SEA-LION v4 27B IT) when SEALION_API_KEY is set
//      — preferred for SEA-language fluency.
//   2. Cloudflare Workers AI Llama-3 when env.AI is bound.
//   3. Mock keyword heuristics — offline dev / tests / CI.

import type {
  ClassifierDecision,
  ClassifierRequestType,
  KioskSessionMessage,
  LLMTurnDecision,
  MainRequestType,
  ToolCall,
} from "../types/contracts";
import { isAllowedTool } from "../tools/registry";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type LlmEnv = {
  AI?: {
    run: (
      model: string,
      input: unknown,
    ) => Promise<{ response?: string; result?: { response?: string } }>;
  };
  LLM_MOCK?: string;
  SEALION_API_KEY?: string;
  SEALION_BASE_URL?: string;
};

export type ClassifyInput = {
  transcriptEn: string;
  history: KioskSessionMessage[];
};

export type DecideInput = {
  requestType: MainRequestType;
  transcriptEn: string;
  history: KioskSessionMessage[];
  agencyKeys: string[];
  srcLang: string;
  retryHint?: string;
};

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

type LlmMessage = { role: "system" | "user" | "assistant"; content: string };
type Backend = "mock" | "sealion" | "workers-ai";

const SEALION_DEFAULT_BASE_URL = "https://api.sea-lion.ai/v1";
const SEALION_MODEL = "aisingapore/Gemma-SEA-LION-v4-27B-IT";
const WORKERS_AI_MODEL = "@cf/meta/llama-3.1-8b-instruct";

function pickBackend(env: LlmEnv): Backend {
  if (env.LLM_MOCK === "true") return "mock";
  if (env.SEALION_API_KEY) return "sealion";
  if (env.AI) return "workers-ai";
  return "mock";
}

function historyToMessages(history: KioskSessionMessage[]): LlmMessage[] {
  return history.map((h) => ({
    role: h.role === "user" ? "user" : "assistant",
    content: h.textEnglish,
  }));
}

function stripCodeFences(raw: string): string {
  const trimmed = raw.trim();
  const fenceMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fenceMatch) return fenceMatch[1].trim();
  const objectMatch = trimmed.match(/\{[\s\S]*\}/);
  if (objectMatch) return objectMatch[0];
  return trimmed;
}

function tryParseJson<T>(raw: string): T | undefined {
  try {
    return JSON.parse(stripCodeFences(raw)) as T;
  } catch {
    return undefined;
  }
}

async function callSealion(
  messages: LlmMessage[],
  env: LlmEnv,
): Promise<string> {
  const baseUrl = env.SEALION_BASE_URL ?? SEALION_DEFAULT_BASE_URL;
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${env.SEALION_API_KEY}`,
    },
    body: JSON.stringify({
      model: SEALION_MODEL,
      messages,
      max_tokens: 1024,
      temperature: 0,
    }),
  });

  if (!response.ok) {
    throw new Error(`SEALion LLM failed: ${response.status}`);
  }

  const json = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  return json.choices?.[0]?.message?.content ?? "";
}

async function callWorkersAi(
  messages: LlmMessage[],
  env: LlmEnv,
): Promise<string> {
  const result = await env.AI!.run(WORKERS_AI_MODEL, {
    messages,
    max_tokens: 1024,
  });
  return result.response ?? result.result?.response ?? "";
}

async function runLlm(
  messages: LlmMessage[],
  env: LlmEnv,
): Promise<string> {
  const backend = pickBackend(env);
  if (backend === "sealion") return callSealion(messages, env);
  if (backend === "workers-ai") return callWorkersAi(messages, env);
  throw new Error("runLlm called in mock backend — guard upstream");
}

// ---------------------------------------------------------------------------
// classify (LLM call #1)
// ---------------------------------------------------------------------------

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

  // Eye-check style query → followup once
  if (text.includes("eye") && userTurns < 3) {
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

// ---------------------------------------------------------------------------
// decide (LLM call #2)
// ---------------------------------------------------------------------------

const MAIN_REQUEST_TYPES: ReadonlySet<MainRequestType> = new Set([
  "signpost",
  "report_hazard",
  "out_of_scope",
]);

function mainSystemPrompt(input: DecideInput): string {
  const keys = input.agencyKeys.length
    ? input.agencyKeys.map((k) => `  - ${k}`).join("\n")
    : "  (none — use signpost cautiously)";

  return [
    "You are the main reasoning agent for an elderly-care kiosk in Singapore HDB void decks.",
    `The classifier has already determined requestType = "${input.requestType}".`,
    "",
    "Emit an LLMTurnDecision JSON object.",
    "",
    "RULES:",
    "1. The toolCalls array MUST include a generateReceipt call. It is mandatory in every terminal turn.",
    "2. Tool order matters — tools execute in array order. If you reportHazard, do that BEFORE generateReceipt so the reference id can be hydrated into the receipt.",
    "3. kioskMessage is short, conversational English. It is what the resident hears (TTS) and sees in the chat bubble. It is NOT the receipt body.",
    "4. The receipt body lives in generateReceipt.args.body. Write it explicitly — agency address, walk-in hours, what to do.",
    "5. Use generateReceipt.args.language = " + JSON.stringify(input.srcLang) + ".",
    "6. Only use agency keys from the allowed list below. Do not invent new keys.",
    "",
    "Allowed agency keys:",
    keys,
    "",
    "Tool signatures:",
    '  signpost({ agencyKey: string })',
    '  reportHazard({ category: string, location: string, description: string })',
    '  generateReceipt({ body: string, thingsToBring?: string[], caseSummary?: string, signpostedAgencyKey?: string, hazardReferenceId?: string, language: string })',
    "",
    "Respond with JSON ONLY. No markdown, no commentary, no code fences. Schema:",
    '{',
    '  "requestType": "signpost" | "report_hazard" | "out_of_scope",',
    '  "kioskMessage": "<short conversational English>",',
    '  "toolCalls": [',
    '    { "name": "<tool name>", "args": { ... } }',
    '  ]',
    '}',
  ].join("\n");
}

function mockDecide(input: DecideInput): LLMTurnDecision {
  // Deterministic placeholder decisions for offline dev / tests.
  // Production callers should set SEALION_API_KEY or env.AI.
  const lang = input.srcLang;

  switch (input.requestType) {
    case "report_hazard":
      return {
        requestType: "report_hazard",
        kioskMessage:
          "I've filed a report with the town council. Your reference is on the receipt.",
        toolCalls: [
          {
            name: "reportHazard",
            args: {
              category: "lighting",
              location: "void deck",
              description: input.transcriptEn,
            },
          },
          {
            name: "generateReceipt",
            args: {
              body: "Hazard report filed.\nExpected response: 3 working days.",
              thingsToBring: [],
              language: lang,
            },
          },
        ],
      };

    case "out_of_scope":
      return {
        requestType: "out_of_scope",
        kioskMessage:
          "I cannot help with that here. Please call the relevant hotline on the receipt.",
        toolCalls: [
          {
            name: "generateReceipt",
            args: {
              body: "This request is outside the kiosk's scope. Please use the contact below.",
              thingsToBring: [],
              language: lang,
            },
          },
        ],
      };

    case "signpost":
    default: {
      const fallbackKey = input.agencyKeys[0];
      const toolCalls: ToolCall[] = [];
      if (fallbackKey) {
        toolCalls.push({ name: "signpost", args: { agencyKey: fallbackKey } });
      }
      toolCalls.push({
        name: "generateReceipt",
        args: {
          body: "Please contact the agency listed below for help.",
          thingsToBring: [],
          signpostedAgencyKey: fallbackKey,
          language: lang,
        },
      });
      return {
        requestType: "signpost",
        kioskMessage:
          "I've printed a receipt with the agency contact and what to bring.",
        toolCalls,
      };
    }
  }
}

function sanitiseToolCalls(raw: unknown): ToolCall[] {
  if (!Array.isArray(raw)) return [];
  const out: ToolCall[] = [];
  for (const candidate of raw) {
    if (
      !candidate ||
      typeof candidate !== "object" ||
      typeof (candidate as { name?: unknown }).name !== "string"
    ) {
      continue;
    }
    const name = (candidate as { name: string }).name;
    if (!isAllowedTool(name)) continue;
    const args = (candidate as { args?: unknown }).args;
    if (!args || typeof args !== "object") continue;

    if (name === "signpost") {
      const k = (args as { agencyKey?: unknown }).agencyKey;
      if (typeof k === "string" && k.length > 0) {
        out.push({ name: "signpost", args: { agencyKey: k } });
      }
    } else if (name === "reportHazard") {
      const a = args as {
        category?: unknown;
        location?: unknown;
        description?: unknown;
      };
      if (
        typeof a.category === "string" &&
        typeof a.location === "string" &&
        typeof a.description === "string"
      ) {
        out.push({
          name: "reportHazard",
          args: {
            category: a.category,
            location: a.location,
            description: a.description,
          },
        });
      }
    } else if (name === "generateReceipt") {
      const a = args as {
        body?: unknown;
        thingsToBring?: unknown;
        caseSummary?: unknown;
        signpostedAgencyKey?: unknown;
        hazardReferenceId?: unknown;
        language?: unknown;
      };
      if (typeof a.body === "string" && typeof a.language === "string") {
        out.push({
          name: "generateReceipt",
          args: {
            body: a.body,
            thingsToBring: Array.isArray(a.thingsToBring)
              ? a.thingsToBring.filter((s): s is string => typeof s === "string")
              : undefined,
            caseSummary:
              typeof a.caseSummary === "string" ? a.caseSummary : undefined,
            signpostedAgencyKey:
              typeof a.signpostedAgencyKey === "string"
                ? a.signpostedAgencyKey
                : undefined,
            hazardReferenceId:
              typeof a.hazardReferenceId === "string"
                ? a.hazardReferenceId
                : undefined,
            language: a.language,
          },
        });
      }
    }
  }
  return out;
}

export async function decide(
  input: DecideInput,
  env: LlmEnv,
): Promise<LLMTurnDecision> {
  if (pickBackend(env) === "mock") return mockDecide(input);

  const systemMessages: LlmMessage[] = [
    { role: "system", content: mainSystemPrompt(input) },
  ];
  if (input.retryHint) {
    systemMessages.push({ role: "system", content: input.retryHint });
  }

  const messages: LlmMessage[] = [
    ...systemMessages,
    ...historyToMessages(input.history),
    { role: "user", content: input.transcriptEn },
  ];

  const raw = await runLlm(messages, env);
  const parsed = tryParseJson<{
    requestType?: string;
    kioskMessage?: string;
    toolCalls?: unknown;
  }>(raw);

  if (!parsed) {
    return mockDecide(input);
  }

  const requestType = MAIN_REQUEST_TYPES.has(
    parsed.requestType as MainRequestType,
  )
    ? (parsed.requestType as MainRequestType)
    : input.requestType;

  const kioskMessage =
    typeof parsed.kioskMessage === "string" && parsed.kioskMessage.trim()
      ? parsed.kioskMessage.trim()
      : "I've recorded your request. Please keep this receipt.";

  const toolCalls = sanitiseToolCalls(parsed.toolCalls);

  return { requestType, kioskMessage, toolCalls };
}
