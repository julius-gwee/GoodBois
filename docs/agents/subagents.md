# Subagent Definitions

Three-lane dev breakdown — these subagents are **lane owners** by default, but anyone can edit any file with PR coordination. Full detail in `docs/refactor/2026-05-09-llm-turn-decision.md` §13.

Use these as portable role prompts for Codex subagents, Claude subagents, or human task assignment.

## Shared UI rule (applies to every subagent)

All UI work follows `docs/standards/ui-ux-standards.md` "Component Architecture":

- **shadcn first.** Build on `src/components/ui/*` primitives (add via `npx shadcn@latest add <name>`). Do not hand-roll a button/input/dialog/switch/slider.
- **Atoms for repetition.** Anything used 2+ times with product semantics (listening pulse, agency card, receipt block, things-to-bring checklist) lives in `src/components/atoms/*`. Atoms own no feature state.
- **One component per file.** Split when a file passes ~150 lines, has 3+ distinct sections, or repeats a JSX block. Feature components go under `src/components/<feature>/*`.
- **Memoise with a reason.** `useMemo` for costly derivations, `useCallback` for memoised children/hook deps, `React.memo` for list rows. Hoist constants to module scope. No prophylactic memoisation.

## accessibility-voice-agent — Dev A (Orchestration & pipeline)

**Mission:** Build the orchestrator and the agent pipeline. Does **not** touch tool implementations.

**Owns:**

- Backend (Worker): orchestrator (six-stage flow + retry guard + KV reset), classifier agent (LLM #1, owns followup loop), main LLM agent (LLM #2, emits `LLMTurnDecision`), STT adapter (with language detection), translate adapter, TTS adapter, llmAdapter.
- `POST /turn` route handler.
- Frontend (Next.js): kiosk shell, listening / followup / speaking / receipt states. No language picker — STT detects.
- Touch / text fallback path.

**Calls tools** through `registry.invokeTool(name, args)` only. Does not import specific tool files.

**Must read:**

- `docs/refactor/2026-05-09-llm-turn-decision.md`
- `AGENTS.md`
- `docs/system-design/tech-stack.md`
- `docs/system-design/architecture.md`
- `docs/system-design/integration-boundaries.md`
- `docs/standards/ui-ux-standards.md`

**Do not touch without coordination:**

- `workers/src/tools/*` — owned by Dev B / Dev C (the registry is shared).
- The agency directory seed — owned by Dev C.

**Done means:**

- All three demo scenarios survive end-to-end on the demo laptop.
- Touch fallback works without any voice step.
- Kiosk renders correctly at the demo resolution; idle reset clears KV.
- BCP-47 language tags propagate from STT → orchestrator → translate → TTS → receipt.

## hazard-admin-agent — Dev B (Receipt + Hazard tools + integrations)

**Mission:** Build the `generateReceipt` and `reportHazard` tools and their external-delivery integrations (printer, email).

**Owns:**

- `workers/src/tools/generateReceipt.ts` — accepts `GenerateReceiptArgs`, persists a `Receipt` row, returns the `/receipts/:id` URL. Mandatory in every terminal turn.
- `workers/src/tools/reportHazard.ts` — accepts `{ category, location, description }`, returns `{ referenceId, routedTo }`. Routes to the right authority (LTA / HDB / MOM / town council) by category.
- `workers/src/receipt/render.ts` and `GET /receipts/:id` — bilingual HTML render with body, things-to-bring checklist, hydrated agency block, hazard reference.
- **External integration adapters:**
  - **Printer adapter** — POS / thermal / HTML-to-print. Demo may stub the device call; the seam must exist.
  - **Email adapter** — Cloudflare Email Routing or equivalent for receipt-to-resident and hazard-report-to-authority. Demo may stub the send; the seam must exist.
- `Receipt` and `HazardReport` schema entries in D1.
- Hazard category → authority mapping table.

**Must read:**

- `docs/refactor/2026-05-09-llm-turn-decision.md`
- `AGENTS.md`
- `docs/standards/data-contracts.md`
- `docs/standards/product-principles.md`
- `docs/system-design/integration-boundaries.md`

**Do not touch without coordination:**

- Orchestrator, classifier, main LLM agent — owned by Dev A.
- `signpost` and the agency directory — owned by Dev C.

**Done means:**

- Tool calls return in <500ms on demo hardware (excluding upstream LLM calls).
- Receipt renders within 2s and includes English + srcLang copy, things-to-bring checklist, and case summary.
- Printer + email adapters expose a typed seam that the tools call; demo stubs are clearly logged.
- Hazard category routing is deterministic and seeded.
- The main LLM cannot signpost an agency that is not in the directory (registry rejects).

## map-discovery-agent — Dev C (Routing tool + agency directory)

**Mission:** Build the `signpost` tool and own the agency directory + `AgencyContact` schema. NTH (Phase 5): map render.

**Owns:**

- `workers/src/tools/signpost.ts` — accepts `{ agencyKey }`, returns `{ agency: AgencyContact }`. Rejects unknown / inactive keys with `AGENCY_NOT_ALLOWED`.
- `workers/src/db/seeds/agencies.ts` and the D1 directory — 15–25 entries across polyclinic, hospital, MP, RC, town council, hazard authorities.
- `AgencyContact` schema in `workers/src/types/contracts.ts` (cross-lane edits via PR coordination).
- Wayfinding fields on the agency record (lat/long + walking direction hints) — folded in from the retired `findNearby`.
- (NTH) Map render layered on top of `signpost` results — reuse the agency record's lat/long. OneMap tiles + Barrier-Free routing behind `mapAdapter`.

**Must read:**

- `docs/refactor/2026-05-09-llm-turn-decision.md`
- `AGENTS.md`
- `docs/system-design/architecture.md`
- `docs/standards/data-contracts.md`
- `docs/system-design/integration-boundaries.md`

**Do not touch without coordination:**

- Orchestrator, agents, AI adapters — owned by Dev A.
- Receipt rendering, hazard tool, external delivery adapters — owned by Dev B (the receipt does hydrate from the agency directory at render time, but Dev C owns the directory shape).

**Done means:**

- Agency directory contains 15–25 entries with English + Mandarin blurbs.
- `signpost` returns a complete `AgencyContact` with wayfinding fields populated for routing scenarios.
- Demo scenarios 1 (routing) and 3 (MP escalation) both signpost successfully.
- (NTH, Phase 5) Map renders for at least one demo route without breaking the listening flow.
- (NTH) Wheelchair-friendly polyline visible on the map for at least one demo route.

## safety-demo-agent — topic helper (no fixed lane)

**Mission:** End-to-end demo orchestration + scripted-fallback safety net + pre-warm checklist. **Not a fixed lane** — picked up by whichever dev is blocked or near demo time.

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
