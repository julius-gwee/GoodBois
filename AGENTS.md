# GoodBois Agent Guide

This file is the shared operating manual for Codex, Claude Code, and human developers working on the **GoodBois** elderly voice kiosk. (The product previously described as "Care Access Map" — the pivot to the kiosk landed on 2026-05-09. The agent flow was rebuilt on the same date; see `docs/refactor/2026-05-09-llm-turn-decision.md`.)

## Project Context

GoodBois is a voice-first kiosk installed at HDB void decks for less tech-savvy elderly residents who live alone or with limited family support, speak Mandarin / Hokkien / other SEA languages, and currently rely on weekly MP Meet-the-People sessions or RC visits to navigate basic government and social services.

The kiosk **triages** their colloquially worded request, **signposts** them to the right agency / hotline / local resource, **files hazard reports** on their behalf, and **prints a receipt** with the structured who/what/when/where/why/how so they can hand it to a volunteer or counter staff without having to retell the story.

Unlike the AIC hotline or LifeSG app, the kiosk meets them where they already are, speaks dialect, runs 24/7, and gives them an artifact to leave with.

**Demo:** runs on laptops, kiosk-style UI. No real printer (HTML receipt shown full-screen). Hazard reporting is stubbed for the demo (no real downstream filing).

## Read first

1. `docs/refactor/2026-05-09-llm-turn-decision.md` — **canonical SSOT for the agent flow.** All other docs defer to it.
2. `docs/START_HERE_FOR_NEW_AGENTS.md`
3. `docs/standards/product-principles.md`
4. `docs/system-design/tech-stack.md`
5. `docs/system-design/architecture.md`
6. `docs/strategy/judging-criteria-alignment.md` — the rubric we're optimising for
7. `docs/standards/data-contracts.md`

## Judging Criteria

This is a hackathon project. The team is optimising for the published rubric:

| Criterion | Weight |
|---|---|
| Problem-Solution Fit | 35% |
| Scalability Across Cultures & Borders | 15% |
| Long-term Sustainability | 15% |
| Go-to-Market Strategy | 15% |
| Innovation & Creativity | 10% |
| Presentation & Storytelling | 10% |

When in doubt about scope or polish, prioritise the highest-weight criterion the change affects. Strategy docs that back specific criteria live in `docs/strategy/`:

- `docs/strategy/go-to-market.md` (GTM)
- `docs/strategy/sustainability.md` (sustainability)
- `docs/strategy/regional-scaling.md` (cross-border scalability)
- `docs/strategy/judging-criteria-alignment.md` (cheat sheet for the demo + pitch)

## Non-Negotiables

- Keep the MVP demoable. Prefer a working vertical slice over broad unfinished coverage.
- Frontend never calls Workers AI or SEALion directly. All AI calls go through the orchestrator Worker.
- Cloudflare D1 is the only database. No Supabase. No external Postgres.
- The main LLM picks from an allowlisted three-tool surface; it cannot fabricate hotlines or agencies.
- Kiosk is anonymous by default. No NRIC. Identity capture (block/unit/alias) is optional and only when a tool needs it.
- Bookings, real agency APIs, and real hazard filings are out of scope for the demo.
- All voice flows have a text/touch fallback.
- Use elderly-friendly UI defaults: large text, clear labels, high contrast, low clutter, ≥44px touch targets.
- Sessions are single-shot. KV state wipes after each terminal turn.

## Agent Flow (locked 2026-05-09)

The full flow lives in `docs/refactor/2026-05-09-llm-turn-decision.md`. Summary:

```
audio in
  → STT (transcribe + language detect → { transcript_en, srcLang })
  → Classifier LLM           (LLM call #1; loops on ask_followup)
  → Main LLM                 (LLM call #2; emits LLMTurnDecision; mandatory generateReceipt)
  → Tool dispatch            (orchestrator walks toolCalls[] in order)
  → Translate kioskMessage   (English → srcLang)
  → TTS                      (audio out in srcLang)
  → Render receipt           (HTML, full-screen)
  → Reset session
```

### Main LLM output

```ts
type LLMTurnDecision = {
  requestType: "signpost" | "report_hazard" | "out_of_scope";
  kioskMessage: string;       // English; spoken + chat bubble. NOT the receipt.
  toolCalls: Array<           // generateReceipt is REQUIRED
    | { name: "signpost";        args: { agencyKey: string } }
    | { name: "reportHazard";    args: { category, location, description } }
    | { name: "generateReceipt"; args: GenerateReceiptArgs }
  >;
};
```

### Tool allowlist (three tools, no exceptions)

- `signpost(agencyKey)` — return an `AgencyContact` (incl. location/wayfinding).
- `reportHazard(category, location, description)` — stub for demo; returns a reference ID.
- `generateReceipt(args)` — render bilingual HTML; mandatory in every terminal turn.

`findNearby`, `escalateToMpRc`, `simulateBooking` are **removed**. Wayfinding lives on the agency record; escalation is the receipt itself; bookings are out of scope.

## Working Rules

- Start each task by stating which files you intend to touch.
- Keep PRs/commits scoped to one component or one vertical slice.
- Use typed/shared data contracts instead of inventing duplicate object shapes — `docs/standards/data-contracts.md` is canonical.
- Prefer seeded D1 data for hackathon speed, but structure it like production data.
- Add demo data deliberately: every feature needs visible seeded examples.
- Use feature flags or mock adapters for incomplete external integrations.

There is no four-dev lane split. Anyone can touch anything; coordinate before changing schemas, the orchestrator stage list, or the tool allowlist.

## UI Component Rules

All UI work follows the "Component Architecture" section of `docs/standards/ui-ux-standards.md`. Summary:

- Build on shadcn primitives in `src/components/ui/` (add via `npx shadcn@latest add <name>`). Do not roll your own button, input, dialog, switch, slider, etc. when shadcn covers it.
- Extract anything reused 2+ times into an atom under `src/components/atoms/` (e.g. listening pulse, agency card, receipt block). Atoms own no feature state.
- Split feature components when a file passes ~150 lines, has 3+ distinct sections, or repeats a JSX block. One component per file under `src/components/<feature>/`.
- Memoise only with a reason: `useMemo` for costly derivations, `useCallback` for memoised children or hook deps, `React.memo` for list rows. Hoist constant objects/arrays/style configs to module scope instead of recreating per render.
- Style via the primitive's variant API and `cn()` from `@/lib/utils`. If you find yourself duplicating a class string, you have an atom waiting to be extracted.

## Expected Verification

Before saying a task is done:

- Run the relevant lint/type/test command if the app stack exists.
- Manually verify the kiosk flow on the demo laptop when UI is touched.
- Confirm voice path works end-to-end (or that the touch fallback is wired) when AI is touched.
- Confirm no secrets, API keys, or personal data were committed.
- Update docs if behavior or data contracts changed. The refactor spec at `docs/refactor/2026-05-09-llm-turn-decision.md` must always reflect the current intended flow.

## Commit Message Style

Use:

- `feat: ...`
- `bugfix: ...`
- `docs: ...`
- `chore: ...`
- `test: ...`

Examples:

- `feat: classifier agent emits ClassifierDecision`
- `feat: orchestrator dispatches toolCalls in array order`
- `docs: lock LLMTurnDecision schema in data-contracts`
- `bugfix: STT adapter must return srcLang on Whisper path`

## Tool Compatibility Notes

Codex and Claude can both follow this file. Tool-specific files may also exist:

- Codex: `.codex/skills/care-access-map/SKILL.md`
- Claude: `CLAUDE.md`, `.claude/agents/*.md`

When instructions conflict, follow the most specific project file for the tool you are currently using, then this file, then general model defaults.
