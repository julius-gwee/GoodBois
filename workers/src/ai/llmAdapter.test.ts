import { describe, it, expect } from "vitest";
import { classify, decide, type LlmEnv } from "./llmAdapter";
import type { KioskSessionMessage } from "../types/contracts";

const mockEnv: LlmEnv = { LLM_MOCK: "true" };

const noHistory: KioskSessionMessage[] = [];

describe("classify (mock)", () => {
  it("returns ask_followup for an underspecified lift fault", async () => {
    const r = await classify(
      { transcriptEn: "the lift is broken", history: noHistory },
      mockEnv,
    );
    expect(r.requestType).toBe("ask_followup");
    expect(r.followupPrompt).toBeTruthy();
  });

  it("returns signpost once the resident has narrowed down a polyclinic", async () => {
    const r = await classify(
      { transcriptEn: "polyclinic", history: noHistory },
      mockEnv,
    );
    expect(r.requestType).toBe("signpost");
  });

  it("returns report_hazard for void-deck light", async () => {
    const r = await classify(
      {
        transcriptEn: "the broken light at the void deck is a trip hazard",
        history: noHistory,
      },
      mockEnv,
    );
    expect(r.requestType).toBe("report_hazard");
  });

  it("returns out_of_scope for emergencies", async () => {
    const r = await classify(
      { transcriptEn: "I need an ambulance now", history: noHistory },
      mockEnv,
    );
    expect(r.requestType).toBe("out_of_scope");
  });

  it("stops asking follow-ups after 3 user turns", async () => {
    const history: KioskSessionMessage[] = [
      { role: "user", textEnglish: "lift broken", spokenAt: "" },
      { role: "kiosk", textEnglish: "Which block?", spokenAt: "" },
      { role: "user", textEnglish: "I am not sure", spokenAt: "" },
      { role: "kiosk", textEnglish: "Which floor?", spokenAt: "" },
      { role: "user", textEnglish: "I forgot", spokenAt: "" },
    ];
    const r = await classify(
      { transcriptEn: "lift broken still", history },
      mockEnv,
    );
    expect(r.requestType).not.toBe("ask_followup");
  });
});

describe("decide (mock)", () => {
  const baseInput = {
    transcriptEn: "where do I get my eye checked",
    history: noHistory,
    agencyKeys: ["polyclinic-bedok", "town-council-east-coast"],
    srcLang: "zh-SG",
  };

  it("always emits a generateReceipt call", async () => {
    const r = await decide({ ...baseInput, requestType: "signpost" }, mockEnv);
    expect(r.toolCalls.some((c) => c.name === "generateReceipt")).toBe(true);
  });

  it("orders reportHazard before generateReceipt", async () => {
    const r = await decide(
      { ...baseInput, requestType: "report_hazard" },
      mockEnv,
    );
    const names = r.toolCalls.map((c) => c.name);
    expect(names.indexOf("reportHazard")).toBeLessThan(
      names.indexOf("generateReceipt"),
    );
  });

  it("propagates srcLang into generateReceipt.args.language", async () => {
    const r = await decide({ ...baseInput, requestType: "signpost" }, mockEnv);
    const recipe = r.toolCalls.find((c) => c.name === "generateReceipt");
    if (recipe?.name !== "generateReceipt") throw new Error("missing receipt");
    expect(recipe.args.language).toBe("zh-SG");
  });

  it("uses an allowlisted agency key for signpost", async () => {
    const r = await decide({ ...baseInput, requestType: "signpost" }, mockEnv);
    const sp = r.toolCalls.find((c) => c.name === "signpost");
    if (sp?.name !== "signpost") throw new Error("missing signpost");
    expect(baseInput.agencyKeys).toContain(sp.args.agencyKey);
  });

  it("kioskMessage is a non-empty short English string", async () => {
    const r = await decide({ ...baseInput, requestType: "signpost" }, mockEnv);
    expect(r.kioskMessage.length).toBeGreaterThan(0);
    expect(r.kioskMessage.length).toBeLessThan(400);
  });
});

describe("decide validation (real-mode JSON sanitisation)", () => {
  // Stub a fake AI binding that returns deterministic JSON. Mirrors what a
  // real model would emit; lets us exercise the parsing/sanitise path
  // without hitting SEALion or Workers AI.
  function makeFakeAiEnv(jsonResponse: string): LlmEnv {
    return {
      AI: {
        async run() {
          return { response: jsonResponse };
        },
      },
    };
  }

  const baseInput = {
    requestType: "signpost" as const,
    transcriptEn: "polyclinic eye check",
    history: noHistory,
    agencyKeys: ["polyclinic-bedok"],
    srcLang: "en-SG",
  };

  it("strips unknown tool names", async () => {
    const env = makeFakeAiEnv(
      JSON.stringify({
        requestType: "signpost",
        kioskMessage: "Here you go.",
        toolCalls: [
          { name: "evilTool", args: { foo: "bar" } },
          { name: "signpost", args: { agencyKey: "polyclinic-bedok" } },
          {
            name: "generateReceipt",
            args: { body: "x", language: "en-SG" },
          },
        ],
      }),
    );
    const r = await decide(baseInput, env);
    expect(r.toolCalls.map((c) => c.name)).toEqual([
      "signpost",
      "generateReceipt",
    ]);
  });

  it("falls back to mock when the model returns garbage", async () => {
    const env = makeFakeAiEnv("not json at all");
    const r = await decide(baseInput, env);
    expect(r.toolCalls.length).toBeGreaterThan(0);
    expect(r.toolCalls.some((c) => c.name === "generateReceipt")).toBe(true);
  });

  it("clamps an invalid requestType back to the input requestType", async () => {
    const env = makeFakeAiEnv(
      JSON.stringify({
        requestType: "make_pizza",
        kioskMessage: "ok",
        toolCalls: [
          {
            name: "generateReceipt",
            args: { body: "x", language: "en-SG" },
          },
        ],
      }),
    );
    const r = await decide(baseInput, env);
    expect(r.requestType).toBe("signpost");
  });
});
