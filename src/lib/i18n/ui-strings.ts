// src/lib/i18n/ui-strings.ts
//
// Localised copy for kiosk chrome (buttons, status indicators, sheet labels).
// Keyed off the four Singaporean languages the rest of the pipeline supports.
// Add a key here, then read it via `useUIStrings()` from LanguageContext —
// never hard-code chrome copy in components.

import type { SupportedLanguage } from "./home-greetings";

export type UIStringKey =
  | "listening"
  | "stop"
  | "cancel"
  | "thinking"
  | "done"
  | "viewReceipt"
  | "cannotSpeak"
  | "typeInstead"
  | "accessibilityOptions"
  | "tapToSpeak";

export type UIStrings = Record<UIStringKey, string>;

export const UI_STRINGS: Record<SupportedLanguage, UIStrings> = {
  en: {
    listening: "Listening",
    stop: "Stop",
    cancel: "Cancel",
    thinking: "Thinking",
    done: "Done",
    viewReceipt: "View receipt",
    cannotSpeak: "I can't speak right now",
    typeInstead: "Type instead",
    accessibilityOptions: "Accessibility options",
    tapToSpeak: "Tap to speak to Kawan",
  },
  "zh-Hans": {
    listening: "正在听",
    stop: "停止",
    cancel: "取消",
    thinking: "正在思考",
    done: "完成",
    viewReceipt: "查看收据",
    cannotSpeak: "我现在不能说话",
    typeInstead: "改用打字",
    accessibilityOptions: "无障碍选项",
    tapToSpeak: "点击与 Kawan 说话",
  },
  ms: {
    listening: "Mendengar",
    stop: "Berhenti",
    cancel: "Batal",
    thinking: "Sedang berfikir",
    done: "Selesai",
    viewReceipt: "Lihat resit",
    cannotSpeak: "Saya tidak boleh bercakap sekarang",
    typeInstead: "Taip sahaja",
    accessibilityOptions: "Pilihan kebolehcapaian",
    tapToSpeak: "Sentuh untuk bercakap dengan Kawan",
  },
  ta: {
    listening: "கேட்கிறது",
    stop: "நிறுத்து",
    cancel: "ரத்துசெய்",
    thinking: "சிந்திக்கிறது",
    done: "முடிந்தது",
    viewReceipt: "ரசீதைப் பார்க்கவும்",
    cannotSpeak: "என்னால் இப்போது பேச முடியாது",
    typeInstead: "தட்டச்சு செய்யவும்",
    accessibilityOptions: "அணுகல் விருப்பங்கள்",
    tapToSpeak: "காவனுடன் பேச தொடவும்",
  },
  // Hokkien (Min Nan) — Singapore's most-spoken Chinese dialect. Written form
  // mostly tracks Standard Written Chinese with dialect-specific lexicon
  // (会当 = can, 啥物 = what, 共 = with, 揣 = look for). Draft — review.
  nan: {
    listening: "咧听",
    stop: "停",
    cancel: "取消",
    thinking: "咧想",
    done: "好啊",
    viewReceipt: "看收据",
    cannotSpeak: "我这阵讲袂出嘴",
    typeInstead: "改用拍字",
    accessibilityOptions: "辅助选项",
    tapToSpeak: "撳这粒来共 Kawan 讲",
  },
  // Cantonese (Yue) — written with dialect-specific characters in Simplified
  // (嘅, 紧, 啲, 唔, 乜嘢, 撳, 睇). Draft — review.
  yue: {
    listening: "听紧",
    stop: "停",
    cancel: "取消",
    thinking: "谂紧",
    done: "搞掂",
    viewReceipt: "睇收据",
    cannotSpeak: "我而家唔讲得话",
    typeInstead: "改用打字",
    accessibilityOptions: "无障碍选项",
    tapToSpeak: "撳呢度同 Kawan 倾偈",
  },
};
