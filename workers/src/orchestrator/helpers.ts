// workers/src/orchestrator/helpers.ts
//
// Stateless helpers for the six-stage orchestrator (see ./index): session
// construction, tool-result bookkeeping, the stage 5 translate/TTS calls, and
// the audio/error encoding utilities. Kept separate so ./index reads as the
// flow and nothing else.

import type {
  GenerateReceiptResult,
  KioskSession,
  ReportHazardResult,
  SignpostResult,
  ToolInvocationSummary,
  ToolResult,
  TurnResponse,
} from "../types/contracts";
import { ttsAdapter, type TtsEnv } from "../ai/ttsAdapter";
import { translateAdapter, type TranslateEnv } from "../ai/translateAdapter";
import { type ToolCtx } from "../tools/registry";

export function summariseInvocation(
  call: { name: "signpost" | "reportHazard" | "generateReceipt"; args: unknown },
  result: ToolResult,
): ToolInvocationSummary {
  if (result.ok) {
    return {
      name: call.name,
      args: call.args,
      ok: true,
      data: result.data,
    } as ToolInvocationSummary;
  }
  return { name: call.name, args: call.args, ok: false, error: result.error };
}

export function newSession(id: string, kioskId: string): KioskSession {
  return {
    id,
    kioskId,
    history: [],
    startedAt: new Date().toISOString(),
  };
}

export function newSessionId(): string {
  const runtimeCrypto = globalThis.crypto as Crypto | undefined;
  if (runtimeCrypto?.randomUUID) {
    return `kiosk-${runtimeCrypto.randomUUID()}`;
  }
  if (runtimeCrypto?.getRandomValues) {
    const bytes = new Uint8Array(16);
    runtimeCrypto.getRandomValues(bytes);
    const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
    return `kiosk-${hex}`;
  }
  throw new Error("Secure session ID generation is unavailable in this runtime.");
}

export function capturePriorResult(
  ctx: ToolCtx,
  name: "signpost" | "reportHazard" | "generateReceipt",
  result: ToolResult,
): void {
  if (!result.ok) return;
  if (name === "signpost") {
    ctx.priorToolResults.signpost = result.data as SignpostResult;
  } else if (name === "reportHazard") {
    ctx.priorToolResults.reportHazard = result.data as ReportHazardResult;
  } else if (name === "generateReceipt") {
    ctx.priorToolResults.generateReceipt = result.data as GenerateReceiptResult;
  }
}

export async function translateForUser(
  textEn: string,
  srcLang: string,
  env: TranslateEnv,
): Promise<string> {
  if (srcLang === "en" || srcLang.startsWith("en-")) return textEn;
  try {
    const t = await translateAdapter({ text: textEn, from: "en", to: srcLang }, env);
    return t.translated;
  } catch {
    return textEn; // demo continues in English if SEALion is down
  }
}

export async function synthesise(
  text: string,
  language: string,
  env: TtsEnv,
): Promise<string | undefined> {
  try {
    const tts = await ttsAdapter({ text, language }, env);
    if (tts.audioUrl) return tts.audioUrl;
    if (tts.audioBase64) return `data:audio/mpeg;base64,${tts.audioBase64}`;
    return undefined;
  } catch {
    return undefined;
  }
}

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

export function errorResponse(
  sessionId: string,
  srcLang: string,
  code: string,
  message: string,
): TurnResponse {
  return {
    sessionId,
    state: "done",
    transcript: { english: "", srcLang },
    kioskMessage: "Sorry, I could not process that. Please try again.",
    error: { code, message, fallbackAvailable: true },
  };
}
