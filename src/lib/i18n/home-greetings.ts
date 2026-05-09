// src/lib/i18n/home-greetings.ts
//
// Multilingual greeting strings shown on the Kawan kiosk idle home screen.
// Tamil and Malay copy is draft and needs native-speaker validation before demo.

export type SupportedLanguage = "en" | "zh-Hans" | "ms" | "ta";

export type HomeGreeting = {
  lang: SupportedLanguage;
  greeting: string;
  cue: string;
};

export const HOME_GREETINGS: readonly HomeGreeting[] = [
  {
    lang: "en",
    greeting: "How can I help you?",
    cue: "Tap to speak to me.",
  },
  {
    lang: "zh-Hans",
    greeting: "我能帮您什么？",
    cue: "点击与我说话。",
  },
  {
    lang: "ms",
    greeting: "Bagaimana saya boleh tolong anda?",
    cue: "Sentuh untuk bercakap.",
  },
  {
    lang: "ta",
    greeting: "நான் உங்களுக்கு எப்படி உதவ முடியும்?",
    cue: "என்னுடன் பேச தொடவும்.",
  },
] as const;
