import type { SessionCase } from "./types";

export type NewSessionCaseInput = Omit<SessionCase, "id" | "createdAt">;

export interface SessionCaseRepo {
  create(input: NewSessionCaseInput, id: string, createdAt: string): Promise<SessionCase>;
  getById(id: string): Promise<SessionCase | null>;
  getLatestBySessionId(sessionId: string): Promise<SessionCase | null>;
}
