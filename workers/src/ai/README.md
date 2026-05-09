# AI Adapters

Worker-side AI clients belong here. All adapters are server-side only — the frontend never calls Workers AI or SEALion directly.

- `sttAdapter` — Workers AI speech-to-text **with language detection**. Returns `{ transcript_en, srcLang }`. If the underlying model only does one job, the adapter layers detection + translation internally.
- `translateAdapter` — SEALion bidirectional translation. Used to translate `kioskMessage` from English into `srcLang` before TTS, and to translate followup prompts.
- `llmAdapter` — Workers AI hosted LLMs. Two entry points:
  - `classify(transcript, history) → ClassifierDecision` (LLM call #1; cheap / fast).
  - `decide(requestType, transcript, history, retryHint?) → LLMTurnDecision` (LLM call #2; tool/function calling required).
- `ttsAdapter` — Workers AI text-to-speech. Voice locale = `srcLang`.

See `docs/refactor/2026-05-09-llm-turn-decision.md` and `docs/standards/data-contracts.md` for the schemas these adapters return.
