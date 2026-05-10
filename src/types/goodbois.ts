// src/types/goodbois.ts
//
// Frontend twin of workers/src/types/contracts.ts. Pipeline schemas mirror the
// worker exactly. Map / directory types below the divider are NTH (Phase 5)
// and only consumed by src/components/map/*.

// ---------------------------------------------------------------------------
// Pipeline (mirror of workers/src/types/contracts.ts)
// ---------------------------------------------------------------------------

export type STTResult = {
  transcript_en: string;
  srcLang: string;
};

export type ClassifierRequestType =
  | "signpost"
  | "report_hazard"
  | "out_of_scope"
  | "ask_followup";

export type ClassifierDecision = {
  requestType: ClassifierRequestType;
  followupPrompt?: string;
};

export type MainRequestType = "signpost" | "report_hazard" | "out_of_scope";

export type SignpostToolCall = {
  name: "signpost";
  args: { agencyKey: string };
};

export type ReportHazardToolCall = {
  name: "reportHazard";
  args: {
    category: string;
    location: string;
    description: string;
  };
};

export type GenerateReceiptToolCall = {
  name: "generateReceipt";
  args: GenerateReceiptArgs;
};

export type ToolCall =
  | SignpostToolCall
  | ReportHazardToolCall
  | GenerateReceiptToolCall;

export type LLMTurnDecision = {
  requestType: MainRequestType;
  kioskMessage: string;
  toolCalls: ToolCall[];
};

export type GenerateReceiptArgs = {
  body: string;
  thingsToBring?: string[];
  caseSummary?: string;
  signpostedAgencyKey?: string;
  hazardReferenceId?: string;
  language: string;
};

export type TurnRequest = {
  sessionId?: string;
  kioskId: string;
  audioBase64?: string;
  text?: string;
};

export type TurnState = "listening" | "followup" | "done";

export type TurnResponse = {
  sessionId: string;
  state: TurnState;
  transcript: { english: string; srcLang: string };
  kioskMessage: string;
  audioUrl?: string;
  receiptUrl?: string;
  error?: { code: string; message: string; fallbackAvailable: boolean };
};

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

export type Receipt = {
  id: string;
  sessionId: string;
  language: string;
  body: string;
  thingsToBring: string[];
  caseSummary?: string;
  signpostedAgencyKey?: string;
  hazardReferenceId?: string;
  generatedAt: string;
};

// ---------------------------------------------------------------------------
// NTH map / directory (Phase 5 — owned by Dev C). Used only by
// src/components/map/* and src/lib/map/*.
// ---------------------------------------------------------------------------

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
    }
  | {
      type: "mps";
      mpName: string;
      sessionInfo: string;
      services: string[];
    }
  | {
      type: "government_service";
      agencies: string[];
      services: string[];
      appointmentRequired?: boolean;
    }
  | {
      type: "community";
      services: string[];
      meetingHours?: string;
      dementiaSupport?: boolean;
    }
  | {
      type: "hawker_food";
      foodTypes: string[];
      marketStalls?: number;
      foodStalls?: number;
    }
  | {
      type: "groceries";
      services: string[];
      paymentOptions?: string[];
    }
  | {
      type: "mall";
      services: string[];
      accessibleToilets?: boolean;
    }
  | {
      type: "sports";
      facilities: string[];
      bookingRequired?: boolean;
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
