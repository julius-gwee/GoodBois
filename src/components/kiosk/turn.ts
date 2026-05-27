// src/components/kiosk/turn.ts
//
// POST /turn client + the env flag that decides whether the kiosk runs against
// the real Kawan worker or the offline mock fixtures. KAWAN_API_BASE is unset
// in mock mode (USE_REAL_TURN === false) and fetchTurn short-circuits to null.

import type { TurnResponse } from "@/types/goodbois";

export const KAWAN_API_BASE =
  typeof process !== "undefined"
    ? process.env.NEXT_PUBLIC_KAWAN_API_BASE
    : undefined;

export const USE_REAL_TURN = Boolean(KAWAN_API_BASE);

export async function fetchTurn(payload: {
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
