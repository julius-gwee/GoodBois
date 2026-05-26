// src/components/kiosk/config.ts
//
// Kiosk state-machine timing and mock-demo configuration. Pure module-level
// constants shared by the KioskShell component and its useKioskMachine hook.

export type KioskState = "idle" | "listening" | "thinking" | "chat" | "receipt";

// Defaults to false. While false, mock mode runs the single-shot "divorce
// lawyer → Legal Aid Bureau" demo turn (in Mandarin, with a longer fake
// thinking pause). Set it true (NEXT_PUBLIC_HIDE_LAWYER_DEMO="1"/"true") to
// fall back to the default eye-check / hazard sequence instead.
const HIDE_LAWYER_DEMO =
  typeof process !== "undefined" &&
  ["1", "true"].includes(
    (process.env.NEXT_PUBLIC_HIDE_LAWYER_DEMO ?? "").toLowerCase(),
  );
export const SHOW_LAWYER_DEMO = !HIDE_LAWYER_DEMO;

export const IDLE_RESET_MS = 30_000;
// Mock-mode only fallback: real-mode listening is ended by VAD or the user
// pressing Stop, not a fixed timer.
export const MOCK_LISTENING_MS = 6_000;
export const SIMULATED_THINKING_MS = 1_500;
// Mock-mode only: extra "thinking" pause after the user's utterance so the
// canned demo turn doesn't pop back instantly. Real-mode uses SIMULATED_THINKING_MS.
export const MOCK_THINKING_MS = 5_000;
export const PULSE_INTERVAL_MS = 500;

// Mock-mode walks this sequence on successive turns. Real-mode is driven by
// the backend's TurnResponse.state and ignores these.
export const MOCK_TURN_SEQUENCE = SHOW_LAWYER_DEMO
  ? (["done_lawyer"] as const)
  : (["followup_listening", "done_signpost"] as const);
// Fake "thinking" pause after the user's utterance in mock mode. The lawyer
// demo uses a longer 5s beat; the default sequence keeps the snappy pause.
export const MOCK_THINKING_DELAY_MS = SHOW_LAWYER_DEMO
  ? MOCK_THINKING_MS
  : SIMULATED_THINKING_MS;
export const DEFAULT_LANGUAGE = "en";
