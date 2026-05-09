import type {
  AgencyCategory,
  AgencyContact,
  Case,
  Receipt,
  ToolInvocation,
} from "../types/contracts";

export type AgencyListFilter = {
  category?: AgencyCategory;
  activeOnly?: boolean;
};

export type NewCaseInput = Omit<Case, "id" | "createdAt" | "status" | "exportedAt"> & {
  exportChannel?: Case["exportChannel"];
};

export type NewReceiptInput = Omit<Receipt, "id" | "generatedAt" | "pdfUrl">;

export interface AgencyRepo {
  list(filter?: AgencyListFilter): Promise<AgencyContact[]>;
  getByKey(key: string): Promise<AgencyContact | null>;
  exists(key: string): Promise<boolean>;
}

export interface CaseRepo {
  create(input: NewCaseInput): Promise<Case>;
  getById(id: string): Promise<Case | null>;
  listForExport(): Promise<Case[]>;
  markExported(id: string, at: string): Promise<void>;
}

export interface ReceiptRepo {
  create(input: NewReceiptInput, pdfUrl: string): Promise<Receipt>;
  getById(id: string): Promise<Receipt | null>;
}

export interface ToolInvocationRepo {
  record(invocation: ToolInvocation): Promise<void>;
}

export type Repos = {
  agencies: AgencyRepo;
  cases: CaseRepo;
  receipts: ReceiptRepo;
  toolInvocations: ToolInvocationRepo;
};
