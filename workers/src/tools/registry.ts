export const ALLOWLIST = [
  "signpost",
  "findNearby",
  "generateReceipt",
  "escalateToMpRc",
] as const;

export type ToolName = (typeof ALLOWLIST)[number];

const allowedSet = new Set<string>(ALLOWLIST);

export function isAllowedTool(name: string): name is ToolName {
  return allowedSet.has(name);
}
