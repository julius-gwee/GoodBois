# Runtime Agents

GoodBois keeps the MVP narrow, but the Worker mental model follows the whiteboard's agent split:

1. `inquiry` asks bounded follow-up questions when the request is underspecified.
2. `triage` classifies the request and picks an outcome.
3. `processing` runs allowed workflows through the tool registry.

These are orchestration roles, not permission to build a broad "ask anything" government kiosk. The only MVP workflows are the allowlisted GoodBois tools in `workers/src/tools/`.

The runtime flow is:

```text
POST /turn
  -> orchestrator
  -> inquiry agent when details are missing
  -> triage agent for outcome/tool choice
  -> processing agent for signpost/escalate/receipt/booking stub
  -> TurnResponse
```

All agents must preserve the `TurnRequest` and `TurnResponse` contract in `workers/src/types/contracts.ts`.
