import { describe, it, expect } from "vitest";
import { runMainAgent, type MainAgentInput } from "./index";
import type { LlmEnv } from "../../ai/llmAdapter";

const baseInput: MainAgentInput = {
  requestType: "signpost",
  transcriptEn: "polyclinic eye check",
  history: [],
  agencyKeys: ["polyclinic-bedok", "town-council-east-coast"],
  srcLang: "zh-Hans",
};

// Build an LlmEnv whose AI binding returns the queued JSON responses in order.
// Lets us script "first call missing receipt, second call has receipt" etc.
function makeQueuedAi(...responses: string[]): LlmEnv {
  const queue = [...responses];
  return {
    AI: {
      async run() {
        const next = queue.shift() ?? responses[responses.length - 1];
        return { response: next };
      },
    },
  };
}

describe("runMainAgent", () => {
  it("happy path: passes a valid decision through unchanged", async () => {
    const env = makeQueuedAi(
      JSON.stringify({
        requestType: "signpost",
        kioskMessage: "Bedok Polyclinic — eye checks until 4pm.",
        toolCalls: [
          { name: "signpost", args: { agencyKey: "polyclinic-bedok" } },
          {
            name: "generateReceipt",
            args: { body: "details", language: "zh-Hans" },
          },
        ],
      }),
    );
    const r = await runMainAgent(baseInput, env);
    expect(r.toolCalls.map((c) => c.name)).toEqual([
      "signpost",
      "generateReceipt",
    ]);
  });

  it("retries when the first response omits generateReceipt", async () => {
    let callCount = 0;
    const env: LlmEnv = {
      AI: {
        async run() {
          callCount++;
          if (callCount === 1) {
            return {
              response: JSON.stringify({
                requestType: "signpost",
                kioskMessage: "I forgot the receipt.",
                toolCalls: [
                  { name: "signpost", args: { agencyKey: "polyclinic-bedok" } },
                ],
              }),
            };
          }
          return {
            response: JSON.stringify({
              requestType: "signpost",
              kioskMessage: "Here you go.",
              toolCalls: [
                { name: "signpost", args: { agencyKey: "polyclinic-bedok" } },
                {
                  name: "generateReceipt",
                  args: { body: "details", language: "zh-Hans" },
                },
              ],
            }),
          };
        },
      },
    };
    const r = await runMainAgent(baseInput, env);
    expect(callCount).toBe(2);
    expect(r.toolCalls.some((c) => c.name === "generateReceipt")).toBe(true);
  });

  it("synthesises a generateReceipt when both attempts omit it", async () => {
    let callCount = 0;
    const env: LlmEnv = {
      AI: {
        async run() {
          callCount++;
          return {
            response: JSON.stringify({
              requestType: "signpost",
              kioskMessage: "Try the polyclinic.",
              toolCalls: [
                { name: "signpost", args: { agencyKey: "polyclinic-bedok" } },
              ],
            }),
          };
        },
      },
    };
    const r = await runMainAgent(baseInput, env);
    expect(callCount).toBe(2);
    expect(r.toolCalls.some((c) => c.name === "generateReceipt")).toBe(true);

    const recipe = r.toolCalls.find((c) => c.name === "generateReceipt");
    if (recipe?.name !== "generateReceipt") throw new Error("missing receipt");
    // The synthesised receipt carries the kioskMessage as the body, the
    // signposted agency from the prior tool call, and the input srcLang.
    expect(recipe.args.body).toBe("Try the polyclinic.");
    expect(recipe.args.signpostedAgencyKey).toBe("polyclinic-bedok");
    expect(recipe.args.language).toBe("zh-Hans");
  });

  it("synthesised generateReceipt is appended last so prior tools run first", async () => {
    const env: LlmEnv = {
      AI: {
        async run() {
          return {
            response: JSON.stringify({
              requestType: "report_hazard",
              kioskMessage: "Filed.",
              toolCalls: [
                {
                  name: "reportHazard",
                  args: {
                    category: "lighting",
                    location: "void deck",
                    description: "broken",
                  },
                },
              ],
            }),
          };
        },
      },
    };
    const r = await runMainAgent(
      { ...baseInput, requestType: "report_hazard" },
      env,
    );
    const names = r.toolCalls.map((c) => c.name);
    expect(names).toEqual(["reportHazard", "generateReceipt"]);
  });

  it("mock backend returns a valid decision in one call", async () => {
    // Mock decide() always includes generateReceipt, so no retry occurs.
    const env: LlmEnv = { LLM_MOCK: "true" };
    const r = await runMainAgent(baseInput, env);
    expect(r.toolCalls.some((c) => c.name === "generateReceipt")).toBe(true);
  });
});
