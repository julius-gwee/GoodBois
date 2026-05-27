// workers/src/ai/decideLlm.ts
//
// LLM call #2 — the main reasoning entry point:
//
//   decide(input, env) → LLMTurnDecision
//
// Owns its own system prompt, mock decisions, and tool-call sanitisation.
// The backend pick and JSON parsing live in ./llmBackend.

import type {
  KioskSessionMessage,
  LLMTurnDecision,
  MainRequestType,
  ToolCall,
} from "../types/contracts";
import { isAllowedTool } from "../tools/registry";
import {
  historyToMessages,
  pickBackend,
  runLlm,
  tryParseJson,
  type LlmEnv,
  type LlmMessage,
} from "./llmBackend";

export type DecideInput = {
  requestType: MainRequestType;
  transcriptEn: string;
  history: KioskSessionMessage[];
  agencyKeys: string[];
  srcLang: string;
  retryHint?: string;
};

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
    "7. DO NOT populate generateReceipt.args.hazardReferenceId — the orchestrator hydrates it from the reportHazard result. DO NOT embed a hazard reference id, placeholder, or the literal '[HAZARD_REFERENCE_ID]' in the body either; the receipt template renders the reference id in its own block automatically.",
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
