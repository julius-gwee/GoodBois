import type {
  Location, SessionCase, SessionCaseHistoryEntry, SessionCaseRequestType,
  SessionCaseRow, SessionCaseToolCall, SessionReceipt, SessionReceiptRow,
  LocationRow,
} from "./types";
import type { AgencyCategory } from "../../types/contracts";

function nullable<T>(v: T | null | undefined): T | undefined {
  return v === null || v === undefined ? undefined : v;
}

export function rowToLocation(row: LocationRow): Location {
  return {
    key: row.key,
    name: row.name,
    category: row.category as AgencyCategory,
    hotline: nullable(row.hotline),
    address: nullable(row.address),
    url: nullable(row.url),
    openingHours: nullable(row.opening_hours),
    multilingualBlurb: JSON.parse(row.multilingual_blurb) as Record<string, string>,
    latitude: nullable(row.latitude),
    longitude: nullable(row.longitude),
    walkingDirectionsHint: nullable(row.walking_directions),
    active: row.active === 1,
    source: row.source as Location["source"],
    updatedAt: row.updated_at,
  };
}

export function locationToRow(loc: Location): LocationRow {
  return {
    key: loc.key,
    name: loc.name,
    category: loc.category,
    hotline: loc.hotline ?? null,
    address: loc.address ?? null,
    url: loc.url ?? null,
    opening_hours: loc.openingHours ?? null,
    multilingual_blurb: JSON.stringify(loc.multilingualBlurb ?? {}),
    latitude: loc.latitude ?? null,
    longitude: loc.longitude ?? null,
    walking_directions: loc.walkingDirectionsHint ?? null,
    active: loc.active ? 1 : 0,
    source: loc.source,
    updated_at: loc.updatedAt,
  };
}

export function rowToSessionCase(row: SessionCaseRow): SessionCase {
  return {
    id: row.id,
    sessionId: row.session_id,
    kioskId: row.kiosk_id,
    srcLang: row.src_lang,
    requestType: row.request_type as SessionCaseRequestType,
    history: JSON.parse(row.history_json) as SessionCaseHistoryEntry[],
    toolCalls: JSON.parse(row.tool_calls_json) as SessionCaseToolCall[],
    kioskMessage: row.kiosk_message,
    receiptId: nullable(row.receipt_id),
    hazardReferenceId: nullable(row.hazard_reference_id),
    signpostedAgencyKey: nullable(row.signposted_agency_key),
    createdAt: row.created_at,
  };
}

export function sessionCaseToRow(c: SessionCase): SessionCaseRow {
  return {
    id: c.id,
    session_id: c.sessionId,
    kiosk_id: c.kioskId,
    src_lang: c.srcLang,
    request_type: c.requestType,
    history_json: JSON.stringify(c.history),
    tool_calls_json: JSON.stringify(c.toolCalls),
    kiosk_message: c.kioskMessage,
    receipt_id: c.receiptId ?? null,
    hazard_reference_id: c.hazardReferenceId ?? null,
    signposted_agency_key: c.signpostedAgencyKey ?? null,
    created_at: c.createdAt,
  };
}

export function rowToSessionReceipt(row: SessionReceiptRow): SessionReceipt {
  return {
    id: row.id,
    sessionId: row.session_id,
    language: row.language,
    body: row.body,
    thingsToBring: JSON.parse(row.things_to_bring_json) as string[],
    caseSummary: nullable(row.case_summary),
    signpostedAgencyKey: nullable(row.signposted_agency_key),
    hazardReferenceId: nullable(row.hazard_reference_id),
    generatedAt: row.generated_at,
  };
}

export function sessionReceiptToRow(r: SessionReceipt): SessionReceiptRow {
  return {
    id: r.id,
    session_id: r.sessionId,
    language: r.language,
    body: r.body,
    things_to_bring_json: JSON.stringify(r.thingsToBring ?? []),
    case_summary: r.caseSummary ?? null,
    signposted_agency_key: r.signpostedAgencyKey ?? null,
    hazard_reference_id: r.hazardReferenceId ?? null,
    generated_at: r.generatedAt,
  };
}
