// src/components/kiosk/speech.ts
//
// Browser speech helpers used by the kiosk: live interim transcription via the
// Web Speech API (display-only — the authoritative transcript comes from the
// backend) and a speechSynthesis fallback for when the backend returns no TTS
// audio. Both degrade to no-ops on unsupported browsers (Safari/Firefox).

type SpeechRecognitionAlternative = { transcript: string };
type SpeechRecognitionResult = { 0: SpeechRecognitionAlternative };
type SpeechRecognitionResultList = {
  length: number;
  [index: number]: SpeechRecognitionResult;
};
type SpeechRecognitionEvent = { results: SpeechRecognitionResultList };
export type SpeechRecognitionInstance = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  addEventListener: (
    type: "result" | "error" | "end",
    listener: (event: SpeechRecognitionEvent) => void,
  ) => void;
};
type SpeechRecognitionCtor = new () => SpeechRecognitionInstance;

export function startLiveTranscription(
  onInterim: (text: string) => void,
): SpeechRecognitionInstance | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  if (!Ctor) return null;

  let recognition: SpeechRecognitionInstance;
  try {
    recognition = new Ctor();
  } catch {
    return null;
  }

  recognition.continuous = true;
  recognition.interimResults = true;

  recognition.addEventListener("result", (event) => {
    let text = "";
    for (let i = 0; i < event.results.length; i++) {
      text += event.results[i][0].transcript;
    }
    onInterim(text);
  });

  try {
    recognition.start();
  } catch {
    return null;
  }

  return recognition;
}

export function speakViaBrowser(text: string, language: string): boolean {
  if (typeof window === "undefined" || !window.speechSynthesis) return false;
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
    return true;
  } catch {
    return false;
  }
}
