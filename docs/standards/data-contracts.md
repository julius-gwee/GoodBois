# Data Contracts

These contracts are the shared language across all workstreams. Implementation can use TypeScript, JSON, or another typed format, but field names should stay stable.

## Resource

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

## Resource Details

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

## Hazard Report

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

## Route Safety Session

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

## Submission

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

## Export Requirements

Hazard CSV columns:

```csv
id,status,severity,hazardType,description,latitude,longitude,locationDescription,resourceId,routeSegmentId,reportedByRole,reportedAt,reviewedByRole,reviewedAt,expectedEndAt
```

Hazard JSON should be an array of `HazardReport`.

## Date and Coordinate Rules

- Dates use ISO 8601 strings.
- Coordinates use WGS84 latitude/longitude.
- Keep OneMap or Google provider references separate from canonical coordinates.
- Do not store medical diagnosis or full route traces in MVP data.
