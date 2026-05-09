import { describe, it, expect, beforeEach } from "vitest";
import { generateId, _resetCounters } from "./ids";

describe("generateId", () => {
  beforeEach(() => _resetCounters());

  it("formats GBR ids with SG date and 3-digit zero-padded counter", () => {
    const noonSgt = new Date("2026-05-09T04:00:00Z"); // = SGT 2026-05-09 12:00
    expect(generateId("GBR", noonSgt)).toBe("GBR-20260509-001");
    expect(generateId("GBR", noonSgt)).toBe("GBR-20260509-002");
  });

  it("uses Singapore Time for the day boundary", () => {
    // 16:30 UTC = 00:30 SGT next day
    const justAfterSgMidnight = new Date("2026-05-08T16:30:00Z");
    expect(generateId("GBR", justAfterSgMidnight)).toMatch(/^GBR-20260509-\d{3}$/);
  });

  it("counter resets per day", () => {
    const day1 = new Date("2026-05-09T04:00:00Z");
    const day2 = new Date("2026-05-10T04:00:00Z");
    expect(generateId("GBR", day1)).toBe("GBR-20260509-001");
    expect(generateId("GBR", day2)).toBe("GBR-20260510-001");
    expect(generateId("GBR", day1)).toBe("GBR-20260509-002");
  });
});
