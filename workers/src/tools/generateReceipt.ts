// workers/src/tools/generateReceipt.ts
//
// Builds a receipt row in the repo and returns the URL the kiosk shows in the
// final iframe. The orchestrator hydrates `hazardReferenceId` from a prior
// reportHazard result before this tool runs (see registry.ts).
//
// Dev B: this is the seam to flesh out. Concerns to add later:
//   - Printer adapter (POS / thermal / HTML-to-print)
//   - Email adapter (Cloudflare Email Routing) for receipt + hazard dispatch
//   - Real D1 persistence (currently in-memory via createMemoryRepos)

import type {
  GenerateReceiptArgs,
  GenerateReceiptResult,
} from "../types/contracts";
import type { Repos } from "../db/repos";

export type GenerateReceiptCtx = {
  repos: Pick<Repos, "receipts">;
  workerUrl: string;
  sessionId: string;
};

export async function generateReceipt(
  args: GenerateReceiptArgs,
  ctx: GenerateReceiptCtx,
): Promise<GenerateReceiptResult> {
  const created = await ctx.repos.receipts.create({
    sessionId: ctx.sessionId,
    language: args.language,
    body: args.body,
    thingsToBring: args.thingsToBring ?? [],
    caseSummary: args.caseSummary,
    signpostedAgencyKey: args.signpostedAgencyKey,
    hazardReferenceId: args.hazardReferenceId,
  });
  const url = `${ctx.workerUrl.replace(/\/$/, "")}/receipts/${created.id}`;
  return { receiptId: created.id, url };
}
