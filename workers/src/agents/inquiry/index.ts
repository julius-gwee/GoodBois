// workers/src/agents/inquiry/index.ts
//
// Inquiry agent — decides whether to ask a follow-up question or proceed to
// triage. Bounded to 3 follow-ups. Mock-mode uses keyword heuristics; real-mode
// calls the LLM adapter.

import { llmAdapter, type LlmEnv } from "../../ai/llmAdapter";

export type InquiryInput = {
  transcriptEnglish: string;
  turnCount: number;
  language: string;
};

export type InquiryOutput =
  | { kind: "ask_followup"; question: string }
  | { kind: "proceed" };

const MAX_FOLLOWUPS = 3;

const SYSTEM_PROMPT =
  "You are an eldercare kiosk inquiry agent. Read the resident's request " +
  "and decide if ONE short follow-up question (no more than 15 words) " +
  "would clarify their need before signposting. If the request is already " +
  'clear, proceed. Respond with JSON only: ' +
  '{"action":"ask"|"proceed","question":"<your question if action is ask>"}.';

function isMockMode(env: LlmEnv): boolean {
  if (env.LLM_MOCK === "true") return true;
  // Real mode is available if EITHER Cloudflare Workers AI is bound OR a
  // SEALion API key is set (llmAdapter prefers SEALion when both are present).
  if (env.AI || env.SEALION_API_KEY) return false;
  return true;
}

function mockInquiry(transcriptEnglish: string): InquiryOutput {
  const text = transcriptEnglish.toLowerCase();
  // Lift fault without specific block/floor → ask
  if (
    (text.includes("lift") || text.includes("elevator")) &&
    !text.includes("block") &&
    !text.includes("level")
  ) {
    return {
      kind: "ask_followup",
      question: "Which block and floor do you live at?",
    };
  }
  return { kind: "proceed" };
}

export async function runInquiry(
  input: InquiryInput,
  env: LlmEnv
): Promise<InquiryOutput> {
  if (input.turnCount >= MAX_FOLLOWUPS) {
    return { kind: "proceed" };
  }

  if (isMockMode(env)) {
    return mockInquiry(input.transcriptEnglish);
  }

  const result = await llmAdapter<{
    action: "ask" | "proceed";
    question?: string;
  }>(
    {
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: input.transcriptEnglish },
      ],
    },
    env
  );

  if (
    result.parsed?.action === "ask" &&
    result.parsed.question &&
    result.parsed.question.trim().length > 0
  ) {
    return { kind: "ask_followup", question: result.parsed.question.trim() };
  }
  return { kind: "proceed" };
}
