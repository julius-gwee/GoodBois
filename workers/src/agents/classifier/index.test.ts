import { describe, it, expect } from "vitest";
import { runClassifier, MAX_FOLLOWUPS } from "./index";
import type { LlmEnv } from "../../ai/llmAdapter";
import type { KioskSessionMessage } from "../../types/contracts";

const mockEnv: LlmEnv = { LLM_MOCK: "true" };

function userHistory(turns: number): KioskSessionMessage[] {
  const h: KioskSessionMessage[] = [];
  for (let i = 0; i < turns; i++) {
    h.push({ role: "user", textEnglish: `turn ${i}`, spokenAt: "" });
    h.push({ role: "kiosk", textEnglish: "follow-up?", spokenAt: "" });
  }
  return h;
}

describe("runClassifier", () => {
  it("returns ask_followup early in the conversation when the request is unclear", async () => {
    const r = await runClassifier(
      { transcriptEn: "the lift is broken", history: [] },
      mockEnv,
    );
    expect(r.requestType).toBe("ask_followup");
    expect(r.followupPrompt?.length ?? 0).toBeGreaterThan(0);
  });

  it("returns signpost for a clear-enough request", async () => {
    const r = await runClassifier(
      { transcriptEn: "polyclinic for eye check", history: [] },
      mockEnv,
    );
    expect(r.requestType).toBe("signpost");
  });

  it("returns report_hazard for a hazard input", async () => {
    const r = await runClassifier(
      {
        transcriptEn: "the void deck light is broken, someone will fall",
        history: [],
      },
      mockEnv,
    );
    expect(r.requestType).toBe("report_hazard");
  });

  it("returns out_of_scope for emergencies", async () => {
    const r = await runClassifier(
      { transcriptEn: "I need an ambulance now", history: [] },
      mockEnv,
    );
    expect(r.requestType).toBe("out_of_scope");
  });

  it("forces a terminal decision once the resident has hit MAX_FOLLOWUPS", async () => {
    const history = userHistory(MAX_FOLLOWUPS);
    const r = await runClassifier(
      { transcriptEn: "the lift is broken", history },
      mockEnv,
    );
    expect(r.requestType).not.toBe("ask_followup");
  });

  it("downgrades to out_of_scope when a followup decision lacks a prompt string", async () => {
    // Stub a fake AI binding that returns ask_followup with an empty prompt.
    const env: LlmEnv = {
      AI: {
        async run() {
          return {
            response: JSON.stringify({
              requestType: "ask_followup",
              followupPrompt: "   ",
            }),
          };
        },
      },
    };
    const r = await runClassifier(
      { transcriptEn: "??", history: [] },
      env,
    );
    expect(r.requestType).toBe("out_of_scope");
  });
});
