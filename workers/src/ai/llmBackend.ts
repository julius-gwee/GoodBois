// workers/src/ai/llmBackend.ts
//
// Shared LLM backend used by both entry points (classify / decide). Owns the
// backend pick (SEALion / Workers AI / mock) and the JSON-parsing helpers.
// Backends in priority order:
//   1. SEALion (Gemma SEA-LION v4 27B IT) when SEALION_API_KEY is set
//      — preferred for SEA-language fluency.
//   2. Cloudflare Workers AI Llama-3 when env.AI is bound.
//   3. Mock keyword heuristics — offline dev / tests / CI.

import type { KioskSessionMessage } from "../types/contracts";
import { extractChatContent, sealionChatCompletion } from "./sealion";

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

export type LlmMessage = { role: "system" | "user" | "assistant"; content: string };
export type Backend = "mock" | "sealion" | "workers-ai";

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

const WORKERS_AI_MODEL = "@cf/meta/llama-3.1-8b-instruct";

export function pickBackend(env: LlmEnv): Backend {
  if (env.LLM_MOCK === "true") return "mock";
  if (env.SEALION_API_KEY) return "sealion";
  if (env.AI) return "workers-ai";
  return "mock";
}

export function historyToMessages(history: KioskSessionMessage[]): LlmMessage[] {
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

export function tryParseJson<T>(raw: string): T | undefined {
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
  const opts = { messages, maxTokens: 1024, temperature: 0 };

  // One retry with a short backoff on 429 / 5xx. SEALion's free tier throttles
  // aggressively; a single retry rescues the demo from transient blips
  // without hiding a sustained outage.
  let response = await sealionChatCompletion(env, opts);
  if (response.status === 429 || response.status >= 500) {
    const retryAfter = Number(response.headers.get("retry-after")) || 3;
    await new Promise((resolve) =>
      setTimeout(resolve, Math.min(retryAfter, 5) * 1000),
    );
    response = await sealionChatCompletion(env, opts);
  }

  if (!response.ok) {
    throw new Error(`SEALion LLM failed: ${response.status}`);
  }

  return extractChatContent(await response.json()) ?? "";
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

export async function runLlm(
  messages: LlmMessage[],
  env: LlmEnv,
): Promise<string> {
  const backend = pickBackend(env);
  if (backend === "sealion") return callSealion(messages, env);
  if (backend === "workers-ai") return callWorkersAi(messages, env);
  throw new Error("runLlm called in mock backend — guard upstream");
}
