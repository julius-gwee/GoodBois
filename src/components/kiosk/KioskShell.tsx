"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import VoiceAgentBlob from "@/components/atoms/VoiceAgentBlob";
import AccessibilityButton from "@/components/atoms/AccessibilityButton";
import LanguageFadeCycle from "@/components/atoms/LanguageFadeCycle";
import ListeningState from "./ListeningState";
import ThinkingState from "./ThinkingState";
import ChatState, { type ChatEntry } from "./ChatState";
import ReceiptState from "./ReceiptState";
import Wordmark from "./Wordmark";
import { mockTurnResponses } from "@/lib/mock-turn-fixtures";
import type { TurnResponse } from "@/types/goodbois";
import { cn } from "@/lib/utils";

const KAWAN_API_BASE =
  typeof process !== "undefined"
    ? process.env.NEXT_PUBLIC_KAWAN_API_BASE
    : undefined;

const USE_REAL_TURN = Boolean(KAWAN_API_BASE);

async function fetchTurn(payload: {
  sessionId?: string;
  kioskId: string;
  text?: string;
  audioBase64?: string;
}): Promise<TurnResponse | null> {
  if (!KAWAN_API_BASE) return null;
  try {
    const res = await fetch(`${KAWAN_API_BASE.replace(/\/$/, "")}/turn`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        sessionId: payload.sessionId,
        kioskId: payload.kioskId,
        text: payload.text,
        audioBase64: payload.audioBase64,
      }),
    });
    if (!res.ok) return null;
    return (await res.json()) as TurnResponse;
  } catch {
    return null;
  }
}

type CapturedAudio = { base64: string; mimeType: string };

type CapturedSpeech =
  | { kind: "text"; transcript: string; language: string }
  | { kind: "audio"; base64: string; mimeType: string };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getSpeechRecognitionConstructor(): (new () => any) | undefined {
  if (typeof window === "undefined") return undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

async function transcribeViaWebSpeech(
  language: string,
  timeoutMs: number,
): Promise<CapturedSpeech | null> {
  const Ctor = getSpeechRecognitionConstructor();
  if (!Ctor) return null;

  return new Promise<CapturedSpeech | null>((resolve) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let recognition: any;
    try {
      recognition = new Ctor();
    } catch {
      return resolve(null);
    }
    recognition.lang = language;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    let settled = false;
    const finish = (result: CapturedSpeech | null) => {
      if (settled) return;
      settled = true;
      try {
        recognition.stop();
      } catch {
        // ignore
      }
      resolve(result);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.addEventListener("result", (event: any) => {
      const transcript = event.results[0]?.[0]?.transcript?.trim();
      if (transcript) {
        finish({ kind: "text", transcript, language });
      } else {
        finish(null);
      }
    });
    recognition.addEventListener("error", () => finish(null));
    recognition.addEventListener("end", () => finish(null));

    try {
      recognition.start();
    } catch {
      finish(null);
      return;
    }

    setTimeout(() => finish(null), timeoutMs);
  });
}

function speakViaBrowser(text: string, language: string): boolean {
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

async function captureAudio(timeoutMs: number): Promise<CapturedAudio | null> {
  if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    return null;
  }

  let stream: MediaStream | null = null;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch {
    return null;
  }

  const mimeType =
    typeof MediaRecorder !== "undefined" &&
    MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
      ? "audio/webm;codecs=opus"
      : "audio/webm";

  return new Promise<CapturedAudio | null>((resolve) => {
    if (!stream) return resolve(null);
    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(stream, { mimeType });
    } catch {
      stream.getTracks().forEach((t) => t.stop());
      return resolve(null);
    }

    const chunks: BlobPart[] = [];
    let settled = false;
    const finish = (value: CapturedAudio | null) => {
      if (settled) return;
      settled = true;
      stream?.getTracks().forEach((t) => t.stop());
      resolve(value);
    };

    recorder.addEventListener("dataavailable", (e) => {
      if (e.data && e.data.size > 0) chunks.push(e.data);
    });
    recorder.addEventListener("stop", async () => {
      try {
        const blob = new Blob(chunks, { type: mimeType });
        const buffer = await blob.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        let binary = "";
        for (let i = 0; i < bytes.length; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        finish({ base64: btoa(binary), mimeType });
      } catch {
        finish(null);
      }
    });
    recorder.addEventListener("error", () => finish(null));

    recorder.start();
    setTimeout(() => {
      if (recorder.state !== "inactive") {
        try {
          recorder.stop();
        } catch {
          finish(null);
        }
      }
    }, timeoutMs);
  });
}

type KioskState = "idle" | "listening" | "thinking" | "chat" | "receipt";

const IDLE_RESET_MS = 30_000;
const SIMULATED_LISTENING_MS = 3_000;
const SIMULATED_THINKING_MS = 1_500;
const PULSE_INTERVAL_MS = 500;
const TYPE_INTERVAL_MS = 80;

// Mock-mode walks this sequence on successive turns. Real-mode is driven by
// the backend's TurnResponse.state and ignores these.
const MOCK_TURN_SEQUENCE = ["followup_listening", "done_signpost"] as const;
const DEFAULT_LANGUAGE = "zh-Hans";

export default function KioskShell() {
  const [state, setState] = useState<KioskState>("idle");
  const [messages, setMessages] = useState<ChatEntry[]>([]);
  const [transcript, setTranscript] = useState<
    { english: string; srcLang: string } | null
  >(null);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [pulseToken, setPulseToken] = useState(0);

  const sessionIdRef = useRef<string | null>(null);
  const turnIndexRef = useRef(0);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typeTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pulseTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const capturedSpeechRef = useRef<CapturedSpeech | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  const clearAllTimers = useCallback(() => {
    if (stateTimerRef.current) clearTimeout(stateTimerRef.current);
    if (typeTimerRef.current) clearInterval(typeTimerRef.current);
    if (pulseTimerRef.current) clearInterval(pulseTimerRef.current);
    stateTimerRef.current = null;
    typeTimerRef.current = null;
    pulseTimerRef.current = null;
  }, []);

  const resetToIdle = useCallback(() => {
    clearAllTimers();
    setState("idle");
    setMessages([]);
    setTranscript(null);
    setReceiptUrl(null);
    setPulseToken(0);
    sessionIdRef.current = null;
    turnIndexRef.current = 0;
  }, [clearAllTimers]);

  // Idle reset timer — any non-idle state, no activity for 30s
  useEffect(() => {
    if (state === "idle") return;
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(resetToIdle, IDLE_RESET_MS);
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [state, messages.length, pulseToken, resetToIdle]);

  // Listening: pulse blob, type-out the mock fixture transcript while we
  // capture from the mic in parallel, then advance to thinking.
  useEffect(() => {
    if (state !== "listening") return;

    const fixtureKey =
      MOCK_TURN_SEQUENCE[
        Math.min(turnIndexRef.current, MOCK_TURN_SEQUENCE.length - 1)
      ];
    const fixture = mockTurnResponses[fixtureKey];
    const targetTranscript = fixture?.transcript ?? null;

    pulseTimerRef.current = setInterval(() => {
      setPulseToken((t) => t + 1);
    }, PULSE_INTERVAL_MS);

    if (USE_REAL_TURN) {
      capturedSpeechRef.current = null;
      const tryWebSpeech = transcribeViaWebSpeech(
        DEFAULT_LANGUAGE,
        SIMULATED_LISTENING_MS,
      );
      tryWebSpeech.then(async (textResult) => {
        if (textResult) {
          capturedSpeechRef.current = textResult;
          return;
        }
        // Fallback: record audio for backend STT
        const audioResult = await captureAudio(SIMULATED_LISTENING_MS);
        if (audioResult) {
          capturedSpeechRef.current = {
            kind: "audio",
            base64: audioResult.base64,
            mimeType: audioResult.mimeType,
          };
        }
      });
    }

    if (targetTranscript) {
      let charIdx = 0;
      typeTimerRef.current = setInterval(() => {
        charIdx++;
        if (charIdx > targetTranscript.english.length) {
          if (typeTimerRef.current) clearInterval(typeTimerRef.current);
          return;
        }
        setTranscript({
          english: targetTranscript.english.slice(0, charIdx),
          srcLang: targetTranscript.srcLang,
        });
      }, TYPE_INTERVAL_MS);
    }

    stateTimerRef.current = setTimeout(() => {
      setState("thinking");
    }, SIMULATED_LISTENING_MS);

    return () => {
      if (stateTimerRef.current) clearTimeout(stateTimerRef.current);
      if (typeTimerRef.current) clearInterval(typeTimerRef.current);
      if (pulseTimerRef.current) clearInterval(pulseTimerRef.current);
    };
  }, [state]);

  // Thinking: POST /turn (real) or use the mock fixture, then route into
  // the chat / receipt state based on response.state.
  useEffect(() => {
    if (state !== "thinking") return;

    let cancelled = false;

    const processTurn = async () => {
      const fixtureKey =
        MOCK_TURN_SEQUENCE[
          Math.min(turnIndexRef.current, MOCK_TURN_SEQUENCE.length - 1)
        ];
      const mockFixture = mockTurnResponses[fixtureKey];
      const speech = capturedSpeechRef.current;

      let response: TurnResponse | null = null;
      if (USE_REAL_TURN) {
        const fallbackText = mockFixture?.transcript?.english;
        response = await fetchTurn({
          sessionId: sessionIdRef.current ?? undefined,
          kioskId: "demo-laptop",
          text:
            speech?.kind === "text"
              ? speech.transcript
              : speech
                ? undefined
                : fallbackText,
          audioBase64: speech?.kind === "audio" ? speech.base64 : undefined,
        });
      }

      // Wait at least the simulated thinking time so the UI doesn't flash.
      await new Promise((r) => setTimeout(r, SIMULATED_THINKING_MS));
      if (cancelled) return;

      const turnResponse = response ?? mockFixture;
      if (!turnResponse) {
        resetToIdle();
        return;
      }

      sessionIdRef.current = turnResponse.sessionId;

      const stamp = Date.now();
      const userText =
        speech?.kind === "text" && speech.transcript
          ? speech.transcript
          : turnResponse.transcript?.english;

      const newEntries: ChatEntry[] = [];
      if (userText) {
        newEntries.push({
          id: `user-${stamp}`,
          role: "user",
          text: userText,
          language:
            turnResponse.transcript?.srcLang ??
            (speech?.kind === "text" ? speech.language : DEFAULT_LANGUAGE),
        });
      }
      newEntries.push({
        id: `agent-${stamp}`,
        role: "agent",
        text: turnResponse.kioskMessage,
        language: turnResponse.transcript?.srcLang ?? DEFAULT_LANGUAGE,
      });

      setMessages((prev) => [...prev, ...newEntries]);
      setTranscript(null);

      // Play kiosk audio (backend TTS) if present; otherwise fall back to
      // browser speechSynthesis using the source language.
      const audioToPlay = turnResponse.audioUrl;
      if (audioToPlay) {
        try {
          if (audioPlayerRef.current) {
            audioPlayerRef.current.pause();
            audioPlayerRef.current = null;
          }
          const player = new Audio(audioToPlay);
          audioPlayerRef.current = player;
          player.play().catch(() => {
            // Autoplay blocked or invalid URL; degrade silently.
          });
        } catch {
          // No-op.
        }
      } else {
        speakViaBrowser(
          turnResponse.kioskMessage,
          turnResponse.transcript?.srcLang ?? DEFAULT_LANGUAGE,
        );
      }

      capturedSpeechRef.current = null;

      if (turnResponse.state === "followup") {
        // Bump the mock cursor so a follow-up turn pulls the next fixture.
        turnIndexRef.current = Math.min(
          turnIndexRef.current + 1,
          MOCK_TURN_SEQUENCE.length - 1,
        );
        // Show the chat history briefly, then reopen the mic for the next
        // user utterance. The session is preserved via sessionIdRef.
        setState("chat");
      } else if (turnResponse.state === "done") {
        if (turnResponse.receiptUrl) {
          setReceiptUrl(turnResponse.receiptUrl);
        }
        setState("chat");
      } else {
        // "listening" state shouldn't reach the frontend in this code path;
        // treat it as a soft reset.
        setState("chat");
      }
    };

    processTurn();

    return () => {
      cancelled = true;
      if (stateTimerRef.current) clearTimeout(stateTimerRef.current);
    };
  }, [state, resetToIdle]);

  useEffect(() => {
    return () => {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current = null;
      }
      if (typeof window !== "undefined" && window.speechSynthesis) {
        try {
          window.speechSynthesis.cancel();
        } catch {
          // No-op.
        }
      }
    };
  }, []);

  const handleBlobActivate = () => {
    if (state === "idle" || state === "chat") {
      setState("listening");
    }
  };

  const handleStop = () => {
    setState("thinking");
  };

  const handleCancel = () => {
    if (messages.length > 0) {
      setState("chat");
    } else {
      resetToIdle();
    }
  };

  const handleViewReceipt = () => {
    if (receiptUrl) setState("receipt");
  };

  const blobMode: "idle" | "listening" | "thinking" =
    state === "listening" ? "listening" : state === "thinking" ? "thinking" : "idle";

  const showBlob = state !== "receipt";
  const isChatLayout = state === "chat";

  if (state === "receipt" && receiptUrl) {
    return <ReceiptState receiptUrl={receiptUrl} onBack={resetToIdle} />;
  }

  return (
    <main className="relative flex min-h-screen flex-col bg-soft-cream">
      <header className="flex items-center justify-between px-[8vw] py-[5vh]">
        <Wordmark />
        <AccessibilityButton />
      </header>

      <div
        className={cn(
          "flex flex-1 flex-col items-center px-[8vw]",
          isChatLayout
            ? "justify-between gap-6 pb-6 pt-2"
            : "justify-center gap-8 pb-[6vh]"
        )}
      >
        {isChatLayout && (
          <ChatState
            messages={messages}
            onViewReceipt={receiptUrl ? handleViewReceipt : undefined}
            onReset={resetToIdle}
          />
        )}

        {showBlob && (
          <VoiceAgentBlob
            ariaLabel="Tap to speak to Kawan"
            onActivate={handleBlobActivate}
            mode={blobMode}
            position={isChatLayout ? "bottom" : "center"}
            pulseToken={pulseToken}
          />
        )}

        {state === "idle" && <LanguageFadeCycle />}
        {state === "listening" && (
          <ListeningState transcript={transcript} onStop={handleStop} />
        )}
        {state === "thinking" && (
          <ThinkingState transcript={transcript} onCancel={handleCancel} />
        )}
      </div>
    </main>
  );
}
