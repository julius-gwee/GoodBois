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
import type { Receipt, TurnResponse } from "@/types/goodbois";
import { cn } from "@/lib/utils";

const KAWAN_API_BASE =
  typeof process !== "undefined"
    ? process.env.NEXT_PUBLIC_KAWAN_API_BASE
    : undefined;

const USE_REAL_TURN = Boolean(KAWAN_API_BASE);

async function fetchTurn(payload: {
  sessionId: string;
  kioskId: string;
  language: string;
  text?: string;
  audioBase64?: string;
  turnCount: number;
}): Promise<TurnResponse | null> {
  if (!KAWAN_API_BASE) return null;
  try {
    const res = await fetch(`${KAWAN_API_BASE.replace(/\/$/, "")}/turn`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-kawan-turn-count": String(payload.turnCount),
      },
      body: JSON.stringify({
        sessionId: payload.sessionId,
        kioskId: payload.kioskId,
        language: payload.language,
        mode: "voice",
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

// Demo turn sequence; cycles back to last entry if user keeps tapping.
const TURN_SEQUENCE = ["initial_request", "followup_answer"] as const;
const DEFAULT_LANGUAGE = "zh-Hans";

export default function KioskShell() {
  const [state, setState] = useState<KioskState>("idle");
  const [messages, setMessages] = useState<ChatEntry[]>([]);
  const [transcript, setTranscript] = useState<
    { original: string; english?: string; language: string } | null
  >(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [pulseToken, setPulseToken] = useState(0);

  const turnIndexRef = useRef(0);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typeTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pulseTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const capturedAudioRef = useRef<CapturedAudio | null>(null);
  const captureInFlightRef = useRef<boolean>(false);
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
    setReceipt(null);
    setPulseToken(0);
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

  // Listening: pulse blob, type transcript, auto-advance to thinking
  useEffect(() => {
    if (state !== "listening") return;

    const fixtureKey =
      TURN_SEQUENCE[Math.min(turnIndexRef.current, TURN_SEQUENCE.length - 1)];
    const fixture = mockTurnResponses[fixtureKey];
    const target = fixture?.transcript;

    pulseTimerRef.current = setInterval(() => {
      setPulseToken((t) => t + 1);
    }, PULSE_INTERVAL_MS);

    if (USE_REAL_TURN) {
      capturedAudioRef.current = null;
      captureInFlightRef.current = true;
      captureAudio(SIMULATED_LISTENING_MS).then((audio) => {
        capturedAudioRef.current = audio;
        captureInFlightRef.current = false;
      });
    }

    if (target) {
      let charIdx = 0;
      typeTimerRef.current = setInterval(() => {
        charIdx++;
        if (charIdx > target.original.length) {
          if (typeTimerRef.current) clearInterval(typeTimerRef.current);
          return;
        }
        const ratio = charIdx / target.original.length;
        setTranscript({
          original: target.original.slice(0, charIdx),
          english: target.english
            ? target.english.slice(0, Math.floor(ratio * target.english.length))
            : undefined,
          language: target.language,
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

  // Thinking: process, then push messages and advance to chat
  useEffect(() => {
    if (state !== "thinking") return;

    let cancelled = false;

    const processTurn = async () => {
      const fixtureKey =
        TURN_SEQUENCE[Math.min(turnIndexRef.current, TURN_SEQUENCE.length - 1)];
      const mockFixture = mockTurnResponses[fixtureKey];

      let response: TurnResponse | null = null;
      if (USE_REAL_TURN && mockFixture?.transcript) {
        response = await fetchTurn({
          sessionId: `kawan-${Date.now()}`,
          kioskId: "demo-laptop",
          language: mockFixture.transcript.language,
          text: capturedAudioRef.current ? undefined : mockFixture.transcript.original,
          audioBase64: capturedAudioRef.current?.base64,
          turnCount: turnIndexRef.current,
        });
      }

      // Wait at least the simulated thinking time so the UI doesn't flash
      await new Promise((r) => setTimeout(r, SIMULATED_THINKING_MS));
      if (cancelled) return;

      const fixture = response ?? mockFixture;
      if (!fixture) {
        resetToIdle();
        return;
      }

      const stamp = Date.now();
      const userEntry: ChatEntry | null = fixture.transcript
        ? {
            id: `user-${stamp}`,
            role: "user",
            text: fixture.transcript.original,
            englishText: fixture.transcript.english,
            language: fixture.transcript.language,
          }
        : mockFixture?.transcript
          ? {
              id: `user-${stamp}`,
              role: "user",
              text: mockFixture.transcript.original,
              englishText: mockFixture.transcript.english,
              language: mockFixture.transcript.language,
            }
          : null;

      const agentEntry: ChatEntry = {
        id: `agent-${stamp}`,
        role: "agent",
        text: fixture.kioskMessage.original,
        englishText: fixture.kioskMessage.english,
        language: fixture.kioskMessage.language,
        agency: fixture.agencyContact,
      };

      setMessages((prev) => [
        ...prev,
        ...(userEntry ? [userEntry] : []),
        agentEntry,
      ]);
      setTranscript(null);

      const audioToPlay = response?.audioUrl;
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
      }

      turnIndexRef.current = Math.min(
        turnIndexRef.current + 1,
        TURN_SEQUENCE.length
      );
      capturedAudioRef.current = null;
      setState("chat");
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

  const handleSaveReceipt = () => {
    const fixture = mockTurnResponses.accept_escalation;
    if (fixture?.receipt) {
      setReceipt(fixture.receipt);
      setState("receipt");
    }
  };

  const blobMode: "idle" | "listening" | "thinking" =
    state === "listening" ? "listening" : state === "thinking" ? "thinking" : "idle";

  const showBlob = state !== "receipt";
  const isChatLayout = state === "chat";

  if (state === "receipt" && receipt) {
    return <ReceiptState receipt={receipt} onBack={resetToIdle} />;
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
            language={DEFAULT_LANGUAGE}
            onSaveReceipt={handleSaveReceipt}
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
