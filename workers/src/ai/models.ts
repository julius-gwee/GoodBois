// workers/src/ai/models.ts
//
// Cloudflare Workers AI model identifiers used by the kiosk adapters, kept in
// one place so the hosted models in play are auditable and swappable without
// grepping the adapters. (SEALion's model + endpoint live in ./sealion, which
// owns the SEALion-specific client.)

export const WHISPER_STT_MODEL = "@cf/openai/whisper";
export const MELOTTS_MODEL = "@cf/myshell-ai/melotts";
export const WORKERS_AI_LLM_MODEL = "@cf/meta/llama-3.1-8b-instruct";
