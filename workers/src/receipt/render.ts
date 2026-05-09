import type { Case, Receipt } from "../types/contracts";

export type RenderReceiptInput = {
  receipt: Receipt;
  case?: Case;
};

const DISCLAIMER_EN = "This is not an official agency dispatch.";
const DISCLAIMER_ZH = "本回执并非政府机构正式派遣记录。";

export function renderReceiptHtml({ receipt, case: c }: RenderReceiptInput): string {
  return `<!doctype html>
<html lang="${escapeHtml(receipt.language)}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>GoodBois Receipt ${escapeHtml(receipt.id)}</title>
  <style>
    body { font-family: system-ui, -apple-system, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif; background: #fff; color: #111; margin: 0; padding: 2rem; }
    .receipt { max-width: 720px; margin: 0 auto; border: 2px solid #111; padding: 2rem; }
    h1 { font-size: 2rem; margin: 0 0 1rem; }
    h2 { font-size: 1.25rem; margin: 1.25rem 0 0.5rem; }
    .id { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 1rem; }
    .meta { color: #555; font-size: 0.9rem; }
    ul { padding-left: 1.25rem; }
    .disclaimer { margin-top: 2rem; padding: 1rem; background: #fff7e6; border-left: 4px solid #d97706; font-size: 0.95rem; }
    @media print { body { padding: 0; } .receipt { border: none; } }
  </style>
</head>
<body>
  <main class="receipt">
    <h1>GoodBois 回执 / Receipt</h1>
    <p class="id">${escapeHtml(receipt.id)}</p>
    <p class="meta">${escapeHtml(receipt.generatedAt)}</p>
    ${c ? renderCaseBlock(c) : ""}
    <div class="disclaimer">
      <p><strong>${escapeHtml(DISCLAIMER_ZH)}</strong></p>
      <p>${escapeHtml(DISCLAIMER_EN)}</p>
    </div>
  </main>
</body>
</html>`;
}

function renderCaseBlock(c: Case): string {
  const steps = c.suggestedNextSteps
    .map((s) => `<li>${escapeHtml(s)}</li>`)
    .join("");
  return `
    <h2>案件 / Case</h2>
    <p class="id">${escapeHtml(c.id)}</p>
    ${c.summaryUserLanguage ? `<p>${escapeHtml(c.summaryUserLanguage)}</p>` : ""}
    <p>${escapeHtml(c.summaryEnglish)}</p>
    ${steps ? `<h2>建议下一步 / Suggested next steps</h2><ul>${steps}</ul>` : ""}
  `;
}

function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
