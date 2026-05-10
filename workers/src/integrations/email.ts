// workers/src/integrations/email.ts
//
// Thin Resend (https://resend.com) HTTP adapter + a hazard-specific mailer
// factory. The Worker entrypoint builds the mailer once per request from
// env vars and passes it through ToolCtx; `reportHazard` invokes it
// fire-and-forget so email failures never block the kiosk.

export type ResendSendOpts = {
  apiKey: string;
  from: string;        // e.g. "GoodBois <onboarding@resend.dev>"
  to: string[];        // one or more recipients
  subject: string;
  html: string;
  text: string;
};

/**
 * Sends a single email via Resend. Throws on non-2xx responses with
 * the response text included for debugging.
 */
export async function sendResendEmail(opts: ResendSendOpts): Promise<void> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${opts.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: opts.from,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "<unreadable>");
    throw new Error(`Resend send failed: ${res.status} ${body}`);
  }
}

// ---------------------------------------------------------------------------
// Hazard-specific mailer
// ---------------------------------------------------------------------------

export type HazardMailerConfig = {
  apiKey: string;          // RESEND_API_KEY
  recipient: string;       // HAZARD_NOTIFY_EMAIL
  from?: string;           // HAZARD_FROM_EMAIL; default "GoodBois <onboarding@resend.dev>"
};

export type HazardEmailInput = {
  category: string;
  location: string;
  description: string;
  referenceId: string;
  routedTo: string;
  sessionId?: string;
  srcLang?: string;
};

export type HazardMailer = (input: HazardEmailInput) => Promise<void>;

/**
 * Returns a HazardMailer bound to the given config, or `undefined` if the
 * config is missing required fields (no API key or no recipient). The
 * caller can then `if (mailer)` before invoking.
 */
export function makeHazardMailer(config: Partial<HazardMailerConfig>): HazardMailer | undefined {
  if (!config.apiKey || !config.recipient) return undefined;
  const apiKey = config.apiKey;
  const recipient = config.recipient;
  const from = config.from ?? "GoodBois <onboarding@resend.dev>";

  return async (input: HazardEmailInput): Promise<void> => {
    const subject = `[GoodBois] Hazard report ${input.referenceId}: ${input.category}`;
    const text = formatHazardText(input);
    const html = formatHazardHtml(input);
    await sendResendEmail({ apiKey, from, to: [recipient], subject, html, text });
  };
}

function formatHazardText(i: HazardEmailInput): string {
  const lines = [
    `GoodBois Kiosk — Hazard Report`,
    ``,
    `Reference: ${i.referenceId}`,
    `Category: ${i.category}`,
    `Location: ${i.location}`,
    `Description: ${i.description}`,
    `Routed to: ${i.routedTo}`,
  ];
  if (i.srcLang) lines.push(`Spoken language: ${i.srcLang}`);
  if (i.sessionId) lines.push(`Session: ${i.sessionId}`);
  lines.push(``);
  lines.push(`Reported via the GoodBois kiosk demo. This is a real email triggered`);
  lines.push(`by a real ${i.category} report submitted at the kiosk.`);
  return lines.join("\n");
}

function formatHazardHtml(i: HazardEmailInput): string {
  const safe = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const meta: [string, string][] = [
    ["Reference", safe(i.referenceId)],
    ["Category", safe(i.category)],
    ["Location", safe(i.location)],
    ["Description", safe(i.description)],
    ["Routed to", safe(i.routedTo)],
  ];
  if (i.srcLang) meta.push(["Spoken language", safe(i.srcLang)]);
  if (i.sessionId) meta.push(["Session", safe(i.sessionId)]);
  const rows = meta
    .map(
      ([k, v]) =>
        `<tr><td style="padding:4px 12px 4px 0;color:#555;vertical-align:top">${k}</td><td style="padding:4px 0">${v}</td></tr>`,
    )
    .join("");
  return `<!doctype html>
<html><body style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;color:#111;max-width:560px;margin:0 auto;padding:24px">
  <h2 style="margin:0 0 12px">GoodBois Kiosk — Hazard Report</h2>
  <p style="margin:0 0 16px;color:#555">A real hazard report was submitted at the kiosk.</p>
  <table style="border-collapse:collapse;font-size:14px">${rows}</table>
  <p style="margin:24px 0 0;color:#888;font-size:12px">Reported via the GoodBois kiosk demo (Good Hack 2026).</p>
</body></html>`;
}
