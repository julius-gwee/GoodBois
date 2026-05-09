# Runtime Agents

Two LLM-backed agents power the Worker. Both are described in detail in `docs/refactor/2026-05-09-llm-turn-decision.md` — read that first.

```text
classifier/   LLM call #1 — emits ClassifierDecision; owns the followup loop
main/         LLM call #2 — emits the full LLMTurnDecision (kioskMessage + toolCalls[])
```

The orchestrator runs them in sequence:

```text
POST /turn
  -> orchestrator
  -> STT (audio → { transcript_en, srcLang })
  -> classifier agent     ── loops on ask_followup
  -> main agent           (retry guard: must include generateReceipt)
  -> tool registry dispatch
  -> translate kioskMessage → srcLang
  -> TTS
  -> TurnResponse
  -> KV reset
```

Both agents must preserve the schemas in `workers/src/types/contracts.ts`:

- Classifier returns `ClassifierDecision`.
- Main returns `LLMTurnDecision`.

There is no longer a separate inquiry or processing agent. The followup loop lives in the classifier; tool dispatch lives in the orchestrator. The `inquiry/`, `triage/`, and `processing/` folders are **deprecated** — see their READMEs for migration notes.
