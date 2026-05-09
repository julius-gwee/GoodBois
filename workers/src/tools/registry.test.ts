import { describe, it, expect } from "vitest";
import { ALLOWLIST, isAllowedTool } from "./registry";

describe("tool registry", () => {
  it("ALLOWLIST contains exactly the four MVP tools", () => {
    expect([...ALLOWLIST].sort()).toEqual(
      ["escalateToMpRc", "findNearby", "generateReceipt", "signpost"].sort(),
    );
  });

  it("isAllowedTool accepts allowlisted names", () => {
    expect(isAllowedTool("signpost")).toBe(true);
    expect(isAllowedTool("findNearby")).toBe(true);
    expect(isAllowedTool("generateReceipt")).toBe(true);
    expect(isAllowedTool("escalateToMpRc")).toBe(true);
  });

  it("isAllowedTool rejects simulateBooking and unknown names", () => {
    expect(isAllowedTool("simulateBooking")).toBe(false);
    expect(isAllowedTool("eval")).toBe(false);
    expect(isAllowedTool("")).toBe(false);
  });
});
