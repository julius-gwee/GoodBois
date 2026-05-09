# Data Contracts

These contracts are the shared language across the Worker, the frontend, and seed data. Implementation can use TypeScript, JSON, or another typed format, but field names should stay stable.

> **Source of truth for the agent flow:** `docs/refactor/2026-05-09-llm-turn-decision.md`. The schemas in this file are aligned with that spec; if anything drifts, the refactor spec wins and this file should be updated in the same PR.

The MVP entities below live in **Cloudflare D1**. Transient turn state lives in **Cloudflare KV** (wiped on every terminal turn). Receipts are served as HTML by the Worker; R2 is not used in the MVP path.

---

## Pipeline schemas (LLM I/O)

These are the contracts between the orchestrator, the classifier agent, the main LLM agent, and the tool registry. They are the heart of the new flow.

### `STTResult`

```ts
type STTResult = {
  transcript_en: string;     // English transcript, translated by the adapter if necessary
  srcLang: string;           // BCP-47 detected source language
};
```

The STT adapter is responsible for both transcription and language detection. If the underlying model only does one job, the adapter layers detection + translation internally. Callers see a single returned object.

### `ClassifierDecision` (output of LLM call #1)

```ts
type ClassifierDecision = {
  requestType: "signpost" | "report_hazard" | "out_of_scope" | "ask_followup";
  followupPrompt?: string;   // English; only when requestType === "ask_followup"
};
```

The classifier owns the followup loop. While `requestType === "ask_followup"`, the orchestrator speaks the prompt back to the resident and re-classifies the next utterance.

### `LLMTurnDecision` (output of LLM call #2)

```ts
type LLMTurnDecision = {
  requestType: "signpost" | "report_hazard" | "out_of_scope";
  // ask_followup never reaches the main LLM — the classifier loop terminates first.

  kioskMessage: string;
  // English, short, conversational. Chat-bubble text + TTS source. NOT the receipt body.

  toolCalls: Array<
    | { name: "signpost";        args: { agencyKey: string } }
    | { name: "reportHazard";    args: { category: string; location: string; description: string } }
    | { name: "generateReceipt"; args: GenerateReceiptArgs }
  >;
  // Order matters — tools execute in array order.
  // generateReceipt MUST be present. The orchestrator re-prompts the LLM if it isn't.
};
```

### `GenerateReceiptArgs`

```ts
type GenerateReceiptArgs = {
  body: string;                      // English; the printed content
  thingsToBring?: string[];          // structured checklist; rendered as bullets
  caseSummary?: string;              // who/what/when/where/why/how, English
  signpostedAgencyKey?: string;      // hydrated from the directory at render time
  hazardReferenceId?: string;        // hydrated from a prior reportHazard result
  language: string;                  // BCP-47; orchestrator passes srcLang
};
```

### `ToolResult` envelope

```ts
type ToolResult = {
  ok: true;
  data: unknown;                     // shape per tool (see §"Tool return shapes" below)
} | {
  ok: false;
  error: { code: ToolErrorCode; message: string; fallbackAvailable: boolean };
};

type ToolErrorCode =
  | "AGENCY_NOT_ALLOWED"             // signpost was given an unknown / inactive key
  | "TOOL_NOT_ALLOWED"               // main LLM emitted a tool name not in the registry
  | "VALIDATION_FAILED"              // args did not match the tool's expected shape
  | "TOOL_FAILED";                   // unexpected internal error
```

Tools never throw to the orchestrator. They return a `ToolResult` envelope.

### Tool return shapes

```ts
// signpost
type SignpostResult = { agency: AgencyContact };

// reportHazard (demo stub — see refactor spec §7)
type ReportHazardResult = { referenceId: string; routedTo: string };

// generateReceipt
type GenerateReceiptResult = { receiptId: string; url: string };
```

---

## TurnRequest / TurnResponse (Worker ↔ frontend)

```ts
type TurnRequest = {
  sessionId?: string;          // omit on first audio of a fresh session
  kioskId: string;
  audioBase64?: string;        // primary input
  text?: string;               // touch-fallback input
};

type TurnResponse = {
  sessionId: string;
  state: "listening" | "followup" | "done";
  transcript: { english: string; srcLang: string };
  kioskMessage: string;        // already translated into srcLang
  audioUrl?: string;           // signed URL for TTS audio
  receiptUrl?: string;         // present only when state === "done"
  error?: { code: string; message: string; fallbackAvailable: boolean };
};
```

`state` semantics:

- `listening` — initial mic open before any STT result.
- `followup` — classifier asked for clarification; mic re-opens.
- `done` — terminal turn; receipt rendered; session reset on the next idle tick.

---

## KioskSession (KV — single-shot)

```ts
type KioskSession = {
  id: string;                  // UUID
  kioskId: string;
  history: Array<{             // utterances in this conversation only
    role: "user" | "kiosk";
    textEnglish: string;       // English; what the LLMs see
    spokenAt: string;
  }>;
  srcLang?: string;            // BCP-47, set after the first STT call
  startedAt: string;
};
```

Wiped after every terminal turn. The kiosk does not retain conversation history across users.

## AgencyContact (D1 — MVP)

```ts
type AgencyCategory =
  | "housing"
  | "transport"
  | "healthcare"
  | "social_services"
  | "legal"
  | "financial_assistance"
  | "elderly_activity"
  | "digital_help"
  | "mp_meet_the_people"
  | "rc_visit"
  | "town_council"
  | "hazard_authority"           // LTA / HDB / MOM / etc.
  | "other";

type AgencyContact = {
  key: string;                   // stable slug, e.g. "town-council-east-coast"
  name: string;
  hotline?: string;
  address?: string;
  url?: string;
  openingHours?: string;
  category: AgencyCategory;
  multilingualBlurb: Record<string, string>;   // BCP-47 → blurb
  // Wayfinding fields — fold-in from the retired findNearby tool
  latitude?: number;
  longitude?: number;
  walkingDirectionsHint?: string;
  active: boolean;               // false hides the agency from the signpost tool
  source: "seed" | "partner" | "official";
  updatedAt: string;
};
```

The directory now includes MP / RC / town-council / hazard-authority entries so `signpost` can cover both routing and escalation use cases.

## Receipt (D1 — MVP)

```ts
type Receipt = {
  id: string;                    // human-friendly e.g. "GBR-20260509-001"
  sessionId: string;             // FK → KioskSession.id
  language: string;              // BCP-47 of the receipt copy
  body: string;                  // English; the printed content
  thingsToBring: string[];       // [] when none
  caseSummary?: string;          // who/what/when/where/why/how, English
  signpostedAgencyKey?: string;  // FK → AgencyContact.key
  hazardReferenceId?: string;    // from a reportHazard call in the same turn
  generatedAt: string;
};
```

Served as bilingual HTML at `GET /receipts/:id`. No PDF, no R2 in the MVP path.

## ToolInvocation (D1 — audit log)

```ts
type ToolInvocation = {
  id: string;
  sessionId: string;
  toolName: "signpost" | "reportHazard" | "generateReceipt";
  argumentsJson: string;
  resultJson: string;
  startedAt: string;
  completedAt: string;
  success: boolean;
  errorMessage?: string;
};
```

Optional for the MVP demo but cheap to keep — the registry can write these rows for audit.

## Utterance (D1 — optional)

```ts
type UtteranceRole = "user" | "kiosk";
type UtteranceMode = "voice" | "touch";

type Utterance = {
  id: string;
  sessionId: string;             // FK → KioskSession.id
  role: UtteranceRole;
  mode: UtteranceMode;
  textOriginal: string;          // raw user-language text (or kiosk-language response)
  textEnglish?: string;
  language: string;              // BCP-47
  spokenAt: string;
};
```

Optional for the demo; useful if a post-mortem audit is needed.

---

## Deprecated entities

These were part of the prior agent flow and are retained here only so old code can be located and removed.

- **`TriageResult`** — replaced by `LLMTurnDecision`. Old fields (`outcome`, `confidence`, `selectedToolName`, `selectedAgencyKey`, `followupQuestion`, `reasoningSummary`) are gone.
- **`Case`** — escalation is now expressed by `signpost` (MP / CC contact) + `generateReceipt` (case summary). The `Case` row and MP/RC CSV export are not part of the MVP demo. They may return as a post-demo audit table; do not block MVP work on them.
- **`BookingConfirmation`** — `simulateBooking` is removed.

---

# NTH entities (build only after MVP is solid)

## Resource (NTH — resource discovery + wheelchair routing)

```ts
type VerificationStatus = "verified" | "community_submitted" | "needs_recheck" | "unknown";

type ResourceCategory =
  | "accessible_restroom"
  | "pickup_dropoff"
  | "equipment"
  | "digital_form_help"
  | "caregiver_waiting_spot";

type Resource = {
  id: string;
  name: string;
  category: ResourceCategory;
  description: string;
  address: string;
  latitude: number;
  longitude: number;
  openingHours?: string;
  contactPhone?: string;
  contactUrl?: string;
  costType?: "free" | "paid" | "subsidised" | "unknown";
  languages: string[];
  accessibilityFeatures: string[];
  practicalNotes: string[];
  photos: ResourcePhoto[];
  verificationStatus: VerificationStatus;
  lastVerifiedAt?: string;
  verifiedByRole?: string;
  confidenceLevel: "high" | "medium" | "low";
  source: "seed" | "community" | "partner" | "official";
  mapProviderReference?: string;
  routeNotes?: string[];
  currentHazardStatus?: "none" | "caution" | "avoid" | "unknown";
  details: ResourceDetails;
  createdAt: string;
  updatedAt: string;
};
```

## Resource Details (NTH)

```ts
type ResourcePhoto = {
  id: string;
  url: string;
  alt: string;
  capturedAt?: string;
};

type ResourceDetails =
  | AccessibleRestroomDetails
  | PickupDropoffDetails
  | EquipmentDetails
  | DigitalFormHelpDetails
  | WaitingSpotDetails;

type AccessibleRestroomDetails = {
  type: "accessible_restroom";
  floor?: string;
  nearestLift?: string;
  caregiverEntryPossible?: boolean;
  adultChangingBench?: boolean;
  doorSpaceNotes?: string;
  cleanlinessNotes?: string;
};

type PickupDropoffDetails = {
  type: "pickup_dropoff";
  sheltered?: boolean;
  vehicleTypeSupported: string[];
  routeToEntrance?: string;
  wheelchairTaxiSuitable?: boolean;
  waitingAreaNotes?: string;
  obstacleNotes?: string;
};

type EquipmentDetails = {
  type: "equipment";
  equipmentTypes: string[];
  availabilityStatus?: "available" | "limited" | "call_ahead" | "unknown";
  deposit?: string;
  rentalCost?: string;
  eligibility?: string;
  collectionInstructions?: string;
};

type DigitalFormHelpDetails = {
  type: "digital_form_help";
  helpTypes: string[];
  appointmentRequired?: boolean;
  documentsNeeded: string[];
  singpassHelpAvailable?: boolean;
  voucherHelpAvailable?: boolean;
};

type WaitingSpotDetails = {
  type: "caregiver_waiting_spot";
  seating?: string;
  quietness?: "quiet" | "moderate" | "busy" | "unknown";
  chargingAvailable?: boolean;
  foodNearby?: boolean;
  supportActivityAvailable?: boolean;
};
```

## HazardReport (NTH — real persistence, post-demo)

For the MVP, `reportHazard` is a stub that returns a reference ID without writing anywhere. The schema below is what real persistence will look like once a town-council channel is wired in. Do not build it for the demo.

```ts
type HazardType =
  | "lighting"
  | "lift_outage"
  | "drainage"
  | "blocked_ramp"
  | "toilet_closed"
  | "construction"
  | "unsafe_crossing"
  | "obstacle"
  | "route_inaccessible"
  | "other";

type HazardStatus = "pending" | "active" | "resolved" | "duplicate" | "rejected" | "needs_recheck";

type HazardReport = {
  id: string;                    // e.g. "HZ-20260509-012"
  sessionId: string;
  category: HazardType;
  location: string;              // free text the resident gave
  description: string;
  srcLang: string;
  transcript: string;            // English
  routedTo?: string;             // FK → AgencyContact.key
  status: HazardStatus;
  reportedAt: string;
  reviewedByRole?: string;
  reviewedAt?: string;
  exportStatus: "not_exported" | "exported" | "sent_to_partner";
};
```

## Route Safety Session (NTH — low priority)

```ts
type RouteSafetySession = {
  id: string;
  seniorAlias: string;
  caregiverContact: string;
  startLatitude: number;
  startLongitude: number;
  destinationLatitude: number;
  destinationLongitude: number;
  suggestedRoutePolyline: string;
  allowedDeviationMeters: number;
  startedAt: string;
  endedAt?: string;
  status: "active" | "completed" | "cancelled";
  lastKnownLatitude?: number;
  lastKnownLongitude?: number;
  lastPingAt?: string;
  consentConfirmed: boolean;
};
```

## Submission (NTH — low priority)

```ts
type Submission = {
  id: string;
  resourceId?: string;
  submissionType: "new" | "edit" | "issue" | "hazard";
  submittedByRole: "caregiver" | "senior" | "volunteer" | "admin" | "partner";
  submittedAt: string;
  status: "pending" | "approved" | "rejected" | "needs_info";
  proposedChanges: Record<string, unknown>;
  photos: ResourcePhoto[];
  reviewerNotes?: string;
};
```

---

## Date, Coordinate, Language, Identity Rules

- Dates use ISO 8601 strings.
- Coordinates use WGS84 latitude/longitude.
- Languages use BCP-47 tags (e.g. `en`, `zh-Hans`, `nan-Hant` for Hokkien). Final tag list owned by voice-research work.
- Keep OneMap / Google provider references separate from canonical coordinates.
- Do not store medical diagnosis or full route traces.
- Do not store NRIC. Identity capture is optional and aliased only.
