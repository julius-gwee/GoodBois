import { describe, it, expect } from "vitest";
import { agencies } from "./agencies";
import type { AgencyCategory } from "../../types/contracts";

const REQUIRED_CATEGORIES: AgencyCategory[] = [
  "housing",
  "transport",
  "healthcare",
  "social_services",
  "legal",
  "financial_assistance",
  "elderly_activity",
  "digital_help",
  "mp_meet_the_people",
  "rc_visit",
];

describe("agency seed data", () => {
  it("has 15 to 25 entries", () => {
    expect(agencies.length).toBeGreaterThanOrEqual(15);
    expect(agencies.length).toBeLessThanOrEqual(25);
  });

  it("every entry has en + zh-Hans blurbs", () => {
    for (const a of agencies) {
      expect(a.multilingualBlurb.en, `${a.key} missing en blurb`).toBeTruthy();
      expect(a.multilingualBlurb["zh-Hans"], `${a.key} missing zh-Hans blurb`).toBeTruthy();
    }
  });

  it("every required category is represented at least once", () => {
    const present = new Set(agencies.map((a) => a.category));
    for (const c of REQUIRED_CATEGORIES) {
      expect(present.has(c), `category ${c} missing`).toBe(true);
    }
  });

  it("every key is unique", () => {
    const keys = agencies.map((a) => a.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("every entry is marked active and source=seed", () => {
    for (const a of agencies) {
      expect(a.active, `${a.key} not active`).toBe(true);
      expect(a.source).toBe("seed");
    }
  });
});
