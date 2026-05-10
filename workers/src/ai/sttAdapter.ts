// workers/src/ai/sttAdapter.ts
//
// Speech-to-Text adapter. Returns an STTResult { transcript_en, srcLang }.
// Per spec §3 the adapter is responsible for both transcription AND language
// detection. Cloudflare Workers AI Whisper auto-detects; if it doesn't surface
// the language, we fall back to a Unicode-range heuristic. If the detected
// language is anything other than English we translate the raw transcript via
// the SEALion translateAdapter so the orchestrator always sees English.
//
// Mock-mode walks a fixture sequence so offline demos / tests are deterministic.

import type { STTResult } from "../types/contracts";
import { translateAdapter, type TranslateEnv } from "./translateAdapter";

export type SttInput = {
  audio: ArrayBuffer;
};

export type SttEnv = TranslateEnv & {
  AI?: {
    run: (
      model: string,
      input: unknown,
    ) => Promise<{ text?: string; language?: string }>;
  };
  STT_MOCK?: string; // "true" forces mock-mode
};

const MOCK_FIXTURES: STTResult[] = [
  // Demo §8.1 — routing
  { transcript_en: "where do I get my eye checked", srcLang: "zh-Hans" },
  { transcript_en: "polyclinic", srcLang: "zh-Hans" },
  // Demo §8.2 — hazard
  {
    transcript_en: "the light at my void deck is broken, someone will fall",
    srcLang: "en",
  },
  // Demo §8.3 — MP escalation
  {
    transcript_en: "my wife and I keep fighting about the flat",
    srcLang: "zh-Hans",
  },
  { transcript_en: "we want to sell but she won't agree", srcLang: "zh-Hans" },
  { transcript_en: "no, I don't know who to talk to", srcLang: "zh-Hans" },
];

let mockCallIndex = 0;

function isMockMode(env: SttEnv): boolean {
  if (env.STT_MOCK === "true") return true;
  if (!env.AI) return true;
  return false;
}

// Whisper returns either ISO codes ("en", "zh") or full names ("English",
// "Chinese") depending on the model variant. Normalise both to the BCP-47
// tags we use elsewhere in the pipeline.
function normaliseLang(lang: string): string {
  const lower = lang.toLowerCase().trim();
  if (!lower) return "en";
  if (lower === "english" || lower === "en" || lower.startsWith("en-")) return "en";
  if (lower.startsWith("zh") || lower === "chinese" || lower === "mandarin") {
    return "zh-Hans";
  }
  if (lower === "ms" || lower === "malay" || lower.startsWith("ms-")) return "ms";
  if (lower === "ta" || lower === "tamil" || lower.startsWith("ta-")) return "ta";
  return lang;
}

// Used only when Whisper omits a language field. Crude but Singapore-realistic.
function detectLanguageHeuristic(text: string): string {
  if (/[一-鿿]/.test(text)) return "zh-Hans"; // CJK Unified Ideographs
  if (/[஀-௿]/.test(text)) return "ta"; // Tamil block
  return "en";
}

export async function sttAdapter(
  input: SttInput,
  env: SttEnv,
): Promise<STTResult> {
  if (isMockMode(env)) {
    const fixture = MOCK_FIXTURES[mockCallIndex % MOCK_FIXTURES.length];
    mockCallIndex++;
    return { ...fixture };
  }

  const result = await env.AI!.run("@cf/openai/whisper", {
    audio: Array.from(new Uint8Array(input.audio)),
  });

  const rawText = (result.text ?? "").trim();
  const srcLang = result.language
    ? normaliseLang(result.language)
    : detectLanguageHeuristic(rawText);

  // Translate to English when the source isn't already English.
  let transcript_en = rawText;
  if (rawText && srcLang !== "en") {
    try {
      const t = await translateAdapter(
        { text: rawText, from: srcLang, to: "en" },
        env,
      );
      transcript_en = t.translated;
    } catch {
      // Surface the raw text so the demo continues. The classifier will see
      // a non-English transcript but the orchestrator will still translate
      // the kiosk's reply back to srcLang for TTS.
      transcript_en = rawText;
    }
  }

  return { transcript_en, srcLang };
}

// Tests / orchestrator session resets.
export function resetMockState(): void {
  mockCallIndex = 0;
}
