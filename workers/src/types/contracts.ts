// workers/src/types/contracts.ts
//
// Worker-side data contracts. The shapes shared with the frontend live in
// ./contracts.shared (the SSOT — edit shared types there). This file re-exports
// them and adds the worker-only types: the tool-result envelope, KV-backed
// session state, and the audit-log row. Consumers keep importing everything
// from "../types/contracts" unchanged.

export type * from "./contracts.shared";

import type { ToolError, ToolName } from "./contracts.shared";

// ---------------------------------------------------------------------------
// Tool result envelope (worker-internal; the frontend sees ToolInvocationSummary)
// ---------------------------------------------------------------------------

export type ToolResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: ToolError };

// ---------------------------------------------------------------------------
// KV-backed session state (worker-only)
// ---------------------------------------------------------------------------

export type KioskSessionMessage = {
  role: "user" | "kiosk";
  textEnglish: string;
  spokenAt: string;
};

export type KioskSession = {
  id: string;
  kioskId: string;
  history: KioskSessionMessage[];
  srcLang?: string;
  startedAt: string;
};

// ---------------------------------------------------------------------------
// Audit log (worker-only; optional for the demo, cheap to keep)
// ---------------------------------------------------------------------------

export type ToolInvocation = {
  id: string;
  sessionId: string;
  toolName: ToolName;
  argumentsJson: string;
  resultJson: string;
  startedAt: string;
  completedAt: string;
  success: boolean;
  errorMessage?: string;
};
