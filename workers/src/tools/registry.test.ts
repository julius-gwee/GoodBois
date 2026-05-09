import { describe, it, expect } from "vitest";
import { ALLOWLIST, isAllowedTool } from "./registry";

describe("tool registry", () => {
  it("ALLOWLIST contains exactly the three MVP tools", () => {
    expect([...ALLOWLIST].sort()).toEqual(
      ["generateReceipt", "reportHazard", "signpost"].sort(),
    );
  });

  it("isAllowedTool accepts allowlisted names", () => {
    expect(isAllowedTool("signpost")).toBe(true);
    expect(isAllowedTool("reportHazard")).toBe(true);
    expect(isAllowedTool("generateReceipt")).toBe(true);
  });

  it("rejects retired tools and unknown names", () => {
    expect(isAllowedTool("findNearby")).toBe(false);
    expect(isAllowedTool("escalateToMpRc")).toBe(false);
    expect(isAllowedTool("simulateBooking")).toBe(false);
    expect(isAllowedTool("eval")).toBe(false);
    expect(isAllowedTool("")).toBe(false);
  });
});
