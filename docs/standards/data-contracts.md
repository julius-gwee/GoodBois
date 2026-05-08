# Data Contracts

These contracts are the shared language across all workstreams. Implementation can use TypeScript (frontend + Worker), JSON, or another typed format, but field names should stay stable.

The MVP entities below live in **Cloudflare D1**. Transient session context lives in **Cloudflare KV**. Receipt PDFs (and optional debug audio) live in **Cloudflare R2**.

## KioskSession (MVP)

```ts
type KioskSession = {
  id: string;                       // UUID
  kioskId: string;                  // physical kiosk identifier (block + unit code, or "demo-laptop")
  userLanguage: string;             // BCP-47 e.g. "zh-Hans", "nan-Hant" (Hokkien), "en"
  startedAt: string;                // ISO 8601
  endedAt?: string;
  outcome: "signposted" | "booked" | "escalated" | "abandoned" | "failed";
  caseId?: string;                  // populated if outcome = escalated
  receiptId?: string;               // populated if a receipt was generated
};
```

## Utterance (MVP)

```ts
type UtteranceRole = "user" | "kiosk";
type UtteranceMode = "voice" | "touch";

type Utterance = {
  id: string;
  sessionId: string;                // FK → KioskSession.id
  role: UtteranceRole;
  mode: UtteranceMode;
  textOriginal: string;             // raw user-language text (or kiosk-language response)
  textEnglish?: string;             // post-translation; null if no translation needed
  language: string;                 // BCP-47
  spokenAt: string;                 // ISO 8601
};
```

## TriageResult (MVP)

```ts
type TriageOutcome =
  | "signpost"
  | "find_nearby"
  | "simulate_booking"
  | "ask_followup"
  | "escalate"
  | "out_of_scope";

type TriageResult = {
  id: string;
  sessionId: string;                // FK → KioskSession.id
  outcome: TriageOutcome;
  confidence: "high" | "medium" | "low";
  selectedToolName?: string;        // null if outcome = ask_followup or out_of_scope
  selectedAgencyKey?: string;       // FK → AgencyContact.key, when relevant
  followupQuestion?: string;        // populated only when outcome = ask_followup
  reasoningSummary: string;         // short LLM rationale, in English
  createdAt: string;
};
```

## ToolInvocation (MVP)

```ts
type ToolInvocation = {
  id: string;
  sessionId: string;                // FK → KioskSession.id
  toolName: string;                 // e.g. "signpost", "findNearby", "simulateBooking", "generateReceipt", "escalateToMpRc"
  argumentsJson: string;            // serialized tool arguments
  resultJson: string;               // serialized tool result
  startedAt: string;
  completedAt: string;
  success: boolean;
  errorMessage?: string;
};
```

## AgencyContact (MVP)

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
  | "other";

type AgencyContact = {
  key: string;                      // stable slug, e.g. "hdb_essential_services"
  name: string;
  hotline?: string;
  address?: string;
  url?: string;
  openingHours?: string;
  category: AgencyCategory;
  multilingualBlurb: Record<string, string>; // BCP-47 → blurb
  active: boolean;                  // false hides it from triage tools
  source: "seed" | "partner" | "official";
  updatedAt: string;
};
```

## Case — escalation to MP/RC (MVP)

```ts
type Case = {
  id: string;                       // human-friendly e.g. "GBC-20260509-001"
  sessionId: string;                // FK → KioskSession.id
  language: string;                 // BCP-47 of the original conversation
  summaryEnglish: string;           // LLM-generated, ≤300 chars
  summaryUserLanguage?: string;     // translated copy, optional for kiosk display
  transcript: string;               // English transcript snippet for MP/RC volunteers
  suggestedNextSteps: string[];     // LLM-generated, allowlist-validated
  residentBlock?: string;           // optional, only if user provided
  residentUnit?: string;            // optional
  residentNameAlias?: string;       // optional, NRIC never stored
  kioskId: string;
  status: "queued" | "exported" | "received" | "closed";
  createdAt: string;
  exportedAt?: string;
  exportChannel?: "csv" | "webhook" | "email";
};
```

## Receipt (MVP)

```ts
type Receipt = {
  id: string;                       // human-friendly e.g. "GBR-20260509-001"
  sessionId: string;                // FK → KioskSession.id
  caseId?: string;                  // populated if linked to an escalation
  language: string;                 // BCP-47 of the receipt copy
  pdfUrl: string;                   // signed R2 URL
  generatedAt: string;
};
```

## BookingConfirmation (MVP — simulated for demo)

```ts
type BookingConfirmation = {
  agencyKey: string;                // FK → AgencyContact.key
  slot: string;                     // ISO 8601 datetime range, e.g. "2026-05-12T10:00/PT30M"
  reference: string;                // simulated reference number
  notes?: string;                   // any caller instructions, in English
};
```

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

## Hazard Report (NTH — low priority)

```ts
type HazardType =
  | "blocked_ramp"
  | "lift_outage"
  | "toilet_closed"
  | "construction"
  | "unsafe_crossing"
  | "poor_lighting"
  | "obstacle"
  | "route_inaccessible"
  | "other";

type HazardStatus = "pending" | "active" | "resolved" | "duplicate" | "rejected" | "needs_recheck";

type HazardReport = {
  id: string;
  resourceId?: string;
  routeSegmentId?: string;
  hazardType: HazardType;
  severity: "info" | "caution" | "avoid" | "urgent_review";
  description: string;
  latitude: number;
  longitude: number;
  locationDescription: string;
  photos: ResourcePhoto[];
  reportedByRole: "caregiver" | "senior" | "volunteer" | "admin" | "partner";
  reportedAt: string;
  expectedEndAt?: string;
  status: HazardStatus;
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

## Export Requirements

### MP/RC Case CSV (MVP)

```csv
id,createdAt,language,summaryEnglish,transcript,suggestedNextSteps,residentBlock,residentUnit,residentNameAlias,kioskId,status,sessionId
```

`suggestedNextSteps` is a `;`-separated list to keep CSV clean.

### MP/RC Case JSON (MVP)

Array of `Case`. Webhook payload per escalation: `{ "case": Case }`.

### Hazard CSV (NTH)

```csv
id,status,severity,hazardType,description,latitude,longitude,locationDescription,resourceId,routeSegmentId,reportedByRole,reportedAt,reviewedByRole,reviewedAt,expectedEndAt
```

Hazard JSON: array of `HazardReport`.

## Date, Coordinate, Language, Identity Rules

- Dates use ISO 8601 strings.
- Coordinates use WGS84 latitude/longitude.
- Languages use BCP-47 tags (e.g. `en`, `zh-Hans`, `nan-Hant` for Hokkien). Final tag list owned by voice-agent research.
- Keep OneMap or Google provider references separate from canonical coordinates.
- Do not store medical diagnosis or full route traces.
- Do not store NRIC. Identity capture is optional and aliased only.
