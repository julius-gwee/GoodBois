import type {
  AgencyContact,
  Receipt,
  ToolInvocation,
} from "../types/contracts";
import { generateId } from "./ids";
import type {
  AgencyRepo,
  NewReceiptInput,
  ReceiptRepo,
  Repos,
  ToolInvocationRepo,
} from "./repos";

export function createMemoryRepos(seedAgencies: AgencyContact[]): Repos {
  const agencies = new Map<string, AgencyContact>();
  for (const a of seedAgencies) agencies.set(a.key, a);

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

  const receiptRepo: ReceiptRepo = {
    async create(input: NewReceiptInput) {
      const id = generateId("GBR");
      const row: Receipt = {
        ...input,
        id,
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
    receipts: receiptRepo,
    toolInvocations: toolInvocationRepo,
  };
}
