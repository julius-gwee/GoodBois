# Orchestrator

The orchestrator owns the end-to-end turn flow:

1. STT if audio is provided.
2. Translate user language to English.
3. Route to the inquiry agent if the request needs a bounded follow-up.
4. Route to the triage agent for outcome and tool selection.
5. Route to the processing agent to invoke allowlisted tools.
6. Translate response back to user language.
7. TTS.
8. Return the `TurnResponse` contract.

Start with the golden demo fixtures, then replace each step behind the same contract.
