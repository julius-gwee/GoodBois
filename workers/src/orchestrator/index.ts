// workers/src/orchestrator/index.ts
//
// Six-stage flow per docs/refactor/2026-05-09-llm-turn-decision.md §2.
//
//   1. STT                         audio → { transcript_en, srcLang }
//   2. Classifier loop             one call per /turn invocation; if ask_followup,
//                                  persist session + return state="followup"
//   3. Main LLM (retry guard)      LLMTurnDecision with mandatory generateReceipt
//   4. Tool dispatch               registry.invokeTool walks toolCalls in order
//   5. Translate kioskMessage + TTS
//   6. Respond + KV reset          delete session so the next user starts fresh
//
// The orchestrator is a dumb dispatcher. No business logic about which tool
// runs when — that's the LLM's job. The only invariants the orchestrator owns
// are session state, tool ordering, and the receipt-mandatory guard (which
// itself lives in the main agent).

import type {
  GenerateReceiptResult,
  KioskSession,
  ToolInvocationSummary,
  TurnRequest,
  TurnResponse,
} from "../types/contracts";
import { sttAdapter, type SttEnv } from "../ai/sttAdapter";
import { type TtsEnv } from "../ai/ttsAdapter";
import { type TranslateEnv } from "../ai/translateAdapter";
import { type LlmEnv } from "../ai/llmAdapter";
import { runClassifier } from "../agents/classifier";
import { runMainAgent } from "../agents/main";
import { invokeTool, type ToolCtx } from "../tools/registry";
import type { Repos } from "../db/repos";
import type { HazardMailer } from "../integrations/email";
import {
  base64ToArrayBuffer,
  capturePriorResult,
  errorResponse,
  newSession,
  newSessionId,
  summariseInvocation,
  synthesise,
  translateForUser,
} from "./helpers";

export type OrchestratorEnv = SttEnv & TtsEnv & TranslateEnv & LlmEnv;

export type OrchestratorDeps = {
  repos: Repos;
  workerUrl: string;
  hazardMailer?: HazardMailer;
};

export async function orchestrate(
  req: TurnRequest,
  env: OrchestratorEnv,
  deps: OrchestratorDeps,
): Promise<TurnResponse> {
  const sessionId = req.sessionId ?? newSessionId();

  // Load existing session or start a fresh one.
  const session =
    (req.sessionId ? await deps.repos.sessions.get(req.sessionId) : null) ??
    newSession(sessionId, req.kioskId);

  // ---------------------------------------------------------------------
  // Stage 1 — STT (or text fallback)
  // ---------------------------------------------------------------------
  let transcriptEn: string;
  let srcLang: string;

  if (req.audioBase64) {
    try {
      const audio = base64ToArrayBuffer(req.audioBase64);
      const stt = await sttAdapter({ audio }, env);
      transcriptEn = stt.transcript_en;
      srcLang = stt.srcLang;
    } catch (e) {
      return errorResponse(
        sessionId,
        session.srcLang ?? "en",
        "STT_FAILED",
        e instanceof Error ? e.message : String(e),
      );
    }
  } else if (req.text) {
    transcriptEn = req.text;
    srcLang = session.srcLang ?? "en";
  } else {
    return errorResponse(
      sessionId,
      session.srcLang ?? "en",
      "MISSING_INPUT",
      "Either audioBase64 or text must be provided.",
    );
  }

  // First STT result locks the session's source language.
  if (!session.srcLang) session.srcLang = srcLang;

  // history holds *prior* turns. The classifier and main-LLM adapters
  // append `transcriptEn` themselves as the final user message — pushing it
  // here too would put two consecutive user-role messages into the chat,
  // which SEALion rejects with 400.

  // ---------------------------------------------------------------------
  // Stage 2 — Classifier
  // ---------------------------------------------------------------------
  const classification = await runClassifier(
    { transcriptEn, history: session.history },
    env,
  );

  if (
    classification.requestType === "ask_followup" &&
    classification.followupPrompt
  ) {
    return handleFollowup(
      session,
      transcriptEn,
      classification.followupPrompt,
      env,
      deps,
    );
  }

  // Classifier returned a terminal type — fall through to the main agent.
  // (ask_followup with empty prompt is downgraded to out_of_scope inside
  //  the classifier agent itself, so we never hit it here.)
  const requestType =
    classification.requestType === "ask_followup"
      ? "out_of_scope"
      : classification.requestType;

  // ---------------------------------------------------------------------
  // Stage 3 — Main LLM (with retry guard)
  // ---------------------------------------------------------------------
  const agencies = await deps.repos.agencies.list({ activeOnly: true });
  const agencyKeys = agencies.map((a) => a.key);

  const decision = await runMainAgent(
    {
      requestType,
      transcriptEn,
      history: session.history,
      agencyKeys,
      srcLang: session.srcLang,
    },
    env,
  );

  // ---------------------------------------------------------------------
  // Stage 4 — Tool dispatch (in array order, no business logic)
  // ---------------------------------------------------------------------
  const ctx: ToolCtx = {
    repos: deps.repos,
    workerUrl: deps.workerUrl,
    sessionId,
    srcLang: session.srcLang,
    kioskId: session.kioskId,
    hazardMailer: deps.hazardMailer,
    priorToolResults: {},
  };

  let receiptUrl: string | undefined;
  const toolCalls: ToolInvocationSummary[] = [];
  for (const call of decision.toolCalls) {
    const result = await invokeTool(call, ctx);
    toolCalls.push(summariseInvocation(call, result));
    if (result.ok) {
      capturePriorResult(ctx, call.name, result);
      if (call.name === "generateReceipt") {
        receiptUrl = (result.data as GenerateReceiptResult).url;
      }
    }
    // Tool errors are swallowed — the demo continues with the rest of the
    // toolCalls. The receipt is the user-visible artefact; if it failed
    // receiptUrl stays undefined and the frontend handles the absence.
  }

  // ---------------------------------------------------------------------
  // Stage 5 — Translate kioskMessage + TTS
  // ---------------------------------------------------------------------
  const kioskMessageUserLang = await translateForUser(
    decision.kioskMessage,
    session.srcLang,
    env,
  );
  const audioUrl = await synthesise(kioskMessageUserLang, session.srcLang, env);

  // ---------------------------------------------------------------------
  // Stage 6 — Respond + KV reset
  // ---------------------------------------------------------------------
  await deps.repos.sessions.delete(sessionId);

  return {
    sessionId,
    state: "done",
    transcript: { english: transcriptEn, srcLang: session.srcLang },
    kioskMessage: kioskMessageUserLang,
    audioUrl,
    receiptUrl,
    toolCalls,
  };
}

// ---------------------------------------------------------------------------
// Followup branch
// ---------------------------------------------------------------------------

async function handleFollowup(
  session: KioskSession,
  transcriptEn: string,
  followupPromptEn: string,
  env: OrchestratorEnv,
  deps: OrchestratorDeps,
): Promise<TurnResponse> {
  const srcLang = session.srcLang ?? "en";
  const promptUserLang = await translateForUser(followupPromptEn, srcLang, env);
  const audioUrl = await synthesise(promptUserLang, srcLang, env);

  // Persist both sides of this turn so the next /turn invocation's classifier
  // sees the full conversation context.
  const now = new Date().toISOString();
  session.history.push(
    { role: "user", textEnglish: transcriptEn, spokenAt: now },
    { role: "kiosk", textEnglish: followupPromptEn, spokenAt: now },
  );

  await deps.repos.sessions.put(session);

  return {
    sessionId: session.id,
    state: "followup",
    transcript: { english: transcriptEn, srcLang },
    kioskMessage: promptUserLang,
    audioUrl,
  };
}
