import type {
  AgencyCategory,
  AgencyContact,
  Receipt,
  ToolInvocation,
} from "../types/contracts";

export type AgencyListFilter = {
  category?: AgencyCategory;
  activeOnly?: boolean;
};

export type NewReceiptInput = Omit<Receipt, "id" | "generatedAt">;

export interface AgencyRepo {
  list(filter?: AgencyListFilter): Promise<AgencyContact[]>;
  getByKey(key: string): Promise<AgencyContact | null>;
  exists(key: string): Promise<boolean>;
}

export interface ReceiptRepo {
  create(input: NewReceiptInput): Promise<Receipt>;
  getById(id: string): Promise<Receipt | null>;
}

export interface ToolInvocationRepo {
  record(invocation: ToolInvocation): Promise<void>;
}

export type Repos = {
  agencies: AgencyRepo;
  receipts: ReceiptRepo;
  toolInvocations: ToolInvocationRepo;
};
