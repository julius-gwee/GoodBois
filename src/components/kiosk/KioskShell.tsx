"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import VoiceAgentBlob from "@/components/atoms/VoiceAgentBlob";
import AccessibilityButton from "@/components/atoms/AccessibilityButton";
import LanguageFadeCycle from "@/components/atoms/LanguageFadeCycle";
import ListeningState from "./ListeningState";
import ThinkingState from "./ThinkingState";
import ChatState, { type ChatEntry } from "./ChatState";
import ReceiptState from "./ReceiptState";
import RouteState from "./RouteState";
import Wordmark from "./Wordmark";
import { mockTurnResponses } from "@/lib/mock-turn-fixtures";
import type { AgencyContact, ToolInvocationSummary, TurnResponse } from "@/types/goodbois";
import { LanguageProvider, useUIStrings } from "@/lib/i18n/LanguageContext";
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

type SpeechRecognitionAlternative = { transcript: string };
type SpeechRecognitionResult = { 0: SpeechRecognitionAlternative };
type SpeechRecognitionResultList = {
  length: number;
  [index: number]: SpeechRecognitionResult;
};
type SpeechRecognitionEvent = { results: SpeechRecognitionResultList };
type SpeechRecognitionInstance = {
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

function startLiveTranscription(
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

type CaptureHandle = {
  audio: Promise<CapturedAudio | null>;
  stop: () => void;
};

// Voice-activity-detection thresholds. RMS is computed on a -1..1 normalised
// time-domain buffer, so 0.015 ≈ a quiet room with someone breathing, and
// regular speech sits comfortably above 0.05. The "no speech yet" timeout
// prevents the mic from hanging open forever if the user never talks; the
// hard cap is a safety net against runaway recordings.
const VAD_RMS_THRESHOLD = 0.015;
const VAD_TRAILING_SILENCE_MS = 1_500;
const VAD_NO_SPEECH_TIMEOUT_MS = 8_000;
const VAD_MAX_RECORDING_MS = 30_000;

async function captureAudioWithVAD(): Promise<CaptureHandle | null> {
  if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    return null;
  }

  let stream: MediaStream;
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

  let recorder: MediaRecorder;
  try {
    recorder = new MediaRecorder(stream, { mimeType });
  } catch {
    stream.getTracks().forEach((t) => t.stop());
    return null;
  }

  // Wire an analyser off the same stream so we can read mic level without
  // disturbing the recorder. If AudioContext is unavailable we fall back to
  // a hard cap below.
  let audioCtx: AudioContext | null = null;
  let analyser: AnalyserNode | null = null;
  let source: MediaStreamAudioSourceNode | null = null;
  try {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (Ctor) {
      audioCtx = new Ctor();
      source = audioCtx.createMediaStreamSource(stream);
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 1024;
      source.connect(analyser);
    }
  } catch {
    audioCtx = null;
    analyser = null;
    source = null;
  }

  const chunks: BlobPart[] = [];
  let settled = false;
  let stopRequested = false;
  let rafId: number | null = null;
  let fallbackTimer: ReturnType<typeof setTimeout> | null = null;

  const cleanup = () => {
    stream.getTracks().forEach((t) => t.stop());
    try {
      source?.disconnect();
      analyser?.disconnect();
      audioCtx?.close();
    } catch {
      // No-op.
    }
    if (rafId !== null && typeof cancelAnimationFrame !== "undefined") {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    if (fallbackTimer) {
      clearTimeout(fallbackTimer);
      fallbackTimer = null;
    }
  };

  const audio = new Promise<CapturedAudio | null>((resolve) => {
    const finish = (value: CapturedAudio | null) => {
      if (settled) return;
      settled = true;
      cleanup();
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
  });

  const stop = () => {
    if (stopRequested) return;
    stopRequested = true;
    if (recorder.state !== "inactive") {
      try {
        recorder.stop();
      } catch {
        // Recorder already stopped — the resolve path will settle the promise.
      }
    }
  };

  recorder.start();

  if (analyser) {
    const buffer = new Uint8Array(analyser.fftSize);
    let speechStarted = false;
    let lastSpeechAt = performance.now();
    const startedAt = performance.now();

    const tick = () => {
      if (stopRequested) return;
      const now = performance.now();
      const elapsed = now - startedAt;

      if (elapsed > VAD_MAX_RECORDING_MS) {
        stop();
        return;
      }

      analyser!.getByteTimeDomainData(buffer);
      let sumSquares = 0;
      for (let i = 0; i < buffer.length; i++) {
        const v = (buffer[i] - 128) / 128;
        sumSquares += v * v;
      }
      const rms = Math.sqrt(sumSquares / buffer.length);

      if (rms > VAD_RMS_THRESHOLD) {
        speechStarted = true;
        lastSpeechAt = now;
      } else if (
        speechStarted &&
        now - lastSpeechAt > VAD_TRAILING_SILENCE_MS
      ) {
        stop();
        return;
      } else if (!speechStarted && elapsed > VAD_NO_SPEECH_TIMEOUT_MS) {
        stop();
        return;
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
  } else {
    // No analyser available — fall back to the hard cap so the mic doesn't
    // run forever.
    fallbackTimer = setTimeout(stop, VAD_MAX_RECORDING_MS);
  }

  return { audio, stop };
}

type KioskState = "idle" | "listening" | "thinking" | "chat" | "receipt" | "route";

const IDLE_RESET_MS = 30_000;
// Mock-mode only fallback: real-mode listening is ended by VAD or the user
// pressing Stop, not a fixed timer.
const MOCK_LISTENING_MS = 6_000;
const SIMULATED_THINKING_MS = 1_500;
const PULSE_INTERVAL_MS = 500;

// Mock-mode walks this sequence on successive turns. Real-mode is driven by
// the backend's TurnResponse.state and ignores these.
const MOCK_TURN_SEQUENCE = ["followup_listening", "done_signpost"] as const;
const DEFAULT_LANGUAGE = "en";

export default function KioskShell() {
  const [state, setState] = useState<KioskState>("idle");
  const [messages, setMessages] = useState<ChatEntry[]>([]);
  const [transcript, setTranscript] = useState<{
    english: string;
    srcLang: string;
  } | null>(null);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  // Set when a turn's tool calls include a successful `signpost` whose agency
  // has coordinates — gates the "View directions" affordance and the map embed.
  const [signpostedAgency, setSignpostedAgency] = useState<AgencyContact | null>(
    null,
  );
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
    setSignpostedAgency(null);
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
      await new Promise((r) => setTimeout(r, SIMULATED_THINKING_MS));
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

      // Surface a "View directions" affordance when the turn signposted an
      // agency we can put on a map (one with coordinates).
      const signpostCall = turnResponse.toolCalls?.find(
        (tc): tc is Extract<ToolInvocationSummary, { name: "signpost"; ok: true }> =>
          tc.name === "signpost" && tc.ok === true,
      );
      const signpostAgency = signpostCall?.data.agency ?? null;
      setSignpostedAgency(
        signpostAgency &&
          signpostAgency.latitude != null &&
          signpostAgency.longitude != null
          ? signpostAgency
          : null,
      );

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

  const handleViewDirections = () => {
    if (signpostedAgency) setState("route");
  };

  const blobMode: "idle" | "listening" | "thinking" =
    state === "listening"
      ? "listening"
      : state === "thinking"
        ? "thinking"
        : "idle";

  const showBlob = state !== "receipt" && state !== "route";
  const isChatLayout = state === "chat";

  if (state === "route" && signpostedAgency) {
    return (
      <LanguageProvider sessionLang={sessionLang}>
        <RouteState agency={signpostedAgency} onBack={() => setState("chat")} />
      </LanguageProvider>
    );
  }

  if (state === "receipt" && receiptUrl) {
    return <ReceiptState receiptUrl={receiptUrl} onBack={resetToIdle} />;
  }

  return (
    <LanguageProvider sessionLang={sessionLang}>
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
            : "justify-center gap-8 pb-[6vh]",
        )}
      >
        {isChatLayout && (
          <ChatState
            messages={messages}
            onViewReceipt={receiptUrl ? handleViewReceipt : undefined}
            onViewDirections={signpostedAgency ? handleViewDirections : undefined}
            onReset={resetToIdle}
          />
        )}

        {showBlob && (
          <LocalizedBlob
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
    </LanguageProvider>
  );
}

// Wrapper so VoiceAgentBlob's aria-label localises with the active session
// language. VoiceAgentBlob itself takes a plain string prop — keeping that
// shape avoids spreading i18n knowledge into a presentational atom.
type LocalizedBlobProps = Omit<
  React.ComponentProps<typeof VoiceAgentBlob>,
  "ariaLabel"
>;

function LocalizedBlob(props: LocalizedBlobProps) {
  const t = useUIStrings();
  return <VoiceAgentBlob ariaLabel={t.tapToSpeak} {...props} />;
}
