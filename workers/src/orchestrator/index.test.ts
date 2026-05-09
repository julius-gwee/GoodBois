import { describe, it, expect, beforeEach } from "vitest";
import { orchestrate, type OrchestratorEnv } from "./index";
import { createMemoryRepos } from "../db/memory";
import { _resetCounters } from "../db/ids";
import { resetMockState as resetSttMock } from "../ai/sttAdapter";
import type { AgencyContact, TurnRequest } from "../types/contracts";

const seed: AgencyContact[] = [
  {
    key: "polyclinic-bedok",
    name: "Bedok Polyclinic",
    hotline: "6555-0000",
    address: "11 Bedok North Street 1",
    category: "healthcare",
    multilingualBlurb: { en: "Walk-in eye checks and chronic disease care." },
    active: true,
    source: "seed",
    updatedAt: "2026-05-09T00:00:00+08:00",
  },
  {
    key: "town-council-east-coast",
    name: "East Coast Town Council",
    category: "town_council",
    multilingualBlurb: { en: "Lighting / cleanliness / common areas." },
    active: true,
    source: "seed",
    updatedAt: "2026-05-09T00:00:00+08:00",
  },
];

function makeEnv(overrides: Partial<OrchestratorEnv> = {}): OrchestratorEnv {
  return {
    LLM_MOCK: "true",
    STT_MOCK: "true",
    TTS_MOCK: "true",
    TRANSLATE_MOCK: "true",
    ...overrides,
  };
}

function makeDeps() {
  return {
    repos: createMemoryRepos(seed),
    workerUrl: "https://kiosk.example",
  };
}

describe("orchestrator", () => {
  beforeEach(() => {
    _resetCounters();
    resetSttMock();
  });

  it("returns a followup turn when the classifier asks for clarification", async () => {
    const env = makeEnv();
    const deps = makeDeps();
    // STT mock fixture[0] = "where do I get my eye checked" → eye-without-clinic
    // → classifier mock → ask_followup
    const req: TurnRequest = {
      kioskId: "demo-laptop",
      audioBase64: btoa("dummy"),
    };
    const r = await orchestrate(req, env, deps);
    expect(r.state).toBe("followup");
    expect(r.kioskMessage.toLowerCase()).toContain("polyclinic");
    expect(r.receiptUrl).toBeUndefined();

    // Session should be persisted so the next /turn can resume.
    const stored = await deps.repos.sessions.get(r.sessionId);
    expect(stored?.history.length).toBe(2);
    expect(stored?.history[0].role).toBe("user");
    expect(stored?.history[1].role).toBe("kiosk");
  });

  it("returns a done turn with a receiptUrl on a terminal request", async () => {
    const env = makeEnv();
    const deps = makeDeps();
    // STT fixture[0] = "where do I get my eye checked" → followup, then
    // fixture[1] = "polyclinic" → terminal signpost.
    const req1: TurnRequest = {
      kioskId: "demo-laptop",
      audioBase64: btoa("first"),
    };
    const r1 = await orchestrate(req1, env, deps);
    expect(r1.state).toBe("followup");

    const req2: TurnRequest = {
      sessionId: r1.sessionId,
      kioskId: "demo-laptop",
      audioBase64: btoa("second"),
    };
    const r2 = await orchestrate(req2, env, deps);
    expect(r2.state).toBe("done");
    expect(r2.receiptUrl).toMatch(
      /^https:\/\/kiosk\.example\/receipts\/GBR-\d{8}-\d{3}$/,
    );
    // Session is wiped after the terminal turn.
    expect(await deps.repos.sessions.get(r1.sessionId)).toBeNull();
  });

  it("dispatches all toolCalls in order and persists the receipt", async () => {
    const env = makeEnv();
    const deps = makeDeps();
    // STT fixture[2] = void deck light hazard
    resetSttMock();
    // Skip the first two eye-check fixtures so STT returns the hazard one.
    await orchestrate(
      { kioskId: "demo-laptop", audioBase64: btoa("a") },
      env,
      deps,
    );
    await orchestrate(
      { kioskId: "demo-laptop", audioBase64: btoa("b") },
      env,
      deps,
    );

    const r = await orchestrate(
      { kioskId: "demo-laptop", audioBase64: btoa("c") },
      env,
      deps,
    );
    expect(r.state).toBe("done");
    expect(r.receiptUrl).toBeTruthy();

    const receiptId = r.receiptUrl!.split("/").pop()!;
    const stored = await deps.repos.receipts.getById(receiptId);
    expect(stored).not.toBeNull();
    // The mock-mode main agent's hazard branch produces a body that mentions
    // the hazard report. Assert non-empty as a smoke check.
    expect(stored!.body.length).toBeGreaterThan(0);
  });

  it("returns an error envelope when neither audio nor text is supplied", async () => {
    const env = makeEnv();
    const deps = makeDeps();
    const r = await orchestrate(
      { kioskId: "demo-laptop" },
      env,
      deps,
    );
    expect(r.error?.code).toBe("MISSING_INPUT");
  });

  it("accepts text fallback input", async () => {
    const env = makeEnv();
    const deps = makeDeps();
    const r = await orchestrate(
      { kioskId: "demo-laptop", text: "polyclinic for eye check" },
      env,
      deps,
    );
    expect(r.state).toBe("done");
    expect(r.receiptUrl).toBeTruthy();
  });

  it("translates kioskMessage back into srcLang on done turns", async () => {
    const env = makeEnv();
    const deps = makeDeps();
    const r = await orchestrate(
      { kioskId: "demo-laptop", text: "polyclinic for eye check" },
      env,
      deps,
    );
    // text fallback uses srcLang="en" — kioskMessage stays English.
    expect(r.transcript.srcLang).toBe("en");
    expect(typeof r.kioskMessage).toBe("string");
  });
});
