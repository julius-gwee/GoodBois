# Orchestrator

The orchestrator runs the six-stage turn flow defined in `docs/refactor/2026-05-09-llm-turn-decision.md`:

1. **STT.** `sttAdapter(audio) → { transcript_en, srcLang }`. Detection is the adapter's job.
2. **Classifier loop.** Call the classifier agent. While `requestType === "ask_followup"`, speak the prompt back in `srcLang` and re-listen.
3. **Main LLM (with retry guard).** Call the main agent with the terminal `requestType` and the full conversation history. Re-prompt if `generateReceipt` is missing from `toolCalls`.
4. **Tool dispatch.** Walk `decision.toolCalls[]` in array order, calling `registry.invokeTool(name, args)`. Hydrate inter-tool data (e.g. `hazardReferenceId`) into later args before calling.
5. **Translate + TTS.** Translate `decision.kioskMessage` from English into `srcLang`, then TTS in `srcLang`.
6. **Respond + reset.** Return `TurnResponse` with `state: "done"` and the receipt URL. Wipe KV state for the session.

The orchestrator has zero business logic. It does **not** branch on `requestType`. It does not own the dispatch table that used to live in the deprecated `processing` agent.

Start with the golden demo fixtures behind mocks; replace each adapter / agent / tool one at a time without changing this stage list.
