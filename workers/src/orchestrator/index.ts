// workers/src/orchestrator/index.ts
//
// Runtime orchestrator for the GoodBois kiosk. Coordinates STT, translation,
// inquiry agent, triage agent, processing (Dev B's runProcessing), TTS, and
// final TurnResponse assembly.

import type {
  AgencyContact,
  TriageOutcome,
  TriageResult,
  TurnRequest,
  TurnResponse,
} from "../types/contracts";
import { sttAdapter, type SttEnv } from "../ai/sttAdapter";
import { ttsAdapter, type TtsEnv } from "../ai/ttsAdapter";
import { translateAdapter, type TranslateEnv } from "../ai/translateAdapter";
import { type LlmEnv } from "../ai/llmAdapter";
import { runInquiry } from "../agents/inquiry";
import { runTriage, type TriageDecision } from "../agents/triage";
import {
  runProcessing,
  type ProcessingOutput,
} from "../agents/processing";
import type { Repos } from "../db/repos";

export type OrchestratorEnv = SttEnv & TtsEnv & TranslateEnv & LlmEnv;

export type OrchestratorDeps = {
  repos: Repos;
  workerUrl: string;
  turnCount?: number;
  kioskId?: string;
};

export async function orchestrate(
  req: TurnRequest,
  env: OrchestratorEnv,
  deps: OrchestratorDeps,
): Promise<TurnResponse> {
  const sessionId = req.sessionId ?? `session-${Date.now()}`;
  const userLang = req.language;
  const turnCount = deps.turnCount ?? 0;

  // 1. Resolve transcript (STT or text input)
  let transcriptOriginal: string;
  if (req.audioBase64) {
    try {
      const audio = base64ToArrayBuffer(req.audioBase64);
      const sttResult = await sttAdapter({ audio, language: userLang }, env);
      transcriptOriginal = sttResult.transcript;
    } catch (e) {
      return errorResponse(sessionId, userLang, "STT_FAILED", String(e));
    }
  } else if (req.text) {
    transcriptOriginal = req.text;
  } else {
    return errorResponse(
      sessionId,
      userLang,
      "MISSING_INPUT",
      "Either audioBase64 or text must be provided.",
    );
  }

  // 2. Translate to English (skip if already English)
  let transcriptEnglish: string;
  if (userLang === "en") {
    transcriptEnglish = transcriptOriginal;
  } else {
    try {
      const t = await translateAdapter(
        { text: transcriptOriginal, from: userLang, to: "en" },
        env,
      );
      transcriptEnglish = t.translated;
    } catch (e) {
      return errorResponse(sessionId, userLang, "TRANSLATE_FAILED", String(e));
    }
  }

  // 3. Inquiry — does the kiosk need to ask one more question?
  const inquiry = await runInquiry(
    { transcriptEnglish, turnCount, language: userLang },
    env,
  );

  if (inquiry.kind === "ask_followup") {
    const questionInUserLang =
      userLang === "en"
        ? inquiry.question
        : (
            await translateAdapter(
              { text: inquiry.question, from: "en", to: userLang },
              env,
            )
          ).translated;

    return {
      sessionId,
      state: "followup",
      transcript: {
        original: transcriptOriginal,
        english: transcriptEnglish,
        language: userLang,
      },
      kioskMessage: {
        original: questionInUserLang,
        english: inquiry.question,
        language: userLang,
      },
      triage: { outcome: "ask_followup", confidence: "high" },
      nextActions: ["listen", "type"],
    };
  }

  // 4. Triage — get a decision, then wrap into a full audit row
  const decision: TriageDecision = await runTriage(
    { transcriptEnglish, language: userLang },
    env,
  );
  const triage: TriageResult = {
    id: `tri-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    sessionId,
    outcome: decision.outcome,
    confidence: decision.confidence,
    selectedToolName: decision.selectedToolName,
    selectedAgencyKey: decision.selectedAgencyKey,
    reasoningSummary: "auto",
    createdAt: new Date().toISOString(),
  };

  // 5. Processing — Dev B's allowlisted tool dispatch
  const processing: ProcessingOutput = await runProcessing(
    {
      sessionId,
      language: userLang,
      triage,
      transcriptEnglish,
      workerUrl: deps.workerUrl,
      kioskId: deps.kioskId,
    },
    deps.repos,
  );

  if (processing.error) {
    return {
      ...errorResponse(
        sessionId,
        userLang,
        processing.error.code,
        processing.error.message,
      ),
      triage: decision,
    };
  }

  // 6. Build the response message in English
  const responseEnglish = buildResponseMessage(decision, processing);

  // 7. Translate response back to user language
  let responseUserLang = responseEnglish;
  if (userLang !== "en") {
    try {
      const t = await translateAdapter(
        { text: responseEnglish, from: "en", to: userLang },
        env,
      );
      responseUserLang = t.translated;
    } catch {
      // If translate-back fails, fall back to English. Demo continues.
      responseUserLang = responseEnglish;
    }
  }

  // 8. TTS (best-effort; mock-mode returns nothing and frontend renders silent)
  let audioUrl: string | undefined;
  try {
    const tts = await ttsAdapter(
      { text: responseUserLang, language: userLang },
      env,
    );
    audioUrl = tts.audioUrl;
  } catch {
    audioUrl = undefined;
  }

  return {
    sessionId,
    state: decision.outcome === "escalate" ? "receipt" : "response",
    transcript: {
      original: transcriptOriginal,
      english: transcriptEnglish,
      language: userLang,
    },
    kioskMessage: {
      original: responseUserLang,
      english: responseEnglish,
      language: userLang,
    },
    triage: decision,
    agencyContact: processing.agencyContact,
    case: processing.case,
    receipt: processing.receipt,
    audioUrl,
    nextActions: nextActionsFor(decision.outcome),
  };
}

function buildResponseMessage(
  decision: TriageDecision,
  processing: ProcessingOutput,
): string {
  const agency: AgencyContact | undefined = processing.agencyContact;

  if (decision.outcome === "signpost" && agency) {
    const blurb = agency.multilingualBlurb.en ?? "";
    return blurb
      ? `I can connect you with ${agency.name}. ${blurb}`
      : `I can connect you with ${agency.name}.`;
  }
  if (decision.outcome === "escalate") {
    return "I have recorded this for the volunteer team to follow up. Please keep this receipt.";
  }
  if (decision.outcome === "out_of_scope" && agency) {
    return `For this, please contact ${agency.name}.`;
  }
  if (decision.outcome === "find_nearby") {
    return "Here are the nearest options I could find.";
  }
  return "I am not sure how to help with that. Let me record this for a volunteer.";
}

function nextActionsFor(outcome: TriageOutcome): TurnResponse["nextActions"] {
  switch (outcome) {
    case "signpost":
      return ["accept_escalation", "decline_escalation", "show_receipt"];
    case "escalate":
      return ["show_receipt", "reset"];
    case "find_nearby":
      return ["accept_escalation", "decline_escalation"];
    case "out_of_scope":
    case "ask_followup":
    default:
      return ["reset"];
  }
}

function errorResponse(
  sessionId: string,
  language: string,
  code: string,
  message: string,
): TurnResponse {
  return {
    sessionId,
    state: "error",
    kioskMessage: {
      original: "Sorry, I could not process that. Please try again.",
      english: "Sorry, I could not process that. Please try again.",
      language,
    },
    nextActions: ["reset"],
    error: { code, message, fallbackAvailable: true },
  };
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}
