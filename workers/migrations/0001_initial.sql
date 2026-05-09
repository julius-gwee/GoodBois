-- 0001_initial.sql
-- Creates the three core D1 tables for the GoodBois kiosk:
--   locations  — agency directory (formerly AgencyContact)
--   cases      — one row per terminated kiosk session (audit trail)
--   receipts   — bilingual printable artifact backing GET /receipts/:id
--
-- Foreign keys are enforced on every connection via PRAGMA in app code.
-- See workers/src/db/d1/index.ts.

CREATE TABLE locations (
  key                   TEXT PRIMARY KEY,
  name                  TEXT NOT NULL,
  category              TEXT NOT NULL,
  hotline               TEXT,
  address               TEXT,
  url                   TEXT,
  opening_hours         TEXT,
  multilingual_blurb    TEXT NOT NULL DEFAULT '{}',
  latitude              REAL,
  longitude             REAL,
  walking_directions    TEXT,
  active                INTEGER NOT NULL DEFAULT 1,
  source                TEXT NOT NULL DEFAULT 'seed',
  updated_at            TEXT NOT NULL,

  CHECK (category IN (
    'housing','transport','healthcare','social_services','legal',
    'financial_assistance','elderly_activity','digital_help',
    'mp_meet_the_people','rc_visit','town_council','hazard_authority','other'
  )),
  CHECK (source IN ('seed','partner','official')),
  CHECK (active IN (0, 1)),
  CHECK (
    (latitude IS NULL AND longitude IS NULL) OR
    (latitude  BETWEEN -90  AND 90 AND
     longitude BETWEEN -180 AND 180)
  )
);

CREATE INDEX idx_locations_category_active ON locations(category, active);

CREATE TABLE receipts (
  id                    TEXT PRIMARY KEY,
  session_id            TEXT NOT NULL,
  language              TEXT NOT NULL,
  body                  TEXT NOT NULL,
  things_to_bring_json  TEXT NOT NULL DEFAULT '[]',
  case_summary          TEXT,
  signposted_agency_key TEXT,
  hazard_reference_id   TEXT,
  generated_at          TEXT NOT NULL,

  FOREIGN KEY (signposted_agency_key) REFERENCES locations(key) ON DELETE SET NULL
);

CREATE TABLE cases (
  id                    TEXT PRIMARY KEY,
  session_id            TEXT NOT NULL,
  kiosk_id              TEXT NOT NULL,
  src_lang              TEXT NOT NULL,
  request_type          TEXT NOT NULL,
  history_json          TEXT NOT NULL,
  tool_calls_json       TEXT NOT NULL,
  kiosk_message         TEXT NOT NULL,
  receipt_id            TEXT,
  hazard_reference_id   TEXT,
  signposted_agency_key TEXT,
  created_at            TEXT NOT NULL,

  CHECK (request_type IN ('signpost','report_hazard','out_of_scope')),
  FOREIGN KEY (receipt_id)            REFERENCES receipts(id)  ON DELETE SET NULL,
  FOREIGN KEY (signposted_agency_key) REFERENCES locations(key) ON DELETE SET NULL
);

CREATE INDEX idx_cases_created_at ON cases(created_at);
CREATE INDEX idx_cases_session_id ON cases(session_id);
