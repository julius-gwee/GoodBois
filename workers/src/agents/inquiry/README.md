# Inquiry Agent — DEPRECATED

This folder is being retired as part of the 2026-05-09 LLM-turn-decision refactor. See `docs/refactor/2026-05-09-llm-turn-decision.md`.

The bounded follow-up loop now lives in the **classifier agent** (`workers/src/agents/classifier/`). When the classifier returns `requestType: "ask_followup"` with a `followupPrompt`, the orchestrator speaks the prompt back in `srcLang` and re-classifies the next utterance.

Do not add new code under this path. Existing code here is scheduled for deletion as part of the rebuild listed in §10 of the refactor spec.
