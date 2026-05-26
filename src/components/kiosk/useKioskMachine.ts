"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatEntry } from "./ChatState";
import { mockTurnResponses } from "@/lib/mock-turn-fixtures";
import type { TurnResponse } from "@/types/goodbois";
import {
  captureAudioWithVAD,
  type CaptureHandle,
  type CapturedAudio,
} from "./audioCapture";
import {
  startLiveTranscription,
  type SpeechRecognitionInstance,
} from "./speech";
import { speakViaBrowser } from "@/lib/browser-speech";
import { fetchTurn, USE_REAL_TURN } from "./turn";
import {
  DEFAULT_LANGUAGE,
  IDLE_RESET_MS,
  MOCK_LISTENING_MS,
  MOCK_THINKING_DELAY_MS,
  MOCK_TURN_SEQUENCE,
  PULSE_INTERVAL_MS,
  SIMULATED_THINKING_MS,
  type KioskState,
} from "./config";

// The kiosk lifecycle state machine: owns mic capture, live STT, VAD-driven
// state transitions, the POST /turn (or mock) round-trip, and TTS playback.
// KioskShell consumes the returned state + handlers and only renders.
export function useKioskMachine() {
  const [state, setState] = useState<KioskState>("idle");
  const [messages, setMessages] = useState<ChatEntry[]>([]);
  const [transcript, setTranscript] = useState<{
    english: string;
    srcLang: string;
  } | null>(null);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [pulseToken, setPulseToken] = useState(0);

  const sessionIdRef = useRef<string | null>(null);
  // Locked once on the first turn that produces a usable srcLang from the
  // backend. State (not ref) because it drives <LanguageProvider> — flipping
  // it triggers a rerender that swaps every chrome string into the detected
  // language. The orchestrator already pins session.srcLang server-side; this
  // mirror also covers browser-TTS fallback when audioUrl is absent.
  const [sessionLang, setSessionLang] = useState<string | null>(null);
  const turnIndexRef = useRef(0);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pulseTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Active mic capture handle. The listening effect opens the mic and runs
  // VAD; the thinking effect awaits handle.audio before posting /turn so the
  // request always carries the full utterance. handle.stop() lets the manual
  // Stop button or unmount cleanup flush the recorder early.
  const captureHandleRef = useRef<CaptureHandle | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  const clearAllTimers = useCallback(() => {
    if (stateTimerRef.current) clearTimeout(stateTimerRef.current);
    if (pulseTimerRef.current) clearInterval(pulseTimerRef.current);
    stateTimerRef.current = null;
    pulseTimerRef.current = null;
  }, []);

  const resetToIdle = useCallback(() => {
    clearAllTimers();
    if (captureHandleRef.current) {
      captureHandleRef.current.stop();
      captureHandleRef.current = null;
    }
    setState("idle");
    setMessages([]);
    setTranscript(null);
    setReceiptUrl(null);
    setPulseToken(0);
    sessionIdRef.current = null;
    setSessionLang(null);
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

  // Listening: pulse blob, run live browser STT for on-screen text, capture
  // audio in parallel for the backend, then advance to thinking when VAD
  // detects end-of-speech (or the user taps Stop). Live text is display-only
  // — the authoritative transcript comes back from /turn.
  useEffect(() => {
    if (state !== "listening") return;

    let cancelled = false;

    pulseTimerRef.current = setInterval(() => {
      setPulseToken((t) => t + 1);
    }, PULSE_INTERVAL_MS);

    if (USE_REAL_TURN) {
      // Always record audio. The backend's STT (Whisper via the AI binding)
      // detects the language and returns the English transcript — letting the
      // browser do its own speech-recognition would skip language detection
      // and lock us to the kiosk's default lang.
      captureAudioWithVAD().then((handle) => {
        if (cancelled || !handle) {
          // Either the listening effect tore down before the mic opened, or
          // permission was denied. The thinking effect handles the null-audio
          // case by resetting to idle.
          handle?.stop();
          return;
        }
        captureHandleRef.current = handle;
        // Advance to thinking the moment VAD (or a manual stop) flushes the
        // recorder. The thinking effect re-awaits the same promise so the
        // POST /turn body always has the full utterance.
        handle.audio.then(() => {
          if (cancelled) return;
          setState((prev) => (prev === "listening" ? "thinking" : prev));
        });
      });
    } else {
      // Mock mode — no mic, just simulate a listening window so the UX flows.
      stateTimerRef.current = setTimeout(() => {
        setState("thinking");
      }, MOCK_LISTENING_MS);
    }

    // Live interim transcript via the Web Speech API. Unsupported browsers
    // (Safari/Firefox) leave the panel blank until the backend transcript
    // arrives in the chat state.
    recognitionRef.current = startLiveTranscription((text) => {
      setTranscript({ english: text, srcLang: "" });
    });

    return () => {
      cancelled = true;
      if (stateTimerRef.current) clearTimeout(stateTimerRef.current);
      if (pulseTimerRef.current) clearInterval(pulseTimerRef.current);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // No-op.
        }
        recognitionRef.current = null;
      }
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

      // Await the audio capture started in the listening effect. VAD (or the
      // user pressing Stop) flushes the recorder, then this promise resolves
      // with the encoded audio. We also call stop() defensively in case we're
      // entering thinking via some other path (e.g. timer), so we don't leave
      // the mic running.
      const handle = captureHandleRef.current;
      captureHandleRef.current = null;
      handle?.stop();
      const audioResult: CapturedAudio | null = handle
        ? await handle.audio
        : null;

      let response: TurnResponse | null = null;
      if (USE_REAL_TURN) {
        if (!audioResult) {
          // No audio captured — likely the user denied mic permission or the
          // recorder failed. Bail back to idle rather than fabricate a request.
          resetToIdle();
          return;
        }
        response = await fetchTurn({
          sessionId: sessionIdRef.current ?? undefined,
          kioskId: "demo-laptop",
          audioBase64: audioResult.base64,
        });
      }

      // Wait at least the simulated thinking time so the UI doesn't flash.
      // Mock mode can stretch this (e.g. the lawyer demo's 5s beat).
      const thinkingDelayMs = USE_REAL_TURN
        ? SIMULATED_THINKING_MS
        : MOCK_THINKING_DELAY_MS;
      await new Promise((r) => setTimeout(r, thinkingDelayMs));
      if (cancelled) return;

      const turnResponse = response ?? mockFixture;
      if (!turnResponse) {
        resetToIdle();
        return;
      }

      sessionIdRef.current = turnResponse.sessionId;

      // Lock the session language on the first turn that surfaces one. The
      // backend already pins this; mirroring it into state flips the
      // <LanguageProvider> out of cycling mode so chat tags, button copy,
      // and the browser-TTS fallback all settle on the detected language.
      // Functional updater keeps the effect dep-free of `sessionLang`.
      const turnLang = turnResponse.transcript?.srcLang;
      let effectiveLang = DEFAULT_LANGUAGE;
      if (turnLang) {
        setSessionLang((prev) => prev ?? turnLang);
        effectiveLang = turnLang;
      }

      const stamp = Date.now();
      const userText = turnResponse.transcript?.english;

      const newEntries: ChatEntry[] = [];
      if (userText) {
        newEntries.push({
          id: `user-${stamp}`,
          role: "user",
          text: userText,
          language: effectiveLang,
        });
      }
      newEntries.push({
        id: `agent-${stamp}`,
        role: "agent",
        text: turnResponse.kioskMessage,
        language: effectiveLang,
      });

      setMessages((prev) => [...prev, ...newEntries]);
      setTranscript(null);

      // Play kiosk audio (backend TTS) if present; otherwise fall back to
      // browser speechSynthesis using the session source language.
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
        speakViaBrowser(turnResponse.kioskMessage, effectiveLang);
      }

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
      if (captureHandleRef.current) {
        captureHandleRef.current.stop();
        captureHandleRef.current = null;
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
    } else if (state === "listening") {
      handleStop();
    }
  };

  const handleStop = () => {
    // Flush the recorder so its audio promise resolves immediately. The VAD
    // tick would otherwise keep the mic open until trailing silence is seen.
    captureHandleRef.current?.stop();
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

  return {
    state,
    messages,
    transcript,
    receiptUrl,
    pulseToken,
    sessionLang,
    resetToIdle,
    handleBlobActivate,
    handleStop,
    handleCancel,
    handleViewReceipt,
  };
}
