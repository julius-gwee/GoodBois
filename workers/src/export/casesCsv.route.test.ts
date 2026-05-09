import { describe, it, expect } from "vitest";
import app from "../index";

describe("GET /export/cases.csv", () => {
  const env = { EXPORT_TOKEN: "test" };

  it("returns 401 when token is missing", async () => {
    const res = await app.request("/export/cases.csv", {}, env);
    expect(res.status).toBe(401);
  });

  it("returns 401 when token is wrong", async () => {
    const res = await app.request("/export/cases.csv?token=wrong", {}, env);
    expect(res.status).toBe(401);
  });

  it("returns 200 with text/csv when token is correct", async () => {
    const res = await app.request("/export/cases.csv?token=test", {}, env);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toMatch(/text\/csv/);
    const body = await res.text();
    expect(body.split("\r\n")[0]).toBe(
      "id,createdAt,language,summaryEnglish,transcript,suggestedNextSteps,residentBlock,residentUnit,residentNameAlias,kioskId,status,sessionId",
    );
  });
});
