import type { Case } from "../types/contracts";

const COLUMNS = [
  "id",
  "createdAt",
  "language",
  "summaryEnglish",
  "transcript",
  "suggestedNextSteps",
  "residentBlock",
  "residentUnit",
  "residentNameAlias",
  "kioskId",
  "status",
  "sessionId",
] as const;

export function casesToCsv(cases: readonly Case[]): string {
  const lines = [COLUMNS.join(",")];
  for (const c of cases) {
    lines.push(
      [
        c.id,
        c.createdAt,
        c.language,
        c.summaryEnglish,
        c.transcript,
        c.suggestedNextSteps.join(";"),
        c.residentBlock ?? "",
        c.residentUnit ?? "",
        c.residentNameAlias ?? "",
        c.kioskId,
        c.status,
        c.sessionId,
      ]
        .map(quote)
        .join(","),
    );
  }
  return lines.join("\r\n");
}

function quote(value: string): string {
  if (value === "") return "";
  if (/[",\r\n]/.test(value)) {
    return `"${value.replaceAll('"', '""')}"`;
  }
  return value;
}
