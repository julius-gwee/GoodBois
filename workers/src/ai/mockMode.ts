// workers/src/ai/mockMode.ts
//
// Shared mock-mode check for the AI adapters. An adapter runs in mock mode when
// its explicit *_MOCK flag is "true" OR the backend binding it needs is absent
// (env.AI for STT/TTS via Workers AI; SEALION_API_KEY for translate / language
// id). Centralising this keeps the offline-dev / CI behaviour identical across
// adapters.

export function isMockMode(
  flag: string | undefined,
  backendAvailable: boolean,
): boolean {
  if (flag === "true") return true;
  return !backendAvailable;
}
