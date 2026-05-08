# Subagent Definitions

Use these as portable role prompts for Codex subagents, Claude subagents, or human task assignment.

Filenames are preserved from the prior product (Care Access Map); missions are rewritten for the **GoodBois kiosk** pivot.

## Shared UI rule (applies to every subagent)

All UI work follows `docs/standards/ui-ux-standards.md` "Component Architecture":

- **shadcn first.** Build on `src/components/ui/*` primitives (add via `npx shadcn@latest add <name>`). Do not hand-roll a button/input/dialog/switch/slider.
- **Atoms for repetition.** Anything used 2+ times with product semantics (language tile, listening pulse, agency card, receipt block, confidence chip) lives in `src/components/atoms/*`. Atoms own no feature state.
- **One component per file.** Split when a file passes ~150 lines, has 3+ distinct sections, or repeats a JSX block. Feature components go under `src/components/<feature>/*`.
- **Memoise with a reason.** `useMemo` for costly derivations, `useCallback` for memoised children/hook deps, `React.memo` for list rows. Hoist constants to module scope. No prophylactic memoisation.

## accessibility-voice-agent

**Mission:** Own the voice / AI pipeline AND the kiosk frontend UX. The user-facing layer.

**Owns:**

- Backend (Worker): STT / TTS / translate / triage LLM clients; orchestrator; multi-turn KV session.
- Frontend (Next.js): kiosk shell, language picker, listening state, transcript panel, response card, consent banner, idle reset.
- Multilingual UX: language tile typography, BCP-47 tag plumbing, receipt copy in user language.
- Voice-agent research subtask: Cloudflare/SEALion language matrix; final STT / TTS / LLM model picks.
- Touch / text fallback path.

**Must read:**

- `AGENTS.md`
- `docs/system-design/tech-stack.md`
- `docs/system-design/architecture.md`
- `docs/system-design/integration-boundaries.md`
- `docs/standards/ui-ux-standards.md`

**Do not touch without coordination:**

- Tool implementations (`signpost`, `simulateBooking`, etc.) — owned by `hazard-admin-agent`.
- MP/RC export adapter — owned by `hazard-admin-agent`.
- Map / wheelchair routing internals — owned by `map-discovery-agent`.
- Demo scripted-fallback path — owned by `safety-demo-agent`.

**Completion checklist:**

- Voice pipeline survives a 3-turn dialogue end-to-end on the demo laptop.
- Touch fallback works without any voice step.
- Kiosk renders correctly at the demo resolution; idle reset clears KV.
- Consent banner is shown before listening.
- BCP-47 language tags propagate from frontend → Worker → D1 → receipt PDF.

## hazard-admin-agent

**Mission:** Own the Worker tool surface, agency directory, receipt PDF, and MP/RC case export. The "what does the kiosk actually do once it understands you" lane.

**Owns:**

- Worker tools: `signpost`, `findNearby` (stub for MVP; real impl in NTH lane), `simulateBooking`, `generateReceipt`, `escalateToMpRc`.
- D1 schema for `AgencyContact`, `Case`, `Receipt`, `BookingConfirmation`, `KioskSession`, `Utterance`, `TriageResult`, `ToolInvocation`.
- Agency directory seed data (15–25 entries, multilingual blurbs).
- Receipt PDF generation (Worker + R2 + signed URLs).
- MP/RC export adapter (CSV default; webhook / email alternates).
- Hazard reporting (NTH, low priority).

**Must read:**

- `AGENTS.md`
- `docs/standards/data-contracts.md`
- `docs/standards/product-principles.md`
- `docs/system-design/integration-boundaries.md`

**Do not touch without coordination:**

- Frontend kiosk shell — owned by `accessibility-voice-agent`.
- Voice pipeline internals — owned by `accessibility-voice-agent`.
- Map render — owned by `map-discovery-agent`.

**Completion checklist:**

- Tool calls return in <500ms on demo hardware (excluding AI calls).
- `AgencyContact` directory contains 15–25 entries; every entry has English + Mandarin blurb.
- Receipt PDF renders within 2s and includes user-language + English copy.
- MP/RC export CSV is downloadable as a signed URL; columns per `data-contracts.md`.
- The triage LLM cannot signpost an agency that's not in the directory (allowlist enforced).

## map-discovery-agent

**Mission:** NTH lane — resource discovery, map render, wheelchair-friendly routing. Build only after MVP is solid.

**Owns:**

- `Resource` schema in D1 (NTH).
- `mapAdapter` interface (react-leaflet + OneMap tiles).
- `findNearby` real implementation (replaces the MVP stub).
- OneMap Barrier-Free Access API integration.
- Map render in the kiosk response card.

**Must read:**

- `AGENTS.md`
- `docs/system-design/architecture.md`
- `docs/standards/data-contracts.md`
- `docs/system-design/integration-boundaries.md`

**Do not touch without coordination:**

- Kiosk shell — owned by `accessibility-voice-agent`.
- Worker tool registry — owned by `hazard-admin-agent`.
- Demo orchestration — owned by `safety-demo-agent`.

**Completion checklist:**

- Map renders inside the kiosk response card without breaking the listening flow.
- Wheelchair-friendly polyline visible on the map for at least one demo route.
- Coordinates are plain WGS84 latitude/longitude in shared types.
- Map provider references are optional metadata, not load-bearing.
- Voice pipeline still works if the map renderer is stripped out.

## safety-demo-agent

**Mission:** End-to-end demo orchestration. Scripted fallback safety net. Route safety NTH.

**Owns:**

- End-to-end demo script (the Mandarin lift + dialysis scenario).
- Scripted-fallback path (feature-flagged) for stage failures.
- Pre-warm checklist for the pitch.
- Demo seed data: at least one canned case per triage outcome.
- Route safety / Grab handoff (NTH, low priority).

**Must read:**

- `AGENTS.md`
- `docs/system-design/architecture.md`
- `docs/hackathon/mvp-execution-plan.md`

**Do not touch without coordination:**

- Voice pipeline internals — owned by `accessibility-voice-agent`.
- Tool implementations — owned by `hazard-admin-agent`.
- Map render — owned by `map-discovery-agent`.

**Completion checklist:**

- One person can run the demo end-to-end without developer explanation.
- Scripted-fallback path is rehearsed and reachable in <5 seconds.
- Pre-warm checklist is documented and tested.
- Demo seed data covers every triage outcome at least once.
- If route safety / Grab is built, it does not block the MVP demo path.
