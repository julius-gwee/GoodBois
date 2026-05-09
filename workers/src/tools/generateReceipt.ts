import type { Receipt } from "../types/contracts";
import type { Repos } from "../db/repos";

export type GenerateReceiptArgs = {
  sessionId: string;
  caseId?: string;
  language: string;
  workerUrl: string;
};

export async function generateReceipt(
  args: GenerateReceiptArgs,
  repos: Pick<Repos, "receipts">,
): Promise<Receipt> {
  const placeholderUrl = "pending";
  const created = await repos.receipts.create(
    {
      sessionId: args.sessionId,
      caseId: args.caseId,
      language: args.language,
    },
    placeholderUrl,
  );
  const finalUrl = `${args.workerUrl.replace(/\/$/, "")}/receipts/${created.id}`;
  const stored = await repos.receipts.getById(created.id);
  if (stored) stored.pdfUrl = finalUrl;
  return { ...created, pdfUrl: finalUrl };
}
