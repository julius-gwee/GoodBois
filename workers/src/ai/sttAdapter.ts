// workers/src/ai/sttAdapter.ts
//
// Speech-to-Text adapter. Mock-mode returns canned Mandarin demo transcripts;
// real-mode calls Cloudflare Workers AI Whisper.

export type SttInput = {
  audio: ArrayBuffer;
  language: string; // BCP-47, e.g. "zh-Hans" | "en"
};

export type SttResult = {
  transcript: string;
  detectedLanguage?: string;
};

export type SttEnv = {
  AI?: {
    run: (model: string, input: unknown) => Promise<{ text: string }>;
  };
  STT_MOCK?: string; // "true" forces mock-mode
};

const MOCK_TRANSCRIPTS: Record<string, string[]> = {
  "zh-Hans": [
    "我的电梯坏了，我没办法去医院洗肾。",
    "Block 123，八楼。",
  ],
  en: [
    "My lift is broken and I cannot go to the hospital for dialysis.",
    "Block 123, level 8.",
  ],
};

let mockCallIndex = 0;

function isMockMode(env: SttEnv): boolean {
  if (env.STT_MOCK === "true") return true;
  if (!env.AI) return true;
  return false;
}

export async function sttAdapter(
  input: SttInput,
  env: SttEnv
): Promise<SttResult> {
  if (isMockMode(env)) {
    const lang = input.language in MOCK_TRANSCRIPTS ? input.language : "zh-Hans";
    const candidates = MOCK_TRANSCRIPTS[lang];
    const transcript = candidates[mockCallIndex % candidates.length];
    mockCallIndex++;
    return { transcript, detectedLanguage: lang };
  }

  const result = await env.AI!.run("@cf/openai/whisper", {
    audio: Array.from(new Uint8Array(input.audio)),
  });

  return { transcript: result.text };
}

// For tests / orchestrator session resets.
export function resetMockState(): void {
  mockCallIndex = 0;
}
