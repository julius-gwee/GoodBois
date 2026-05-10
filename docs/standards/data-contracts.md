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

> D1 table: `locations`. Columns are snake-cased (`opening_hours`, `multilingual_blurb`, `walking_directions`, etc.). See `workers/migrations/0001_initial.sql`.

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

> D1 table: `receipts`. Columns are snake-cased (`session_id`, `things_to_bring_json`, etc.). See `workers/migrations/0001_initial.sql`.

## SessionCase (D1 — session-history audit)

Re-introduced 2026-05-10 as a session-history audit table. Distinct from the deprecated `Case` shape (which was tied to MP/RC CSV export — that's gone).

```ts
type SessionCase = {
  id: string;                  // "GBC-20260510-001"
  sessionId: string;
  kioskId: string;
  srcLang: string;             // BCP-47
  requestType: "signpost" | "report_hazard" | "out_of_scope";
  history: Array<{ role: "user" | "kiosk"; textEnglish: string; spokenAt: string }>;
  toolCalls: Array<{ name: string; args: unknown }>;
  kioskMessage: string;        // English; pre-translation
  receiptId?: string;          // FK → Receipt.id
  hazardReferenceId?: string;
  signpostedAgencyKey?: string; // FK → AgencyContact.key
  createdAt: string;
};
```

D1 table: `cases`. Columns are snake-cased (`session_id`, `history_json`, `tool_calls_json`, etc.). See `workers/migrations/0001_initial.sql` and `workers/src/db/d1/types.ts`. Written exactly once per session at the orchestrator's terminal turn (Stage 6), right after KV reset.

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
- **`Case` (old shape)** — the original `Case` row tied to MP/RC CSV export is gone. Superseded by **`SessionCase`** (see above), which lands the audit-table use case with a different shape (no `summaryEnglish`, `transcript`, `residentBlock`, `status`, or `exportChannel` fields).
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
  | "caregiver_waiting_spot"
  | "senior_activity"
  | "active_ageing"
  | "rc_centre"
  | "clinic"
  | "mps"
  | "government_service"
  | "community"
  | "hawker_food"
  | "groceries"
  | "mall"
  | "sports";

type Resource = {
  id: string;
  name: string | Record<string, string>; // Kawan directory UI may use BCP-47 localized copy with English fallback.
  category: ResourceCategory;
  description: string | Record<string, string>;
  address: string | Record<string, string>;
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
  | WaitingSpotDetails
  | SeniorActivityDetails
  | RcCentreDetails
  | ClinicDetails
  | MpsDetails
  | GovernmentServiceDetails
  | CommunityDetails
  | HawkerFoodDetails
  | GroceriesDetails
  | MallDetails
  | SportsDetails;

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

type SeniorActivityDetails = {
  type: "senior_activity";
  activities: string[];
  sheltered?: boolean;
  dropInFriendly?: boolean;
};

type RcCentreDetails = {
  type: "rc_centre";
  services: string[];
  volunteerHours?: string;
  mpSessionInfo?: string;
};

type ClinicDetails = {
  type: "clinic";
  services: string[];
  appointmentRequired?: boolean;
  dialysisSupportNearby?: boolean;
};

type MpsDetails = {
  type: "mps";
  mpName: string;
  sessionInfo: string;
  services: string[];
};

type GovernmentServiceDetails = {
  type: "government_service";
  agencies: string[];
  services: string[];
  appointmentRequired?: boolean;
};

type CommunityDetails = {
  type: "community";
  services: string[];
  meetingHours?: string;
  dementiaSupport?: boolean;
};

type HawkerFoodDetails = {
  type: "hawker_food";
  foodTypes: string[];
  marketStalls?: number;
  foodStalls?: number;
};

type GroceriesDetails = {
  type: "groceries";
  services: string[];
  paymentOptions?: string[];
};

type MallDetails = {
  type: "mall";
  services: string[];
  accessibleToilets?: boolean;
};

type SportsDetails = {
  type: "sports";
  facilities: string[];
  bookingRequired?: boolean;
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

## Resource Discovery API (Dev C)

Frontend reads resources through the Worker when `NEXT_PUBLIC_WORKER_URL` is set, and falls back to local fixtures when it is missing or unavailable.

```ts
type ResourceFilters = {
  query?: string;
  category?: ResourceCategory | "all";
  language?: DirectoryLanguage | "all";
  requireWheelchairFriendly?: boolean;
};

type ResourceLookupResponse = {
  resources: Resource[];
};
```

Endpoint:

```http
GET /resources?query=&category=&language=
```

Rules:

- `Resource` remains the primary map/directory entity.
- Link to `AgencyContact` only when a place has an official agency/hotline relationship.
- Coordinates stay WGS84 `latitude` / `longitude`; OneMap references are metadata only.

## Route Lookup API (Dev C)

```ts
type RouteLookupRequest = {
  destinationResourceId: string;
  mode?: "walk" | "wheelchair" | "drive";
};

type RouteLookupResponse = {
  routes: RouteOption[];
};
```

Endpoint:

```http
POST /routes
Content-Type: application/json

{
  "destinationResourceId": "servicesg-bukit-merah",
  "mode": "wheelchair"
}
```

Rules:

- Worker may call OneMap for live routing when OneMap secrets are configured.
- If OneMap is unavailable, Worker returns seeded demo routes so the kiosk remains demoable.
- Current demo seed origin is Blk 3 Jalan Bukit Merah, Singapore 150003.
- Wheelchair routing must be labelled honestly. If Barrier-Free Access routing is not available through the Worker yet, label the output as a walking/BFA fallback, not a guaranteed wheelchair-safe route.
- Do not store permanent route traces for anonymous kiosk users.

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
