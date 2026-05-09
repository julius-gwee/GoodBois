# Tool Descriptions for the Triage LLM

**Date:** 2026-05-09
**Owner:** Dev B (provides), Dev A (consumes)
**Companion:** `docs/agents/handoff-dev-b-to-dev-a.md`

This document gives Dev A the function-calling schemas and guidance the triage LLM needs to pick a tool, in the format Anthropic / OpenAI / Workers AI function-calling APIs expect. Drop the schemas straight into the LLM call; mirror the system-prompt fragment into the triage agent's prompt.

The triage LLM does not call these tools directly. It picks a `selectedToolName` and `selectedAgencyKey` (when applicable) and writes them into a `TriageResult`. Dev B's `runProcessing` then executes the chosen tool deterministically.

## Tool 1 — `signpost`

```json
{
  "name": "signpost",
  "description": "Look up a curated agency contact by its allowlisted key. Use this when the resident's request maps to a single known agency, hotline, or community resource. The function returns the agency's name, hotline, address, opening hours, and multilingual blurb. The LLM cannot fabricate hotlines: it must pick a key from the agencyKey enum below. If unsure, prefer escalateToMpRc instead of guessing.",
  "input_schema": {
    "type": "object",
    "properties": {
      "agencyKey": {
        "type": "string",
        "enum": [
          "hdb_essential_maintenance",
          "hdb_branch_office",
          "lta_customer_service",
          "transport_aid_silver_generation",
          "aic_eldercare_hotline",
          "scdf_emergency",
          "police_non_emergency",
          "legal_aid_bureau",
          "family_service_centre",
          "silver_generation_office",
          "comcare_hotline",
          "cpf_senior_hotline",
          "peoples_association",
          "active_ageing_centre",
          "skillsfuture_singapore",
          "sg_digital_office_seniors_go_digital",
          "mp_meet_the_people_session",
          "rc_visit"
        ],
        "description": "The stable slug of an agency in the curated AgencyContact directory. Must be exactly one of the allowlisted keys."
      }
    },
    "required": ["agencyKey"]
  }
}
```

## Tool 2 — `findNearby`

```json
{
  "name": "findNearby",
  "description": "Return up to 3 active agencies in the requested category. Use this when the resident's request is general (e.g., 'I need help with money problems') and you want to offer a small selection rather than commit to one specific agency. The kiosk will display the names and hotlines.",
  "input_schema": {
    "type": "object",
    "properties": {
      "category": {
        "type": "string",
        "enum": [
          "housing",
          "transport",
          "healthcare",
          "social_services",
          "legal",
          "financial_assistance",
          "elderly_activity",
          "digital_help",
          "mp_meet_the_people",
          "rc_visit",
          "other"
        ],
        "description": "The agency category to filter by."
      }
    },
    "required": ["category"]
  }
}
```

## Tool 3 — `escalateToMpRc`

```json
{
  "name": "escalateToMpRc",
  "description": "Create a structured Case for the MP/RC volunteer team to follow up. Use this when the request is multi-step, beyond a single hotline, ambiguous, or genuinely needs a human in the loop. The tool persists a Case row, validates suggested next steps, and is followed by a receipt. Do not invent phone numbers in suggestedNextSteps — only reference hotlines you would also signpost.",
  "input_schema": {
    "type": "object",
    "properties": {
      "summaryEnglish": {
        "type": "string",
        "description": "≤300 chars. Plain-English summary of what the resident asked for, written for an MP or RC volunteer who has not heard the call."
      },
      "summaryUserLanguage": {
        "type": "string",
        "description": "Optional. Same summary in the resident's spoken language, for kiosk display."
      },
      "suggestedNextSteps": {
        "type": "array",
        "items": { "type": "string" },
        "description": "Concrete next actions for the volunteer. Reference allowlisted agencies by name when relevant. Avoid inventing phone numbers."
      },
      "residentBlock": {
        "type": "string",
        "description": "Optional. HDB block number, only if the resident provided it. Never NRIC or full address."
      },
      "residentUnit": {
        "type": "string",
        "description": "Optional. HDB unit / floor, only if the resident provided it."
      },
      "residentNameAlias": {
        "type": "string",
        "description": "Optional. The name the resident wishes to be called (alias only). Never a real legal name on first contact."
      }
    },
    "required": ["summaryEnglish", "suggestedNextSteps"]
  }
}
```

## Tool 4 — `generateReceipt`

The triage LLM **does not call this directly.** `runProcessing` always calls it after `escalateToMpRc` succeeds, and on demand for signpost outcomes when the orchestrator decides a receipt is helpful.

It is listed here for completeness only. Do not include it in the LLM's tool list.

```json
{
  "name": "generateReceipt",
  "description": "Internal. Persists a Receipt row and returns a URL to a bilingual HTML receipt for the kiosk to display full-screen. Called by the processing agent, not by the triage LLM.",
  "input_schema": {
    "type": "object",
    "properties": {
      "sessionId": { "type": "string" },
      "caseId": { "type": "string", "description": "Optional. Link to a Case if this receipt is for an escalation." },
      "language": { "type": "string", "description": "BCP-47 language tag for the receipt copy." }
    },
    "required": ["sessionId", "language"]
  }
}
```

## System-prompt fragment for the triage agent

Drop this into the triage LLM's system prompt verbatim — it captures the allowlist constraint that the agent file requires.

```
You are the triage agent for GoodBois, a void-deck voice kiosk for elderly Singaporeans. You help residents in Mandarin, Hokkien, or English. You decide what to do next and choose ONE of these outcomes:

- "signpost" — call the signpost tool with one allowlisted agency key.
- "find_nearby" — call findNearby with one category to offer up to 3 options.
- "ask_followup" — ask one bounded follow-up question (max 3 follow-ups per session).
- "escalate" — call escalateToMpRc to create a structured case for the MP or RC volunteer team. Receipt is generated automatically.
- "out_of_scope" — for medical / legal emergencies and topics outside our remit, signpost a curated emergency hotline (e.g. SCDF 995 via agencyKey="scdf_emergency").

Hard rules:
1. NEVER fabricate a hotline, agency name, or address. Only use agencyKey values from the enum in the signpost tool. If the right agency is not in the allowlist, escalate instead of guessing.
2. NEVER ask for NRIC. Block / unit / alias are optional; ask only if escalating and the resident volunteers it.
3. Bound your follow-ups to 3 per session. After that, decide an outcome.
4. For medical emergencies (chest pain, breathing trouble, unresponsive person), choose out_of_scope and signpost scdf_emergency immediately. Do not ask follow-ups.
5. The simulateBooking tool is disabled in this build. Do not select it.

Reasoning style: be concise; explain your outcome choice in one sentence in the reasoningSummary.
```

## Mapping triage outcomes → tools (reference for Dev A)

This table is what `runProcessing` already does — duplicated here so Dev A's prompt construction stays aligned.

| `triage.outcome`   | LLM should fill                                            | Processing agent calls                  |
|--------------------|------------------------------------------------------------|-----------------------------------------|
| `signpost`         | `selectedToolName: "signpost"`, `selectedAgencyKey`         | `signpost`                              |
| `find_nearby`      | `selectedToolName: "findNearby"`, category in arguments     | `findNearby`                            |
| `ask_followup`     | `followupQuestion`                                          | (handled by Dev A's orchestrator)       |
| `escalate`         | summary + suggestedNextSteps in arguments                   | `escalateToMpRc` then `generateReceipt` |
| `out_of_scope`     | `selectedAgencyKey: "scdf_emergency"` (or other curated)    | `signpost`                              |
| `simulate_booking` | (LLM should not pick this)                                  | rejected — `TOOL_NOT_ALLOWED`           |

## Workers AI specifics

When using `env.AI.run(...)` with a Llama-class model that supports function calling:

- Pass the four schemas (excluding `generateReceipt`) as the `tools` array.
- Set `tool_choice: "auto"` for normal turns; `tool_choice: { type: "tool", name: "signpost" }` only when forcing a deterministic demo path.
- Parse the model's `tool_calls[0]` and translate it to `TriageResult`:
  - `selectedToolName` = `tool_calls[0].name`
  - `selectedAgencyKey` = `tool_calls[0].arguments.agencyKey` (when present)
  - `outcome` = derived from the tool name (signpost → `signpost`, findNearby → `find_nearby`, escalateToMpRc → `escalate`)
  - If the model returns text instead of a tool call, treat as `ask_followup` and put the text in `followupQuestion`.

That object goes into `runProcessing(input, repos)` and you're done.
