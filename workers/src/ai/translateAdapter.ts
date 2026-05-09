// workers/src/ai/translateAdapter.ts
//
// SEALion translation adapter. Mock-mode returns canned demo translations.
// Real-mode calls SEALion's OpenAI-compatible chat completions endpoint with a
// translate-only system prompt.
//
// Also exports `identifyLanguage` — a SEALion-backed language identifier the
// STT adapter uses to overrule Whisper's unreliable `language` field on short
// Romanized SEA inputs (e.g. Bahasa Melayu mis-tagged as English).
//
// SEALion docs: https://sea-lion.ai (subject to change; verify endpoint at integration time).

export type TranslateInput = {
  text: string;
  from: string; // BCP-47
  to: string;   // BCP-47
};

export type TranslateResult = {
  translated: string;
};

export type TranslateEnv = {
  SEALION_API_KEY?: string;
  SEALION_BASE_URL?: string; // override for staging if needed
  TRANSLATE_MOCK?: string;
};

// Languages the kiosk supports end-to-end (STT detection, translation, TTS).
// Anything outside this set falls back to "en" so downstream stages don't blow
// up on unknown locales.
export const SUPPORTED_LANGS = ["en", "zh-Hans", "ms", "ta"] as const;
export type SupportedLang = (typeof SUPPORTED_LANGS)[number];

const MOCK_TRANSLATIONS: Record<string, string> = {
  "我的电梯坏了，我没办法去医院洗肾。|en":
    "My lift is broken and I cannot go to the hospital for dialysis.",
  "Block 123，八楼。|en": "Block 123, level 8.",
  "请问您住在哪一座和哪一层？|en": "Which block and floor do you live at?",
  "好的，请保留 HDB 维修热线。如果之后需要交通援助，可以再来这里。|en":
    "Okay. Please keep the HDB maintenance hotline. If you need transport help later, come back here.",
  "Which block and floor do you live at?|zh-Hans": "请问您住在哪一座和哪一层？",
};

const DEFAULT_BASE_URL = "https://api.sea-lion.ai/v1";

function isMockMode(env: TranslateEnv): boolean {
  if (env.TRANSLATE_MOCK === "true") return true;
  if (!env.SEALION_API_KEY) return true;
  return false;
}

function bcp47ToHumanLang(code: string): string {
  if (code.startsWith("zh")) return "Simplified Chinese";
  if (code.startsWith("ms")) return "Bahasa Melayu";
  if (code.startsWith("ta")) return "Tamil";
  return "English";
}

export async function translateAdapter(
  input: TranslateInput,
  env: TranslateEnv
): Promise<TranslateResult> {
  if (isMockMode(env)) {
    const key = `${input.text}|${input.to}`;
    const cached = MOCK_TRANSLATIONS[key];
    if (cached) return { translated: cached };
    return { translated: input.text };
  }

  const baseUrl = env.SEALION_BASE_URL ?? DEFAULT_BASE_URL;
  const sourceLang = bcp47ToHumanLang(input.from);
  const targetLang = bcp47ToHumanLang(input.to);

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${env.SEALION_API_KEY}`,
    },
    body: JSON.stringify({
      model: "aisingapore/Gemma-SEA-LION-v4-27B-IT",
      messages: [
        {
          role: "system",
          content:
            `You are a translation engine. Translate the user's message from ${sourceLang} to ${targetLang}. ` +
            "Output ONLY the translation. No explanations. No alternatives. No markdown. No quotes around the result. " +
            "If the input is already in the target language, output it unchanged.",
        },
        { role: "user", content: input.text },
      ],
      temperature: 0,
    }),
  });

  if (!response.ok) {
    throw new Error(`SEALion translate failed: ${response.status}`);
  }

  const json = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const raw = json.choices?.[0]?.message?.content?.trim() ?? input.text;
  return { translated: stripTranslationCommentary(raw) };
}

// ---------------------------------------------------------------------------
// Language identification
// ---------------------------------------------------------------------------
//
// Whisper's reported `language` is unreliable for short Romanized SEA inputs:
// "Pakabas saya mahu pergi ke tandas." comes back as `language: "en"` because
// the model treats Latin-script text as English by default. SEALion is SEA-
// trained and reads the actual content — we trust its answer and fall back to
// a Unicode/keyword heuristic only when SEALion is unavailable.

export type IdentifyLanguageInput = {
  text: string;
  hint?: string; // raw upstream guess (e.g. Whisper's `language` field)
};

export async function identifyLanguage(
  input: IdentifyLanguageInput,
  env: TranslateEnv,
): Promise<SupportedLang> {
  const text = input.text.trim();
  if (!text) return "en";

  if (isMockMode(env)) {
    return heuristicLanguage(text, input.hint);
  }

  const baseUrl = env.SEALION_BASE_URL ?? DEFAULT_BASE_URL;
  let response: Response;
  try {
    response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${env.SEALION_API_KEY}`,
      },
      body: JSON.stringify({
        model: "aisingapore/Gemma-SEA-LION-v4-27B-IT",
        messages: [
          {
            role: "system",
            content:
              "You are a language identifier. Read the user's message and respond with " +
              "ONE of these BCP-47 tags, and nothing else: en, zh-Hans, ms, ta. " +
              "en = English (including Singlish). " +
              "zh-Hans = Mandarin Chinese (Simplified). " +
              "ms = Bahasa Melayu (treat Bahasa Indonesia as ms too). " +
              "ta = Tamil. " +
              (input.hint
                ? `An upstream auto-detector guessed "${input.hint}" — this guess is often wrong, verify against the text. `
                : "") +
              "Output only the tag. No punctuation. No explanation.",
          },
          { role: "user", content: text },
        ],
        temperature: 0,
        max_tokens: 8,
      }),
    });
  } catch {
    return heuristicLanguage(text, input.hint);
  }

  if (!response.ok) return heuristicLanguage(text, input.hint);

  const json = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const raw = json.choices?.[0]?.message?.content?.trim() ?? "";
  return normaliseLangTag(raw) ?? heuristicLanguage(text, input.hint);
}

function normaliseLangTag(raw: string): SupportedLang | undefined {
  const cleaned = raw
    .toLowerCase()
    .trim()
    .split(/\s+/)[0]
    ?.replace(/[^a-z-]/g, "");
  if (!cleaned) return undefined;
  if (cleaned === "en" || cleaned.startsWith("en-") || cleaned === "english") {
    return "en";
  }
  if (
    cleaned === "zh" ||
    cleaned === "zh-hans" ||
    cleaned.startsWith("zh-") ||
    cleaned === "chinese" ||
    cleaned === "mandarin"
  ) {
    return "zh-Hans";
  }
  if (
    cleaned === "ms" ||
    cleaned === "id" ||
    cleaned.startsWith("ms-") ||
    cleaned.startsWith("id-") ||
    cleaned === "malay" ||
    cleaned === "indonesian"
  ) {
    return "ms";
  }
  if (cleaned === "ta" || cleaned.startsWith("ta-") || cleaned === "tamil") {
    return "ta";
  }
  return undefined;
}

// Cheap fallback when SEALion is unreachable / mocked. Script ranges catch
// CJK and Tamil; the Malay keyword set catches Latin-script Bahasa Melayu /
// Indonesia which would otherwise default to "en".
const MALAY_KEYWORDS =
  /\b(saya|kamu|awak|tidak|tak|nak|mahu|pergi|tandas|tanas|boleh|bila|mana|apa|siapa|kenapa|dengan|untuk|dari|kerana|tolong|terima\s+kasih|selamat|dia|kami|kita|sudah|belum|jangan|lagi|juga|sangat|sini|sana)\b/i;

export function heuristicLanguage(text: string, hint?: string): SupportedLang {
  if (/[一-鿿]/.test(text)) return "zh-Hans";
  if (/[஀-௿]/.test(text)) return "ta";
  if (MALAY_KEYWORDS.test(text)) return "ms";
  // Last resort: take the upstream hint if it maps to a supported tag.
  if (hint) {
    const fromHint = normaliseLangTag(hint);
    if (fromHint) return fromHint;
  }
  return "en";
}

// SEALion sometimes adds preamble like "The translation is:" or wraps the
// result in **bold** / quotes despite system-prompt instructions. Strip those
// so the orchestrator gets a clean string to pass to TTS / the kiosk message.
function stripTranslationCommentary(raw: string): string {
  let s = raw.trim();
  // Drop a leading "**" pair if it wraps the whole content.
  const boldMatch = s.match(/^\*\*([\s\S]+?)\*\*\s*$/);
  if (boldMatch) s = boldMatch[1].trim();
  // Drop straight or curly quotes wrapping the whole content.
  const quoteMatch = s.match(/^["“'‘]([\s\S]+?)["”'’]\s*$/);
  if (quoteMatch) s = quoteMatch[1].trim();
  // Drop "The translation is:" / "Translation:" prefixes.
  s = s.replace(
    /^(?:the\s+)?(?:most\s+)?(?:common\s+|natural\s+)?(?:and\s+)?(?:natural\s+|common\s+)?translation(?:\s+is)?:\s*/i,
    "",
  );
  // If the model returned multiple options on separate lines, take the first.
  const firstLine = s.split(/\r?\n/).map((l) => l.trim()).find((l) => l.length > 0);
  return (firstLine ?? s).trim();
}
