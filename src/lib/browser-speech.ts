// src/lib/browser-speech.ts
//
// Browser speechSynthesis helper shared by the kiosk (KioskShell, via the
// useKioskMachine hook) and the map directory (KawanDirectoryApp "read aloud").
// Cancels any in-flight utterance, then speaks. Pass a BCP-47 `language` to
// pick the right voice. Degrades to a no-op (returns false) in unsupported
// environments or when speechSynthesis throws.

export function speakViaBrowser(text: string, language?: string): boolean {
  if (typeof window === "undefined" || !window.speechSynthesis) return false;
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    if (language) utterance.lang = language;
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
    return true;
  } catch {
    return false;
  }
}
