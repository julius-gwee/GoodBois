// src/app/receipts/[id]/route.ts
//
// Mock receipt renderer for the kiosk demo. The real artifact is served by the
// Cloudflare worker (GET /receipts/:id — see workers/src/receipt/render.ts);
// in mock mode the kiosk points <ReceiptIframe> here so "View receipt" still
// shows a printable bilingual page without a backend running.

import {
  mockAgencyContact,
  mockHazardAgencyContact,
  mockHazardReceipt,
  mockLegalAidAgencyContact,
  mockLegalAidReceipt,
  mockReceipt,
} from "@/lib/mock-turn-fixtures";
import type { AgencyContact, Receipt } from "@/types/goodbois";

type ReceiptBundle = { receipt: Receipt; agency?: AgencyContact };

const MOCK_RECEIPTS: Record<string, ReceiptBundle> = {
  [mockReceipt.id]: { receipt: mockReceipt, agency: mockAgencyContact },
  [mockLegalAidReceipt.id]: {
    receipt: mockLegalAidReceipt,
    agency: mockLegalAidAgencyContact,
  },
  [mockHazardReceipt.id]: {
    receipt: mockHazardReceipt,
    agency: mockHazardAgencyContact,
  },
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const bundle = MOCK_RECEIPTS[id] ?? fallbackBundle(id);
  return new Response(renderReceiptHtml(bundle), {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function fallbackBundle(id: string): ReceiptBundle {
  return {
    receipt: {
      id,
      sessionId: "demo-session",
      language: "en",
      body: "Mock receipt — this kiosk is running without a backend.\nIn a live deployment this page is rendered by the GoodBois worker.",
      thingsToBring: [],
      generatedAt: new Date().toISOString(),
    },
  };
}

// --- bilingual HTML render (mirrors workers/src/receipt/render.ts) ----------

const DISCLAIMER_EN = "This is not an official agency dispatch.";
const DISCLAIMER_ZH = "本回执并非政府机构正式派遣记录。";

function renderReceiptHtml({ receipt, agency }: ReceiptBundle): string {
  return `<!doctype html>
<html lang="${escapeHtml(receipt.language)}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>GoodBois Receipt ${escapeHtml(receipt.id)}</title>
  <style>
    body { font-family: system-ui, -apple-system, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif; background: #f4efe6; color: #2b2a26; margin: 0; padding: 2rem; }
    .receipt { max-width: 720px; margin: 0 auto; background: #fff; border: 2px solid #2b2a26; border-radius: 8px; padding: 2rem; }
    h1 { font-size: 1.75rem; margin: 0 0 1rem; }
    h2 { font-size: 1.15rem; margin: 1.25rem 0 0.5rem; }
    .id { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 1rem; }
    .meta { color: #6b6a64; font-size: 0.9rem; }
    .body { white-space: pre-wrap; line-height: 1.5; }
    ul { padding-left: 1.25rem; line-height: 1.6; }
    .agency { margin-top: 0.5rem; padding: 1rem; background: #f4efe6; border-radius: 6px; }
    .agency p { margin: 0.25rem 0; }
    .hazard-ref { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
    .disclaimer { margin-top: 2rem; padding: 1rem; background: #fff7e6; border-left: 4px solid #d97706; font-size: 0.95rem; }
    .disclaimer p { margin: 0.25rem 0; }
    @media print { body { padding: 0; background: #fff; } .receipt { border: none; } }
  </style>
</head>
<body>
  <main class="receipt">
    <h1>GoodBois 回执 / Receipt</h1>
    <p class="id">${escapeHtml(receipt.id)}</p>
    <p class="meta">${escapeHtml(receipt.generatedAt)}</p>

    <h2>详情 / Details</h2>
    <p class="body">${escapeHtml(receipt.body)}</p>

    ${renderThingsToBring(receipt.thingsToBring)}
    ${receipt.caseSummary ? renderCaseSummary(receipt.caseSummary) : ""}
    ${agency ? renderAgencyBlock(agency, receipt.language) : ""}
    ${receipt.hazardReferenceId ? renderHazardRef(receipt.hazardReferenceId) : ""}

    <div class="disclaimer">
      <p><strong>${escapeHtml(DISCLAIMER_ZH)}</strong></p>
      <p>${escapeHtml(DISCLAIMER_EN)}</p>
    </div>
  </main>
</body>
</html>`;
}

function renderThingsToBring(items: string[]): string {
  if (!items.length) return "";
  const li = items.map((s) => `<li>${escapeHtml(s)}</li>`).join("");
  return `<h2>请携带 / Please bring</h2><ul>${li}</ul>`;
}

function renderCaseSummary(summary: string): string {
  return `<h2>案件摘要 / Case summary</h2><p>${escapeHtml(summary)}</p>`;
}

function renderAgencyBlock(agency: AgencyContact, language: string): string {
  const blurb =
    agency.multilingualBlurb[language] ?? agency.multilingualBlurb.en ?? "";
  return `
    <h2>联系 / Contact</h2>
    <div class="agency">
      <p><strong>${escapeHtml(agency.name)}</strong></p>
      ${agency.hotline ? `<p>${escapeHtml(agency.hotline)}</p>` : ""}
      ${agency.address ? `<p>${escapeHtml(agency.address)}</p>` : ""}
      ${agency.openingHours ? `<p>${escapeHtml(agency.openingHours)}</p>` : ""}
      ${blurb ? `<p>${escapeHtml(blurb)}</p>` : ""}
    </div>
  `;
}

function renderHazardRef(referenceId: string): string {
  return `<h2>报告编号 / Hazard reference</h2><p class="hazard-ref">${escapeHtml(referenceId)}</p>`;
}

function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
