# Processing Agent — DEPRECATED

This folder is being retired as part of the 2026-05-09 LLM-turn-decision refactor. See `docs/refactor/2026-05-09-llm-turn-decision.md`.

The dispatch table that used to live here (mapping `triage.outcome` → tool calls) is gone. The main LLM now emits `toolCalls[]` directly, and the **orchestrator** walks the array via `registry.invokeTool(name, args)`. There is no separate processing agent.

If you need to call a tool, do it through `workers/src/tools/registry.ts`. Cross-tool data flow (e.g. wiring `hazardReferenceId` from a `reportHazard` result into a later `generateReceipt` call) happens in the orchestrator's hydration step before each `invokeTool` call.

Do not add new code under this path. Existing code here is scheduled for deletion as part of the rebuild listed in §10 of the refactor spec.
