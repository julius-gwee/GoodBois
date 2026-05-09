import assert from "node:assert/strict";
import test from "node:test";

import {
  buildRoutePrintPayload,
  filterResources,
  getLocalizedText,
  getRouteForMode,
} from "./directory.ts";
import { demoResources, demoRoutes } from "./fixtures.ts";
import { loadResources, loadRoutes } from "./api.ts";
import { mapAdapter } from "./map-adapter.ts";
import { getRouteViewportPoints } from "./viewport.ts";

test("filters resources by category, language, and searchable practical notes", () => {
  const results = filterResources(demoResources, {
    category: "digital_form_help",
    language: "zh-Hans",
    query: "singpass",
  });

  assert.deepEqual(
    results.map((resource) => resource.id),
    ["catchplus-jalan-kukoh"],
  );
});

test("falls back to English when translated resource copy is missing", () => {
  const resource = demoResources.find((item) => item.id === "jalan-kukoh-pickup")!;

  assert.equal(getLocalizedText(resource.name, "nan-Hant"), "Jalan Kukoh Pickup Point");
});

test("returns a wheelchair route before walking or driving when requested", () => {
  const route = getRouteForMode(demoRoutes["active-ageing-centre-jalan-kukoh"], "wheelchair");

  assert.equal(route.mode, "wheelchair");
  assert.equal(route.isRecommended, true);
  assert.match(route.providerLabel, /fixture fallback/i);
});

test("builds a printable route payload with the guide disclaimer", () => {
  const resource = demoResources.find((item) => item.id === "active-ageing-centre-jalan-kukoh")!;
  const route = getRouteForMode(demoRoutes["active-ageing-centre-jalan-kukoh"], "wheelchair");
  const payload = buildRoutePrintPayload(resource, route, "zh-Hans");

  assert.equal(payload.destinationName, "牛车水乐龄活动中心（惹兰古谷）");
  assert.equal(payload.routeMode, "wheelchair");
  assert.match(payload.disclaimerEnglish, /not an official dispatch/i);
  assert.ok(payload.steps.length >= 2);
});

test("keeps multilingual fixture copy as readable unicode", () => {
  const resource = demoResources.find((item) => item.id === "active-ageing-centre-jalan-kukoh")!;

  assert.equal(getLocalizedText(resource.name, "zh-Hans"), "牛车水乐龄活动中心（惹兰古谷）");
  assert.match(getLocalizedText(resource.name, "ta"), /சைனாடவுன்/);
  assert.doesNotMatch(getLocalizedText(resource.name, "zh-Hans"), /Ãƒ|Ã¥|Ã§|ä¹|ç‰/);
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
      ["active-ageing-centre-jalan-kukoh", "active-ageing-centre-chin-swee"],
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("falls back to clearly labelled fixture routes when the worker route fetch fails", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (() => Promise.reject(new Error("offline"))) as typeof fetch;

  try {
    const result = await loadRoutes("active-ageing-centre-jalan-kukoh", "wheelchair", "http://127.0.0.1:8787");

    assert.equal(result.source, "fixture");
    assert.match(result.routes[0].providerLabel, /fixture fallback/i);
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

test("Jalan Kukoh official map resources link back to agency contacts", () => {
  const resource = demoResources.find((item) => item.id === "active-ageing-centre-jalan-kukoh");

  assert.equal(resource?.linkedAgencyKey, "active_ageing_centre_jalan_kukoh");
  assert.equal(resource?.latitude, 1.287377626822412);
  assert.equal(resource?.longitude, 103.8394070605943);
});

test("route viewport points include origin, destination, and full polyline", () => {
  const resource = demoResources.find((item) => item.id === "active-ageing-centre-jalan-kukoh")!;
  const route = getRouteForMode(demoRoutes[resource.id], "wheelchair");
  const points = getRouteViewportPoints(route, resource);

  assert.deepEqual(points[0], [route.origin.latitude, route.origin.longitude]);
  assert.deepEqual(points.at(-1), [resource.latitude, resource.longitude]);
  assert.ok(points.length >= route.polyline.length + 2);
});
