import assert from "node:assert/strict";
import test from "node:test";

import {
  buildRoutePrintPayload,
  filterResources,
  getLocalizedText,
  getRouteForMode,
} from "./directory.ts";
import { demoResources, demoRoutes } from "./fixtures.ts";

test("filters resources by category, language, and searchable practical notes", () => {
  const results = filterResources(demoResources, {
    category: "digital_form_help",
    language: "zh-Hans",
    query: "singpass",
  });

  assert.deepEqual(
    results.map((resource) => resource.id),
    ["kampong-glam-digital-help"],
  );
});

test("falls back to English when translated resource copy is missing", () => {
  const resource = demoResources.find((item) => item.id === "blk-123-pickup")!;

  assert.equal(getLocalizedText(resource.name, "ta"), "Block 123 Pickup Point");
});

test("returns a wheelchair route before walking or driving when requested", () => {
  const route = getRouteForMode(demoRoutes["senior-corner"], "wheelchair");

  assert.equal(route.mode, "wheelchair");
  assert.equal(route.isRecommended, true);
  assert.match(route.providerLabel, /wheelchair-friendly preview/i);
});

test("builds a printable route payload with the guide disclaimer", () => {
  const resource = demoResources.find((item) => item.id === "senior-corner")!;
  const route = getRouteForMode(demoRoutes["senior-corner"], "wheelchair");
  const payload = buildRoutePrintPayload(resource, route, "zh-Hans");

  assert.equal(payload.destinationName, "乐龄活动角");
  assert.equal(payload.routeMode, "wheelchair");
  assert.match(payload.disclaimerEnglish, /not an official dispatch/i);
  assert.ok(payload.steps.length >= 3);
});
