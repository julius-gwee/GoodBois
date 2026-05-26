// workers/src/ai/sealion.ts
//
// Shared SEALion (OpenAI-compatible) chat-completions client. Centralises the
// endpoint URL, model name, Bearer auth, and response shape that the LLM,
// translate, and language-id adapters all use. Callers own retry + error
// handling because those differ per adapter (the LLM retries once on 429/5xx;
// the translate calls fail fast or fall back to a heuristic).

export const SEALION_DEFAULT_BASE_URL = "https://api.sea-lion.ai/v1";
export const SEALION_MODEL = "aisingapore/Gemma-SEA-LION-v4-27B-IT";

export type SealionEnv = {
  SEALION_API_KEY?: string;
  SEALION_BASE_URL?: string; // override for staging if needed
};

export type SealionMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type SealionChatOptions = {
  messages: SealionMessage[];
  temperature?: number;
  maxTokens?: number;
};

// POST to SEALion's /chat/completions endpoint with the shared model + auth.
// Returns the raw Response so callers decide how to handle non-ok statuses.
export function sealionChatCompletion(
  env: SealionEnv,
  { messages, temperature, maxTokens }: SealionChatOptions,
): Promise<Response> {
  const baseUrl = env.SEALION_BASE_URL ?? SEALION_DEFAULT_BASE_URL;
  return fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${env.SEALION_API_KEY}`,
    },
    body: JSON.stringify({
      model: SEALION_MODEL,
      messages,
      ...(temperature !== undefined ? { temperature } : {}),
      ...(maxTokens !== undefined ? { max_tokens: maxTokens } : {}),
    }),
  });
}

// SEALion (OpenAI-compatible) nests the reply under choices[0].message.content.
// Returns undefined when absent so callers can apply their own fallback.
export function extractChatContent(json: unknown): string | undefined {
  const parsed = json as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return parsed.choices?.[0]?.message?.content;
}
