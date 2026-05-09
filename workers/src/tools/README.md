# Allowlisted Tools

The main LLM may only call tools registered here. Three tools, no exceptions. Full schemas live in `docs/refactor/2026-05-09-llm-turn-decision.md` §4 and `docs/standards/data-contracts.md`.

## `signpost`

```ts
args:    { agencyKey: string }
returns: { agency: AgencyContact }   // includes hotline, address, hours, multilingual blurb,
                                     // and lat/long + walking-direction fields
```

Validates `agencyKey` against the directory; returns `AGENCY_NOT_ALLOWED` for unknown / inactive entries. The directory now includes MP, RC, town council, and hazard-authority entries so this tool covers both routing and escalation.

## `reportHazard`

```ts
args:    { category: string; location: string; description: string }
returns: { referenceId: string; routedTo: string }
```

**Demo stub.** Generates a reference ID like `HZ-20260509-012` and logs to console. No D1 row, no export. See `docs/refactor/2026-05-09-llm-turn-decision.md` §7 for upgrade triggers.

## `generateReceipt`

```ts
args:    GenerateReceiptArgs   // body, thingsToBring?, caseSummary?, signpostedAgencyKey?,
                               // hazardReferenceId?, language
returns: { receiptId: string; url: string }   // url = /receipts/:id (HTML)
```

Renders bilingual HTML (English + `language` arg) using the `body`, the `thingsToBring` checklist, the case summary, an agency contact block hydrated from the directory using `signpostedAgencyKey`, and the hazard reference if `hazardReferenceId` is supplied.

**Mandatory in every terminal turn's `toolCalls`.** The orchestrator re-prompts the main LLM if it isn't included.

## Removed

The previous allowlist included `findNearby`, `simulateBooking`, and `escalateToMpRc`. These are gone:

- `findNearby` — wayfinding fields (lat/long, walking direction hints) live on `AgencyContact`. `signpost` covers it.
- `simulateBooking` — out of scope for MVP.
- `escalateToMpRc` — escalation is now expressed by `signpost` (MP / CC / town council) plus `generateReceipt` (case summary on the receipt is the handoff).

## Registry contract

```ts
type ToolName = "signpost" | "reportHazard" | "generateReceipt";
invokeTool(name: ToolName, args: object): Promise<ToolResult>;
```

Tools never throw. They return a `ToolResult` envelope (`{ ok, data }` or `{ ok: false, error }`). The orchestrator uses `invokeTool` as the single surface — it never imports a specific tool file.
