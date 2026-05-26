// workers/src/ai/llmAdapter.ts
//
// LLM adapter barrel exposing the two named entry points the spec requires:
//
//   classify(input, env) → ClassifierDecision   (see ./classifyLlm)
//   decide(input, env)   → LLMTurnDecision       (see ./decideLlm)
//
// Each entry point owns its own system prompt and validation. Both share the
// backend pick (SEALion / Workers AI / mock) and JSON parsing in ./llmBackend.
// This file keeps the historical `../ai/llmAdapter` import path stable.

export { type LlmEnv } from "./llmBackend";
export { classify, type ClassifyInput } from "./classifyLlm";
export { decide, type DecideInput } from "./decideLlm";
