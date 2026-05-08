# Orchestrator

The orchestrator owns the end-to-end turn flow:

1. STT if audio is provided.
2. Translate user language to English.
3. Triage with allowlisted tool selection.
4. Invoke tools.
5. Translate response back to user language.
6. TTS.
7. Return the `TurnResponse` contract.

Start with the golden demo fixtures, then replace each step behind the same contract.
