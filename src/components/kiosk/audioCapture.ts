// src/components/kiosk/audioCapture.ts
//
// Microphone capture with voice-activity detection. captureAudioWithVAD opens
// the mic, records via MediaRecorder, and watches mic level through an
// AnalyserNode so recording ends on trailing silence (or a hard cap) without
// the user pressing Stop. Returns a handle whose `audio` promise resolves with
// the base64-encoded utterance and whose `stop()` flushes the recorder early.

export type CapturedAudio = { base64: string; mimeType: string };

export type CaptureHandle = {
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

export async function captureAudioWithVAD(): Promise<CaptureHandle | null> {
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
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result;
            if (typeof result === "string") {
              const commaIndex = result.indexOf(",");
              resolve(commaIndex >= 0 ? result.slice(commaIndex + 1) : "");
              return;
            }
            reject(new Error("Failed to read audio data."));
          };
          reader.onerror = () => reject(reader.error ?? new Error("Failed to read audio data."));
          reader.readAsDataURL(blob);
        });
        finish({ base64, mimeType });
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
