# Subagent Definitions

> The four-dev lane split was scrapped on 2026-05-09. These subagent definitions are no longer ownership lanes — they are **topic helpers** that anyone can invoke when the work touches a particular surface area. Anyone can edit any file; coordinate before changing schemas or the orchestrator stage list.

Use these as portable role prompts for Codex subagents, Claude subagents, or human task assignment.

The canonical agent flow lives in `docs/refactor/2026-05-09-llm-turn-decision.md`. All subagents defer to it.

## Shared UI rule (applies to every subagent)

All UI work follows `docs/standards/ui-ux-standards.md` "Component Architecture":

- **shadcn first.** Build on `src/components/ui/*` primitives (add via `npx shadcn@latest add <name>`). Do not hand-roll a button/input/dialog/switch/slider.
- **Atoms for repetition.** Anything used 2+ times with product semantics (listening pulse, agency card, receipt block, things-to-bring checklist) lives in `src/components/atoms/*`. Atoms own no feature state.
- **One component per file.** Split when a file passes ~150 lines, has 3+ distinct sections, or repeats a JSX block. Feature components go under `src/components/<feature>/*`.
- **Memoise with a reason.** `useMemo` for costly derivations, `useCallback` for memoised children/hook deps, `React.memo` for list rows. Hoist constants to module scope. No prophylactic memoisation.

## accessibility-voice-agent

**Mission (topic helper):** voice / AI pipeline + classifier and main LLM agents + orchestrator + kiosk frontend UX.

**Topics covered:**

- Backend (Worker): STT (with language detection), translate, classifier agent (LLM #1), main LLM agent (LLM #2), TTS, orchestrator (six-stage flow), KV reset.
- Frontend (Next.js): kiosk shell, listening / followup / speaking / receipt states, touch fallback, idle reset.
- Multilingual UX: BCP-47 plumbing, receipt copy in user language. No language tile (STT detects).

**Must read:**

- `docs/refactor/2026-05-09-llm-turn-decision.md`
- `AGENTS.md`
- `docs/system-design/tech-stack.md`
- `docs/system-design/architecture.md`
- `docs/system-design/integration-boundaries.md`
- `docs/standards/ui-ux-standards.md`

**Done means:**

- Each demo scenario (routing, hazard, MP escalation) survives end-to-end on the demo laptop.
- Touch fallback works without any voice step.
- Kiosk renders correctly at the demo resolution; idle reset clears KV.
- BCP-47 language tags propagate from STT → orchestrator → translate → TTS → receipt.

## hazard-admin-agent

**Mission (topic helper):** tool registry + agency directory + HTML receipt render. Hazard reporting is part of the MVP demo, but the persistence layer is stubbed (see refactor spec §7).

**Topics covered:**

- Tool registry: `signpost`, `reportHazard` (stub), `generateReceipt`. Single `invokeTool(name, args)` surface. Tools never throw.
- D1 schema for `AgencyContact`, `Receipt`, `KioskSession`, optional `ToolInvocation`.
- Agency directory seed (15–25 entries; polyclinic, hospital, MP, RC, town council, hazard authorities).
- Receipt HTML render at `GET /receipts/:id`.

**Must read:**

- `docs/refactor/2026-05-09-llm-turn-decision.md`
- `AGENTS.md`
- `docs/standards/data-contracts.md`
- `docs/standards/product-principles.md`
- `docs/system-design/integration-boundaries.md`

**Done means:**

- Tool calls return in <500ms on demo hardware (excluding upstream LLM calls).
- Agency directory contains 15–25 entries with English + Mandarin blurbs.
- Receipt renders within 2s and includes user-language + English copy, things-to-bring checklist, and case summary.
- The main LLM cannot signpost an agency that is not in the directory.
- Every terminal turn in the demo produces a receipt URL.

## map-discovery-agent

**Mission (topic helper):** NTH lane — resource discovery, map render, OneMap Barrier-Free wheelchair-friendly routing. Build only after MVP is solid.

**Topics covered:**

- `Resource` schema in D1 (NTH).
- `mapAdapter` interface (react-leaflet + OneMap tiles).
- Map render layered on top of a `signpost` result for routing scenarios — reuse the agency record's lat/long + walking direction fields.
- OneMap Barrier-Free Access API integration.

**Must read:**

- `docs/refactor/2026-05-09-llm-turn-decision.md`
- `AGENTS.md`
- `docs/system-design/architecture.md`
- `docs/standards/data-contracts.md`
- `docs/system-design/integration-boundaries.md`

**Done means:**

- Map renders inside the kiosk response card without breaking the listening flow.
- Wheelchair-friendly polyline visible on the map for at least one demo route.
- Coordinates are plain WGS84 latitude/longitude in shared types.
- Voice pipeline still works if the map renderer is stripped out.

## safety-demo-agent

**Mission (topic helper):** end-to-end demo orchestration + scripted-fallback safety net + pre-warm checklist. Route safety / Grab handoff is NTH low priority.

**Topics covered:**

- End-to-end demo script for the three scenarios (routing, hazard, MP escalation).
- Scripted-fallback path (feature-flagged) for stage failures.
- Pre-warm checklist for the pitch.
- Demo seed data: at least one canned `LLMTurnDecision` per scenario.

**Must read:**

- `docs/refactor/2026-05-09-llm-turn-decision.md`
- `AGENTS.md`
- `docs/system-design/architecture.md`
- `docs/hackathon/mvp-execution-plan.md`

**Done means:**

- One person can run the demo end-to-end without developer explanation.
- Scripted-fallback path is rehearsed and reachable in <5 seconds.
- Pre-warm checklist is documented and tested.
- Demo seed data covers all three scenarios at least once.
