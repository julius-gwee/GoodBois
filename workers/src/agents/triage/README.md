# Triage Agent — DEPRECATED, REPLACED BY `agents/main/`

This folder is being retired as part of the 2026-05-09 LLM-turn-decision refactor. See `docs/refactor/2026-05-09-llm-turn-decision.md`.

## What replaces it

The cognition that used to live here is split across two agents:

- **`agents/classifier/`** — owns request-type classification (LLM call #1) and the follow-up loop. Emits `ClassifierDecision`.
- **`agents/main/`** — given a terminal `requestType`, emits the full `LLMTurnDecision` (LLM call #2): `kioskMessage` plus the ordered `toolCalls[]` (with mandatory `generateReceipt`).

The previous allowed-outcomes list is also narrower:

- `signpost`, `report_hazard`, `out_of_scope` — terminal `requestType` values returned by the main LLM.
- `ask_followup` — only ever returned by the classifier; never reaches the main LLM.

`find_nearby`, `simulate_booking`, and `escalate` are gone:

- `find_nearby` is folded into `signpost` (location/wayfinding fields live on `AgencyContact`).
- `simulate_booking` is out of scope.
- `escalate` is no longer a separate outcome — escalation is the combination of `signpost` (MP / CC / town council) plus `generateReceipt` (case summary on the receipt is the handoff).

## Tool selection rules (now applied by the main LLM)

- Pick agencies by `agencyKey`; never generate hotlines, addresses, or opening hours.
- Use `out_of_scope` for emergency / medical / legal / unsupported requests, and pair it with a `signpost` to a curated hotline.
- Always include `generateReceipt` in `toolCalls`. The orchestrator re-prompts the LLM if missing.

Do not add new code under this path. Existing code here is scheduled for deletion as part of the rebuild listed in §10 of the refactor spec.
