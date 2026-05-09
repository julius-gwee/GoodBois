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
import type { Receipt } from "@/types/goodbois";
import { cn } from "@/lib/utils";

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

  // Thinking: simulate processing, then push messages and advance to chat
  useEffect(() => {
    if (state !== "thinking") return;

    stateTimerRef.current = setTimeout(() => {
      const fixtureKey =
        TURN_SEQUENCE[Math.min(turnIndexRef.current, TURN_SEQUENCE.length - 1)];
      const fixture = mockTurnResponses[fixtureKey];
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
      turnIndexRef.current = Math.min(
        turnIndexRef.current + 1,
        TURN_SEQUENCE.length
      );
      setState("chat");
    }, SIMULATED_THINKING_MS);

    return () => {
      if (stateTimerRef.current) clearTimeout(stateTimerRef.current);
    };
  }, [state, resetToIdle]);

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
