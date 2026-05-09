-- GoodBois D1 schema — initial migration.
-- D1 is SQLite. Booleans are stored as INTEGER (0/1). JSON values are stored as TEXT.
-- All timestamps are ISO 8601 strings (UTC or +08:00).
-- Re-running this migration is safe (every CREATE uses IF NOT EXISTS).

CREATE TABLE IF NOT EXISTS AgencyContact (
  key TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  hotline TEXT,
  address TEXT,
  url TEXT,
  openingHours TEXT,
  category TEXT NOT NULL,
  multilingualBlurb TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  source TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_agency_category_active ON AgencyContact(category, active);

CREATE TABLE IF NOT EXISTS KioskSession (
  id TEXT PRIMARY KEY,
  kioskId TEXT NOT NULL,
  userLanguage TEXT NOT NULL,
  startedAt TEXT NOT NULL,
  endedAt TEXT,
  outcome TEXT NOT NULL,
  caseId TEXT,
  receiptId TEXT
);

CREATE INDEX IF NOT EXISTS idx_session_kiosk ON KioskSession(kioskId);

CREATE TABLE IF NOT EXISTS Utterance (
  id TEXT PRIMARY KEY,
  sessionId TEXT NOT NULL,
  role TEXT NOT NULL,
  mode TEXT NOT NULL,
  textOriginal TEXT NOT NULL,
  textEnglish TEXT,
  language TEXT NOT NULL,
  spokenAt TEXT NOT NULL,
  FOREIGN KEY (sessionId) REFERENCES KioskSession(id)
);

CREATE INDEX IF NOT EXISTS idx_utterance_session ON Utterance(sessionId);

CREATE TABLE IF NOT EXISTS TriageResult (
  id TEXT PRIMARY KEY,
  sessionId TEXT NOT NULL,
  outcome TEXT NOT NULL,
  confidence TEXT NOT NULL,
  selectedToolName TEXT,
  selectedAgencyKey TEXT,
  followupQuestion TEXT,
  reasoningSummary TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  FOREIGN KEY (sessionId) REFERENCES KioskSession(id)
);

CREATE INDEX IF NOT EXISTS idx_triage_session ON TriageResult(sessionId);

CREATE TABLE IF NOT EXISTS ToolInvocation (
  id TEXT PRIMARY KEY,
  sessionId TEXT NOT NULL,
  toolName TEXT NOT NULL,
  argumentsJson TEXT NOT NULL,
  resultJson TEXT NOT NULL,
  startedAt TEXT NOT NULL,
  completedAt TEXT NOT NULL,
  success INTEGER NOT NULL,
  errorMessage TEXT
);

CREATE INDEX IF NOT EXISTS idx_toolinvocation_session ON ToolInvocation(sessionId);

-- "Case" is quoted because CASE is a SQL reserved word.
CREATE TABLE IF NOT EXISTS "Case" (
  id TEXT PRIMARY KEY,
  sessionId TEXT NOT NULL,
  language TEXT NOT NULL,
  summaryEnglish TEXT NOT NULL,
  summaryUserLanguage TEXT,
  transcript TEXT NOT NULL,
  suggestedNextSteps TEXT NOT NULL,
  residentBlock TEXT,
  residentUnit TEXT,
  residentNameAlias TEXT,
  kioskId TEXT NOT NULL,
  status TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  exportedAt TEXT,
  exportChannel TEXT
);

CREATE INDEX IF NOT EXISTS idx_case_status ON "Case"(status);
CREATE INDEX IF NOT EXISTS idx_case_session ON "Case"(sessionId);

CREATE TABLE IF NOT EXISTS Receipt (
  id TEXT PRIMARY KEY,
  sessionId TEXT NOT NULL,
  caseId TEXT,
  language TEXT NOT NULL,
  pdfUrl TEXT NOT NULL,
  generatedAt TEXT NOT NULL,
  FOREIGN KEY (caseId) REFERENCES "Case"(id)
);

CREATE INDEX IF NOT EXISTS idx_receipt_session ON Receipt(sessionId);
