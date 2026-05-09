import type { AgencyCategory } from "../../types/contracts";
import type { Location, SessionCase, SessionReceipt } from "./types";

export type LocationFilter = {
  category?: AgencyCategory;
  activeOnly?: boolean;
};

export interface LocationRepo {
  list(filter?: LocationFilter): Promise<Location[]>;
  getByKey(key: string): Promise<Location | null>;
  exists(key: string): Promise<boolean>;
}

export type NewSessionCaseInput = Omit<SessionCase, "id" | "createdAt">;

export interface SessionCaseRepo {
  create(input: NewSessionCaseInput, id: string, createdAt: string): Promise<SessionCase>;
  getById(id: string): Promise<SessionCase | null>;
  getLatestBySessionId(sessionId: string): Promise<SessionCase | null>;
}

export type NewSessionReceiptInput = Omit<SessionReceipt, "id" | "generatedAt">;

export interface SessionReceiptRepo {
  create(input: NewSessionReceiptInput, id: string, generatedAt: string): Promise<SessionReceipt>;
  getById(id: string): Promise<SessionReceipt | null>;
}

export type D1Repos = {
  locations: LocationRepo;
  cases: SessionCaseRepo;
  receipts: SessionReceiptRepo;
};
