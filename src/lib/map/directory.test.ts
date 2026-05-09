import assert from "node:assert/strict";
import test from "node:test";

import {
  buildRoutePrintPayload,
  filterResources,
  getLocalizedText,
  getRouteForMode,
} from "./directory.ts";
import { demoResources, demoRoutes } from "./fixtures.ts";
import { loadResources } from "./api.ts";
import { mapAdapter } from "./map-adapter.ts";

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

  assert.equal(getLocalizedText(resource.name, "nan-Hant"), "Block 123 Pickup Point");
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

test("keeps multilingual fixture copy as readable unicode", () => {
  const resource = demoResources.find((item) => item.id === "senior-corner")!;

  assert.equal(getLocalizedText(resource.name, "zh-Hans"), "乐龄活动角");
  assert.equal(getLocalizedText(resource.name, "ta"), "மூத்தோர் செயல்பாட்டு இடம்");
  assert.doesNotMatch(getLocalizedText(resource.name, "zh-Hans"), /Ã|å|ç/);
});

test("falls back to fixture resources when the worker resource fetch fails", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (() => Promise.reject(new Error("offline"))) as typeof fetch;

  try {
    const result = await loadResources(
      { category: "senior_activity", language: "all" },
      "http://127.0.0.1:8787",
    );

    assert.equal(result.source, "fixture");
    assert.deepEqual(
      result.resources.map((resource) => resource.id),
      ["senior-corner"],
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("exposes OneMap tile configuration through the map adapter boundary", () => {
  assert.equal(
    mapAdapter.tileUrl,
    "https://www.onemap.gov.sg/maps/tiles/Default/{z}/{x}/{y}.png",
  );
  assert.match(mapAdapter.attribution, /OneMap/i);
});
