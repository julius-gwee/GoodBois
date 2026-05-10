// workers/src/ai/ttsAdapter.ts
//
// Text-to-Speech adapter. Mock-mode returns no audioUrl (frontend uses
// browser Web Speech as fallback or runs silent); real-mode calls
// Cloudflare Workers AI MeloTTS.

export type TtsInput = {
  text: string;
  language: string; // BCP-47
};

export type TtsResult = {
  audioUrl?: string;
  audioBase64?: string;
};

export type TtsEnv = {
  AI?: {
    run: (model: string, input: unknown) => Promise<ArrayBuffer | { audio: string }>;
  };
  TTS_MOCK?: string;
};

// Workers AI MeloTTS expects "en" / "zh" style codes; map BCP-47 down.
function toMeloLang(bcp47: string): string {
  // Hokkien / Cantonese have no MeloTTS voice — best fallback is Mandarin
  // since the chrome strings are written in Hanzi anyway. The chat reply is
  // SEALion-translated into the dialect; spoken output will sound Mandarin.
  if (bcp47 === "nan" || bcp47.startsWith("nan-")) return "zh";
  if (bcp47 === "yue" || bcp47.startsWith("yue-")) return "zh";
  if (bcp47.startsWith("zh")) return "zh";
  if (bcp47.startsWith("ms")) return "en"; // MeloTTS lacks Malay; English fallback
  if (bcp47.startsWith("ta")) return "en"; // MeloTTS lacks Tamil; English fallback
  return "en";
}

function isMockMode(env: TtsEnv): boolean {
  if (env.TTS_MOCK === "true") return true;
  if (!env.AI) return true;
  return false;
}

export async function ttsAdapter(
  input: TtsInput,
  env: TtsEnv
): Promise<TtsResult> {
  if (isMockMode(env)) {
    return {}; // no audio in mock mode; frontend handles silence
  }

  const result = await env.AI!.run("@cf/myshell-ai/melotts", {
    prompt: input.text,
    lang: toMeloLang(input.language),
  });

  if (result instanceof ArrayBuffer) {
    const bytes = new Uint8Array(result);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);
    return { audioBase64: base64 };
  }

  if (typeof result === "object" && result !== null && "audio" in result) {
    return { audioBase64: result.audio };
  }

  return {};
}
