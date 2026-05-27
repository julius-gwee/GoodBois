// D1 row shapes (snake_case columns) returned by the SQL driver.
// Row types stay in sync with migrations/0001_initial.sql columns.
// Location and Receipt domain types come from ../../types/contracts directly.

export type LocationRow = {
  key: string;
  name: string;
  category: string;
  hotline: string | null;
  address: string | null;
  url: string | null;
  opening_hours: string | null;
  multilingual_blurb: string;     // JSON-encoded Record<string, string>
  latitude: number | null;
  longitude: number | null;
  walking_directions: string | null;
  active: number;                  // 0 | 1
  source: string;
  updated_at: string;
};

export type ReceiptRow = {
  id: string;
  session_id: string;
  language: string;
  body: string;
  things_to_bring_json: string;    // JSON-encoded string[]
  case_summary: string | null;
  signposted_agency_key: string | null;
  hazard_reference_id: string | null;
  generated_at: string;
};
