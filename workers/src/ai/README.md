# AI Adapters

Worker-side AI clients belong here. All adapters are server-side only — the frontend never calls Workers AI or SEALion directly.

- `sttAdapter` — Workers AI speech-to-text **with language detection**. Returns `{ transcript_en, srcLang }`. If the underlying model only does one job, the adapter layers detection + translation internally.
- `translateAdapter` — SEALion bidirectional translation. Used to translate `kioskMessage` from English into `srcLang` before TTS, and to translate followup prompts. Also exports `identifyLanguage` (SEALion-backed language id with a Unicode/keyword heuristic fallback).
- `llmAdapter` — barrel keeping the stable `../ai/llmAdapter` import path. Exposes the two hosted-LLM entry points:
  - `classify(transcript, history) → ClassifierDecision` (LLM call #1; cheap / fast) — implemented in `classifyLlm.ts`.
  - `decide(requestType, transcript, history, retryHint?) → LLMTurnDecision` (LLM call #2; tool/function calling required) — implemented in `decideLlm.ts`.
  - Both share backend selection (SEALion / Workers AI / mock) and JSON parsing in `llmBackend.ts`.
- `ttsAdapter` — Workers AI text-to-speech. Voice locale = `srcLang`.

Shared helpers:

- `sealion.ts` — SEALion (OpenAI-compatible) chat-completions client: endpoint URL, model, Bearer auth, and response parsing. Used by `llmBackend` and `translateAdapter`. Callers own retry/error handling.
- `mockMode.ts` — `isMockMode(flag, backendAvailable)`: an adapter runs in mock mode when its `*_MOCK` flag is `"true"` or the backend binding it needs is absent.
- `models.ts` — Cloudflare Workers AI model identifiers (`WHISPER_STT_MODEL`, `MELOTTS_MODEL`, `WORKERS_AI_LLM_MODEL`). SEALion's model + endpoint live in `sealion.ts`.

See `docs/refactor/2026-05-09-llm-turn-decision.md` and `docs/standards/data-contracts.md` for the schemas these adapters return.
