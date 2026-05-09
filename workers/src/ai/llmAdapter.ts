// workers/src/ai/llmAdapter.ts
//
// LLM adapter for triage. Mock-mode returns canned triage JSON based on
// keyword heuristics. Real-mode calls Workers AI Llama-3 with JSON output.

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

function isMockMode(env: LlmEnv): boolean {
  if (env.LLM_MOCK === "true") return true;
  if (!env.AI) return true;
  return false;
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
  // Llama-3 sometimes wraps JSON in markdown fences. Strip them before parsing.
  const trimmed = raw.trim();
  // Match ```json ... ``` or ``` ... ```
  const fenceMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fenceMatch) return fenceMatch[1].trim();
  // Match a leading "Here is the JSON:" preamble + JSON object
  const objectMatch = trimmed.match(/\{[\s\S]*\}/);
  if (objectMatch) return objectMatch[0];
  return trimmed;
}

export async function llmAdapter<T = unknown>(
  input: LlmInput,
  env: LlmEnv
): Promise<LlmResult<T>> {
  if (isMockMode(env)) {
    const triage = pickCannedTriage(input.messages);
    const raw = JSON.stringify(triage);
    return { raw, parsed: triage as unknown as T };
  }

  const result = await env.AI!.run("@cf/meta/llama-3.1-8b-instruct", {
    messages: input.messages,
    max_tokens: input.maxTokens ?? 512,
    response_format: input.jsonSchema
      ? { type: "json_schema", json_schema: input.jsonSchema }
      : undefined,
  });

  const raw =
    result.response ?? result.result?.response ?? "";

  let parsed: T | undefined;
  try {
    parsed = JSON.parse(stripCodeFences(raw)) as T;
  } catch {
    parsed = undefined;
  }

  return { raw, parsed };
}
