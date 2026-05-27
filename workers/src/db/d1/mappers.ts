import type { AgencyContact, Receipt } from "../../types/contracts";
import type { LocationRow, ReceiptRow } from "./types";
import type { AgencyCategory } from "../../types/contracts";

function nullable<T>(v: T | null | undefined): T | undefined {
  return v === null || v === undefined ? undefined : v;
}

export function rowToAgency(row: LocationRow): AgencyContact {
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
    source: row.source as AgencyContact["source"],
    updatedAt: row.updated_at,
  };
}

export function agencyToRow(agency: AgencyContact): LocationRow {
  return {
    key: agency.key,
    name: agency.name,
    category: agency.category,
    hotline: agency.hotline ?? null,
    address: agency.address ?? null,
    url: agency.url ?? null,
    opening_hours: agency.openingHours ?? null,
    multilingual_blurb: JSON.stringify(agency.multilingualBlurb ?? {}),
    latitude: agency.latitude ?? null,
    longitude: agency.longitude ?? null,
    walking_directions: agency.walkingDirectionsHint ?? null,
    active: agency.active ? 1 : 0,
    source: agency.source,
    updated_at: agency.updatedAt,
  };
}

export function rowToReceipt(row: ReceiptRow): Receipt {
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

export function receiptToRow(r: Receipt): ReceiptRow {
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
