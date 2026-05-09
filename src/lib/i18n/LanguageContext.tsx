// src/lib/i18n/LanguageContext.tsx
//
// Drives the UI's "active language" with two modes:
//   - locked: a srcLang has been detected for the current session — every
//     consumer renders in that language until the session resets.
//   - cycling: no detection yet — rotate through the four Singaporean
//     languages on a fixed interval so all four communities see themselves
//     in the chrome before they speak.
//
// Consumers never read sessionLang directly. They call useUILang() for the
// current BCP-47 tag (e.g. for `lang=` attributes / TTS) or useUIStrings()
// for the localised string table.

"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  HOME_GREETINGS,
  type SupportedLanguage,
} from "./home-greetings";
import { UI_STRINGS, type UIStrings } from "./ui-strings";

const SUPPORTED_LANGUAGES: readonly SupportedLanguage[] = HOME_GREETINGS.map(
  (g) => g.lang,
);

// Idle cycle cadence — keep in step with LanguageFadeCycle so the home-screen
// greeting and the chrome (buttons / aria) flip together.
const CYCLE_MS = 4200;

const LanguageContext = createContext<SupportedLanguage>("en");

type LanguageProviderProps = {
  // The locked session language reported by the backend (`session.srcLang`).
  // Pass `null` while no session is active to enable cycling.
  sessionLang: string | null;
  children: ReactNode;
};

export function LanguageProvider({
  sessionLang,
  children,
}: LanguageProviderProps) {
  const locked = normaliseToSupported(sessionLang);
  const [cycleIndex, setCycleIndex] = useState(0);

  useEffect(() => {
    if (locked) return; // session has a language — freeze the cycle
    const id = setInterval(() => {
      setCycleIndex((i) => (i + 1) % SUPPORTED_LANGUAGES.length);
    }, CYCLE_MS);
    return () => clearInterval(id);
  }, [locked]);

  const value: SupportedLanguage =
    locked ?? SUPPORTED_LANGUAGES[cycleIndex] ?? "en";

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useUILang(): SupportedLanguage {
  return useContext(LanguageContext);
}

export function useUIStrings(): UIStrings {
  return UI_STRINGS[useUILang()];
}

// Backend tags arrive as BCP-47 (e.g. "zh-SG", "en-SG") but the strings table
// only carries the six base tags. Map locale variants to their base.
//
// Hokkien (nan) and Cantonese (yue) are checked BEFORE generic zh-* so a tag
// like "nan-Hans" doesn't get swallowed by the zh fallback.
function normaliseToSupported(
  lang: string | null | undefined,
): SupportedLanguage | null {
  if (!lang) return null;
  const lower = lang.toLowerCase();
  if (lower === "en" || lower.startsWith("en-")) return "en";
  if (
    lower === "nan" ||
    lower.startsWith("nan-") ||
    lower === "hokkien" ||
    lower === "min-nan" ||
    lower === "zh-nan" ||
    lower.startsWith("zh-nan-")
  ) {
    return "nan";
  }
  if (
    lower === "yue" ||
    lower.startsWith("yue-") ||
    lower === "cantonese" ||
    lower === "zh-yue" ||
    lower.startsWith("zh-yue-")
  ) {
    return "yue";
  }
  if (lower === "zh-hans" || lower === "zh" || lower.startsWith("zh-")) {
    return "zh-Hans";
  }
  if (lower === "ms" || lower === "id" || lower.startsWith("ms-") || lower.startsWith("id-")) {
    return "ms";
  }
  if (lower === "ta" || lower.startsWith("ta-")) return "ta";
  return null;
}

// Re-exported for tests + KioskShell which needs to merge BCP-47 tags too.
export { normaliseToSupported };
