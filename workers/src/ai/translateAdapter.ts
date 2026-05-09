// workers/src/ai/translateAdapter.ts
//
// SEALion translation adapter. Mock-mode returns canned demo translations.
// Real-mode calls SEALion's OpenAI-compatible chat completions endpoint with a
// translate-only system prompt.
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
