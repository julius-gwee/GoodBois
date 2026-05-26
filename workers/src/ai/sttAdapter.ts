// workers/src/ai/sttAdapter.ts
//
// Speech-to-Text adapter. Returns an STTResult { transcript_en, srcLang }.
// Per spec §3 the adapter is responsible for both transcription AND language
// detection.
//
// Whisper transcribes audio, but its `language` field is unreliable for short
// Romanized SEA inputs (e.g. Bahasa Melayu mis-tagged as English). We pass the
// raw transcript + Whisper's guess to SEALion's `identifyLanguage`, which
// reads the actual content. If SEALion isn't configured, we fall back to a
// keyword/Unicode heuristic. Once we have a real srcLang, the raw transcript
// is translated to English via SEALion so the orchestrator always sees English.
//
// Mock-mode walks a fixture sequence so offline demos / tests are deterministic.

import type { STTResult } from "../types/contracts";
import {
  identifyLanguage,
  translateAdapter,
  type TranslateEnv,
} from "./translateAdapter";
import { isMockMode } from "./mockMode";

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

export async function sttAdapter(
  input: SttInput,
  env: SttEnv,
): Promise<STTResult> {
  if (isMockMode(env.STT_MOCK, Boolean(env.AI))) {
    const fixture = MOCK_FIXTURES[mockCallIndex % MOCK_FIXTURES.length];
    mockCallIndex++;
    return { ...fixture };
  }

  const result = await env.AI!.run("@cf/openai/whisper", {
    audio: Array.from(new Uint8Array(input.audio)),
  });

  const rawText = (result.text ?? "").trim();

  // Whisper's `language` is a hint, not authority. SEALion reads the actual
  // text and returns one of {en, zh-Hans, ms, ta}. Falls back to a Unicode +
  // Malay-keyword heuristic when SEALion is mocked / unreachable.
  const srcLang = await identifyLanguage(
    { text: rawText, hint: result.language },
    env,
  );

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
