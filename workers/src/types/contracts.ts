export type UtteranceMode = "voice" | "touch" | "scripted_demo";

export type TriageOutcome =
  | "signpost"
  | "find_nearby"
  | "simulate_booking"
  | "ask_followup"
  | "escalate"
  | "out_of_scope";

export type AgencyCategory =
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
  | "hazard_authority"
  | "other";

export type AgencyContact = {
  key: string;
  name: string;
  hotline?: string;
  address?: string;
  url?: string;
  openingHours?: string;
  category: AgencyCategory;
  multilingualBlurb: Record<string, string>;
  latitude?: number;
  longitude?: number;
  walkingDirectionsHint?: string;
  active: boolean;
  source: "seed" | "partner" | "official";
  updatedAt: string;
};

export type Case = {
  id: string;
  sessionId: string;
  language: string;
  summaryEnglish: string;
  summaryUserLanguage?: string;
  transcript: string;
  suggestedNextSteps: string[];
  residentBlock?: string;
  residentUnit?: string;
  residentNameAlias?: string;
  kioskId: string;
  status: "queued" | "exported" | "received" | "closed";
  createdAt: string;
  exportedAt?: string;
  exportChannel?: "csv" | "webhook" | "email";
};

export type Receipt = {
  id: string;
  sessionId: string;
  caseId?: string;
  language: string;
  pdfUrl: string;
  generatedAt: string;
};

export type DirectoryLanguage = "en" | "zh-Hans" | "nan-Hant" | "ms" | "ta";

export type LocalizedText = Partial<Record<DirectoryLanguage, string>> & {
  en: string;
};

export type VerificationStatus =
  | "verified"
  | "community_submitted"
  | "needs_recheck"
  | "unknown";

export type ResourceCategory =
  | "accessible_restroom"
  | "pickup_dropoff"
  | "equipment"
  | "digital_form_help"
  | "caregiver_waiting_spot"
  | "senior_activity"
  | "rc_centre"
  | "clinic";

export type ResourcePhoto = {
  id: string;
  url: string;
  alt: string;
  capturedAt?: string;
};

export type ResourceDetails =
  | {
      type: "accessible_restroom";
      floor?: string;
      nearestLift?: string;
      caregiverEntryPossible?: boolean;
      adultChangingBench?: boolean;
      doorSpaceNotes?: string;
      cleanlinessNotes?: string;
    }
  | {
      type: "pickup_dropoff";
      sheltered?: boolean;
      vehicleTypeSupported: string[];
      routeToEntrance?: string;
      wheelchairTaxiSuitable?: boolean;
      waitingAreaNotes?: string;
      obstacleNotes?: string;
    }
  | {
      type: "equipment";
      equipmentTypes: string[];
      availabilityStatus?: "available" | "limited" | "call_ahead" | "unknown";
      deposit?: string;
      rentalCost?: string;
      eligibility?: string;
      collectionInstructions?: string;
    }
  | {
      type: "digital_form_help";
      helpTypes: string[];
      appointmentRequired?: boolean;
      documentsNeeded: string[];
      singpassHelpAvailable?: boolean;
      voucherHelpAvailable?: boolean;
    }
  | {
      type: "caregiver_waiting_spot";
      seating?: string;
      quietness?: "quiet" | "moderate" | "busy" | "unknown";
      chargingAvailable?: boolean;
      foodNearby?: boolean;
      supportActivityAvailable?: boolean;
    }
  | {
      type: "senior_activity";
      activities: string[];
      sheltered?: boolean;
      dropInFriendly?: boolean;
    }
  | {
      type: "rc_centre";
      services: string[];
      volunteerHours?: string;
      mpSessionInfo?: string;
    }
  | {
      type: "clinic";
      services: string[];
      appointmentRequired?: boolean;
      dialysisSupportNearby?: boolean;
    };

export type Resource = {
  id: string;
  name: LocalizedText;
  category: ResourceCategory;
  description: LocalizedText;
  address: LocalizedText;
  latitude: number;
  longitude: number;
  openingHours?: LocalizedText;
  contactPhone?: string;
  contactUrl?: string;
  costType?: "free" | "paid" | "subsidised" | "unknown";
  languages: DirectoryLanguage[];
  accessibilityFeatures: LocalizedText[];
  practicalNotes: LocalizedText[];
  photos: ResourcePhoto[];
  verificationStatus: VerificationStatus;
  lastVerifiedAt?: string;
  verifiedByRole?: string;
  confidenceLevel: "high" | "medium" | "low";
  source: "seed" | "community" | "partner" | "official";
  mapProviderReference?: string;
  routeNotes?: LocalizedText[];
  currentHazardStatus?: "none" | "caution" | "avoid" | "unknown";
  linkedAgencyKey?: string;
  details: ResourceDetails;
  createdAt: string;
  updatedAt: string;
};

export type RouteMode = "walk" | "wheelchair" | "drive";

export type RouteStep = {
  id: string;
  instruction: LocalizedText;
  distanceMeters: number;
  durationMinutes: number;
  latitude: number;
  longitude: number;
  caution?: LocalizedText;
};

export type RouteOption = {
  id: string;
  destinationResourceId: string;
  mode: RouteMode;
  durationMinutes: number;
  distanceMeters: number;
  isRecommended: boolean;
  providerLabel: string;
  origin: {
    latitude: number;
    longitude: number;
    label: LocalizedText;
  };
  polyline: Array<{
    latitude: number;
    longitude: number;
  }>;
  notes: LocalizedText[];
  steps: RouteStep[];
};

export type ResourceFilters = {
  query?: string;
  category?: ResourceCategory | "all";
  language?: DirectoryLanguage | "all";
  requireWheelchairFriendly?: boolean;
};

export type RoutePrintPayload = {
  destinationName: string;
  routeMode: RouteMode;
  distanceMeters: number;
  durationMinutes: number;
  generatedAt: string;
  kioskLocation: string;
  steps: string[];
  disclaimerEnglish: string;
};

export type TurnRequest = {
  sessionId?: string;
  kioskId: string;
  language: string;
  mode: UtteranceMode;
  text?: string;
  audioBase64?: string;
  scriptedStep?: "initial_request" | "followup_answer" | "accept_escalation";
};

export type TurnResponse = {
  sessionId: string;
  state: "listening" | "thinking" | "followup" | "response" | "receipt" | "error";
  transcript?: {
    original: string;
    english?: string;
    language: string;
  };
  kioskMessage: {
    original: string;
    english: string;
    language: string;
  };
  triage?: {
    outcome: TriageOutcome;
    confidence: "high" | "medium" | "low";
    selectedToolName?: string;
      selectedAgencyKey?: string;
      selectedResourceId?: string;
  };
  agencyContact?: AgencyContact;
  nearbyResources?: Resource[];
  routeOptions?: RouteOption[];
  case?: Case;
  receipt?: Receipt;
  audioUrl?: string;
  nextActions: Array<
    | "listen"
    | "type"
    | "accept_escalation"
    | "decline_escalation"
    | "show_receipt"
    | "reset"
  >;
  error?: {
    code: string;
    message: string;
    fallbackAvailable: boolean;
  };
};

export type TriageResult = {
  id: string;
  sessionId: string;
  outcome: TriageOutcome;
  confidence: "high" | "medium" | "low";
  selectedToolName?: string;
  selectedAgencyKey?: string;
  followupQuestion?: string;
  reasoningSummary: string;
  createdAt: string;
};

export type ToolInvocation = {
  id: string;
  sessionId: string;
  toolName: string;
  argumentsJson: string;
  resultJson: string;
  startedAt: string;
  completedAt: string;
  success: boolean;
  errorMessage?: string;
};
