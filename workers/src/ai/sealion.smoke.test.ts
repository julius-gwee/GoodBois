// workers/src/ai/sealion.smoke.test.ts
//
// Real-API smoke tests for the SEALion-backed adapters. Auto-skip when
// SEALION_API_KEY isn't present so unit-test runs stay fast and offline.
//
// Run only the smokes:
//   cd workers
//   SEALION_API_KEY=$(grep SEALION_API_KEY .env.local | cut -d= -f2) \
//     npx vitest run src/ai/sealion.smoke.test.ts --reporter=verbose

import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import { classify, decide, type LlmEnv } from "./llmAdapter";
import { translateAdapter } from "./translateAdapter";

function loadEnvLocal(): Record<string, string> {
  const envPath = path.resolve(__dirname, "../../.env.local");
  if (!fs.existsSync(envPath)) return {};
  const out: Record<string, string> = {};
  for (const rawLine of fs.readFileSync(envPath, "utf8").split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq < 0) continue;
    out[line.slice(0, eq).trim()] = line.slice(eq + 1).trim();
  }
  return out;
}

const fileEnv = loadEnvLocal();
const SEALION_API_KEY =
  process.env.SEALION_API_KEY ?? fileEnv.SEALION_API_KEY;

const env: LlmEnv = { SEALION_API_KEY };

const runner = SEALION_API_KEY ? describe : describe.skip;

runner("SEALion smoke — translateAdapter", () => {
  it("translates Mandarin → English", async () => {
    const r = await translateAdapter(
      { text: "我的电梯坏了，我没办法去医院。", from: "zh-Hans", to: "en" },
      env,
    );
    console.log("translate →", r.translated);
    expect(r.translated.toLowerCase()).toMatch(/lift|elevator|broken/);
  });
});

runner("SEALion smoke — classify", () => {
  it("returns ask_followup for an underspecified eye-check query", async () => {
    const r = await classify(
      { transcriptEn: "where do I get my eye checked", history: [] },
      env,
    );
    console.log("classify[underspecified] →", r);
    expect([
      "signpost",
      "report_hazard",
      "out_of_scope",
      "ask_followup",
    ]).toContain(r.requestType);
  });

  it("returns report_hazard for a void-deck light", async () => {
    const r = await classify(
      {
        transcriptEn: "the void deck light is broken, someone will trip",
        history: [],
      },
      env,
    );
    console.log("classify[hazard] →", r);
    expect(r.requestType).toBe("report_hazard");
  });

  it("returns out_of_scope for a 995 emergency", async () => {
    const r = await classify(
      { transcriptEn: "I need an ambulance now", history: [] },
      env,
    );
    console.log("classify[emergency] →", r);
    expect(r.requestType).toBe("out_of_scope");
  });
});

runner("SEALion smoke — decide", () => {
  const agencyKeys = [
    "polyclinic-bedok",
    "town-council-east-coast",
    "mp-bedok-east",
    "hdb_essential_maintenance",
  ];

  // decide() emits more tokens than classify() so it's slower; 30s is comfortably
  // above the observed ~6–10s real-API latency.
  const TIMEOUT_MS = 30_000;

  it("emits a mandatory generateReceipt call for a signpost decision", { timeout: TIMEOUT_MS }, async () => {
    const r = await decide(
      {
        requestType: "signpost",
        transcriptEn: "polyclinic for an eye check",
        history: [],
        agencyKeys,
        srcLang: "zh-Hans",
      },
      env,
    );
    console.log("decide[signpost] →", JSON.stringify(r, null, 2));
    expect(r.toolCalls.some((c) => c.name === "generateReceipt")).toBe(true);
    const recipe = r.toolCalls.find((c) => c.name === "generateReceipt");
    if (recipe?.name !== "generateReceipt") throw new Error("missing receipt");
    expect(recipe.args.language).toBe("zh-Hans");
  });

  it("orders reportHazard before generateReceipt", { timeout: TIMEOUT_MS }, async () => {
    const r = await decide(
      {
        requestType: "report_hazard",
        transcriptEn: "the void deck light is broken",
        history: [],
        agencyKeys,
        srcLang: "en",
      },
      env,
    );
    console.log("decide[hazard] →", JSON.stringify(r, null, 2));
    const names = r.toolCalls.map((c) => c.name);
    if (names.includes("reportHazard") && names.includes("generateReceipt")) {
      expect(names.indexOf("reportHazard")).toBeLessThan(
        names.indexOf("generateReceipt"),
      );
    }
    expect(names).toContain("generateReceipt");
  });
});
