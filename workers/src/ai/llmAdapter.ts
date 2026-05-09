// workers/src/ai/llmAdapter.ts
//
// LLM adapter for triage. Three backends in priority order:
//   1. SEALion (Gemma SEA-LION v4 27B IT) when SEALION_API_KEY is set — preferred
//      because it's natively SEA-language fluent and uses an OpenAI-compatible
//      JSON-mode chat-completion endpoint.
//   2. Cloudflare Workers AI Llama-3 when env.AI binding is bound.
//   3. Mock-mode keyword heuristics when nothing else is available, or when
//      LLM_MOCK is explicitly "true".

export type LlmMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type LlmInput = {
  messages: LlmMessage[];
  jsonSchema?: object;
  maxTokens?: number;
};

export type LlmResult<T = unknown> = {
  raw: string;
  parsed?: T;
};

export type LlmEnv = {
  AI?: {
    run: (
      model: string,
      input: unknown
    ) => Promise<{ response?: string; result?: { response?: string } }>;
  };
  LLM_MOCK?: string;
  SEALION_API_KEY?: string;
  SEALION_BASE_URL?: string;
};

type CannedTriage = {
  outcome: "ask_followup" | "signpost" | "escalate" | "out_of_scope";
  confidence: "high" | "medium" | "low";
  selectedToolName?: string;
  selectedAgencyKey?: string;
  followupQuestion?: string;
};

const MOCK_RESPONSES: Array<{ keywords: string[]; response: CannedTriage }> = [
  {
    keywords: ["lift", "电梯"],
    response: {
      outcome: "ask_followup",
      confidence: "high",
      followupQuestion: "Which block and floor do you live at?",
    },
  },
  {
    keywords: ["block", "level", "座", "楼"],
    response: {
      outcome: "signpost",
      confidence: "high",
      selectedToolName: "signpost",
      selectedAgencyKey: "hdb_essential_maintenance",
    },
  },
  {
    keywords: ["accept", "yes", "ok", "好"],
    response: {
      outcome: "escalate",
      confidence: "high",
      selectedToolName: "escalateToMpRc",
    },
  },
  {
    keywords: ["emergency", "995", "ambulance"],
    response: {
      outcome: "out_of_scope",
      confidence: "high",
      selectedToolName: "signpost",
      selectedAgencyKey: "scdf_emergency",
    },
  },
];

const SEALION_DEFAULT_BASE_URL = "https://api.sea-lion.ai/v1";
const SEALION_MODEL = "aisingapore/Gemma-SEA-LION-v4-27B-IT";

type Backend = "mock" | "sealion" | "workers-ai";

function pickBackend(env: LlmEnv): Backend {
  if (env.LLM_MOCK === "true") return "mock";
  if (env.SEALION_API_KEY) return "sealion";
  if (env.AI) return "workers-ai";
  return "mock";
}

function pickCannedTriage(messages: LlmMessage[]): CannedTriage {
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const text = (lastUser?.content ?? "").toLowerCase();
  for (const candidate of MOCK_RESPONSES) {
    if (candidate.keywords.some((k) => text.includes(k.toLowerCase()))) {
      return candidate.response;
    }
  }
  // Default: out-of-scope curated hotline
  return {
    outcome: "out_of_scope",
    confidence: "low",
    selectedToolName: "signpost",
    selectedAgencyKey: "aic_hotline",
  };
}

function stripCodeFences(raw: string): string {
  // LLMs sometimes wrap JSON in markdown fences. Strip them before parsing.
  const trimmed = raw.trim();
  const fenceMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fenceMatch) return fenceMatch[1].trim();
  const objectMatch = trimmed.match(/\{[\s\S]*\}/);
  if (objectMatch) return objectMatch[0];
  return trimmed;
}

async function callSealion<T>(
  input: LlmInput,
  env: LlmEnv
): Promise<LlmResult<T>> {
  const baseUrl = env.SEALION_BASE_URL ?? SEALION_DEFAULT_BASE_URL;
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${env.SEALION_API_KEY}`,
    },
    body: JSON.stringify({
      model: SEALION_MODEL,
      messages: input.messages,
      max_tokens: input.maxTokens ?? 512,
      temperature: 0,
    }),
  });

  if (!response.ok) {
    throw new Error(`SEALion LLM failed: ${response.status}`);
  }

  const json = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const raw = json.choices?.[0]?.message?.content ?? "";

  let parsed: T | undefined;
  try {
    parsed = JSON.parse(stripCodeFences(raw)) as T;
  } catch {
    parsed = undefined;
  }

  return { raw, parsed };
}

async function callWorkersAi<T>(
  input: LlmInput,
  env: LlmEnv
): Promise<LlmResult<T>> {
  const result = await env.AI!.run("@cf/meta/llama-3.1-8b-instruct", {
    messages: input.messages,
    max_tokens: input.maxTokens ?? 512,
    response_format: input.jsonSchema
      ? { type: "json_schema", json_schema: input.jsonSchema }
      : undefined,
  });

  const raw = result.response ?? result.result?.response ?? "";

  let parsed: T | undefined;
  try {
    parsed = JSON.parse(stripCodeFences(raw)) as T;
  } catch {
    parsed = undefined;
  }

  return { raw, parsed };
}

export async function llmAdapter<T = unknown>(
  input: LlmInput,
  env: LlmEnv
): Promise<LlmResult<T>> {
  const backend = pickBackend(env);

  if (backend === "mock") {
    const triage = pickCannedTriage(input.messages);
    const raw = JSON.stringify(triage);
    return { raw, parsed: triage as unknown as T };
  }

  if (backend === "sealion") {
    return callSealion<T>(input, env);
  }

  // workers-ai
  return callWorkersAi<T>(input, env);
}
