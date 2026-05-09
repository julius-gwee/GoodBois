import type { AgencyContact, Case, Receipt, ToolInvocation } from "../types/contracts";
import { generateId } from "./ids";
import type {
  AgencyRepo,
  CaseRepo,
  NewCaseInput,
  NewReceiptInput,
  ReceiptRepo,
  Repos,
  ToolInvocationRepo,
} from "./repos";

export function createMemoryRepos(seedAgencies: AgencyContact[]): Repos {
  const agencies = new Map<string, AgencyContact>();
  for (const a of seedAgencies) agencies.set(a.key, a);

  const cases = new Map<string, Case>();
  const receipts = new Map<string, Receipt>();
  const toolInvocations: ToolInvocation[] = [];

  const agencyRepo: AgencyRepo = {
    async list(filter) {
      let rows = Array.from(agencies.values());
      if (filter?.category) rows = rows.filter((a) => a.category === filter.category);
      if (filter?.activeOnly) rows = rows.filter((a) => a.active);
      return rows;
    },
    async getByKey(key) {
      return agencies.get(key) ?? null;
    },
    async exists(key) {
      return agencies.has(key);
    },
  };

  const caseRepo: CaseRepo = {
    async create(input: NewCaseInput) {
      const id = generateId("GBC");
      const now = new Date().toISOString();
      const row: Case = { ...input, id, createdAt: now, status: "queued" };
      cases.set(id, row);
      return row;
    },
    async getById(id) {
      return cases.get(id) ?? null;
    },
    async listForExport() {
      return Array.from(cases.values()).filter(
        (c) => c.status === "queued" || c.status === "exported",
      );
    },
    async markExported(id, at) {
      const row = cases.get(id);
      if (!row) return;
      row.status = "exported";
      row.exportedAt = at;
      cases.set(id, row);
    },
  };

  const receiptRepo: ReceiptRepo = {
    async create(input: NewReceiptInput, pdfUrl: string) {
      const id = generateId("GBR");
      const row: Receipt = {
        ...input,
        id,
        pdfUrl,
        generatedAt: new Date().toISOString(),
      };
      receipts.set(id, row);
      return row;
    },
    async getById(id) {
      return receipts.get(id) ?? null;
    },
  };

  const toolInvocationRepo: ToolInvocationRepo = {
    async record(invocation) {
      toolInvocations.push(invocation);
    },
  };

  return {
    agencies: agencyRepo,
    cases: caseRepo,
    receipts: receiptRepo,
    toolInvocations: toolInvocationRepo,
  };
}
