import { describe, it, expect, beforeEach } from "vitest";
import { sttAdapter, resetMockState, type SttEnv } from "./sttAdapter";

const emptyAudio = new ArrayBuffer(0);

describe("sttAdapter (mock)", () => {
  beforeEach(() => resetMockState());

  it("returns the new STTResult shape", async () => {
    const r = await sttAdapter({ audio: emptyAudio }, { STT_MOCK: "true" });
    expect(typeof r.transcript_en).toBe("string");
    expect(typeof r.srcLang).toBe("string");
  });

  it("walks the fixture sequence on successive calls", async () => {
    const env: SttEnv = { STT_MOCK: "true" };
    const a = await sttAdapter({ audio: emptyAudio }, env);
    const b = await sttAdapter({ audio: emptyAudio }, env);
    expect(a.transcript_en).not.toBe(b.transcript_en);
  });
});

describe("sttAdapter (real-mode glue)", () => {
  // Fake AI binding lets us exercise the language-detection + translation
  // paths without hitting Whisper or SEALion.
  function makeFakeAi(text: string, language?: string): SttEnv["AI"] {
    return {
      async run() {
        return { text, language };
      },
    };
  }

  it("passes English transcripts through untouched", async () => {
    const env: SttEnv = {
      AI: makeFakeAi("hello there", "en"),
      // No SEALION_API_KEY — translateAdapter is in mock mode and would no-op
      // anyway, but English short-circuits before that.
    };
    const r = await sttAdapter({ audio: emptyAudio }, env);
    expect(r.transcript_en).toBe("hello there");
    expect(r.srcLang).toBe("en");
  });

  it("normalises Whisper's full-name language outputs to BCP-47 base tags", async () => {
    const env: SttEnv = {
      AI: makeFakeAi("hello", "English"),
    };
    const r = await sttAdapter({ audio: emptyAudio }, env);
    expect(r.srcLang).toBe("en");
  });

  it("falls back to a unicode-range heuristic when language is omitted", async () => {
    const env: SttEnv = {
      AI: makeFakeAi("我的电梯坏了", undefined),
    };
    const r = await sttAdapter({ audio: emptyAudio }, env);
    expect(r.srcLang).toBe("zh-Hans");
  });

  it("attempts to translate non-English transcripts (mock translate is a passthrough so we just check srcLang)", async () => {
    const env: SttEnv = {
      AI: makeFakeAi("Block 123，八楼。", "zh"),
    };
    const r = await sttAdapter({ audio: emptyAudio }, env);
    expect(r.srcLang).toBe("zh-Hans");
    // translateAdapter mock-mode returns the input unchanged when no fixture
    // matches; just confirm we got a string back.
    expect(typeof r.transcript_en).toBe("string");
    expect(r.transcript_en.length).toBeGreaterThan(0);
  });

  it("overrules Whisper when it mis-tags Romanized Malay as English (heuristic fallback)", async () => {
    // No SEALION_API_KEY → identifyLanguage falls back to its keyword heuristic,
    // which catches "saya / mahu / pergi / tandas" and returns "ms" even though
    // Whisper called the audio English.
    const env: SttEnv = {
      AI: makeFakeAi("Pakabas saya mahu pergi ke tandas.", "en"),
    };
    const r = await sttAdapter({ audio: emptyAudio }, env);
    expect(r.srcLang).toBe("ms");
  });

  it("trusts SEALion's identifyLanguage response over Whisper's hint", async () => {
    // Stand up a fake SEALion endpoint. The first call (identifyLanguage)
    // returns "ms"; subsequent calls (translateAdapter) echo a translation.
    const calls: Array<{ system: string; user: string }> = [];
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async (url: string, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body ?? "{}")) as {
        messages: Array<{ role: string; content: string }>;
      };
      const system = body.messages.find((m) => m.role === "system")?.content ?? "";
      const user = body.messages.find((m) => m.role === "user")?.content ?? "";
      calls.push({ system, user });
      const isLangId = system.includes("language identifier");
      return new Response(
        JSON.stringify({
          choices: [
            { message: { content: isLangId ? "ms" : "I want to go to the toilet." } },
          ],
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    }) as typeof fetch;

    try {
      const env: SttEnv = {
        AI: makeFakeAi("Pakabas saya mahu pergi ke tandas.", "en"),
        SEALION_API_KEY: "test-key",
      };
      const r = await sttAdapter({ audio: emptyAudio }, env);
      expect(r.srcLang).toBe("ms");
      expect(r.transcript_en).toBe("I want to go to the toilet.");
      // Two SEALion calls: identifyLanguage then translateAdapter.
      expect(calls.length).toBe(2);
      expect(calls[0].system).toContain("language identifier");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
