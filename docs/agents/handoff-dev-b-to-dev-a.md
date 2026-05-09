# SUPERSEDED — Handoff (Dev B → Dev A)

> **This document is superseded by `docs/refactor/2026-05-09-llm-turn-decision.md`** (landed 2026-05-09).
>
> The four-dev lane split (Dev A / Dev B / Dev C / Dev D) was scrapped on the same date. There is no longer a Dev-B-to-Dev-A handoff because the orchestrator and tool layer are no longer split across separate owners. Anyone can touch any file; coordinate before changing schemas.
>
> The agent flow has also changed: the previous `runProcessing(triage) → ProcessingOutput` dispatch model is replaced by:
>
> 1. STT returns `{ transcript_en, srcLang }`.
> 2. Classifier LLM owns the followup loop and emits `ClassifierDecision`.
> 3. Main LLM emits `LLMTurnDecision { requestType, kioskMessage, toolCalls[] }` with mandatory `generateReceipt`.
> 4. Orchestrator walks `toolCalls[]` through `registry.invokeTool(name, args)`. No dispatch table.
>
> The tool allowlist is now three: `signpost`, `reportHazard` (demo stub), `generateReceipt`. `findNearby`, `simulateBooking`, and `escalateToMpRc` are removed.
>
> Receipt is HTML, served by the Worker — same as before. R2 is not used in the MVP path.
>
> Read `docs/refactor/2026-05-09-llm-turn-decision.md` instead of this file. The historical content below is preserved as context only.

---

# Handoff — Dev B (Tools & Cases) → Dev A (Voice + Orchestrator)  *(historical)*

**Date:** 2026-05-09
**Branch in flight:** `jacksonB/tools-and-cases`
**Companion spec:** `docs/superpowers/specs/2026-05-09-dev-b-tools-cases-design.md` *(also superseded)*

This document was the contract between Dev B's branch and Dev A's orchestrator work. It is no longer authoritative; see the superseding refactor spec above.
