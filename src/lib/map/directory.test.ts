import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  buildRoutePrintPayload,
  filterResources,
  getLocalizedText,
  getRouteForMode,
} from "./directory.ts";
import { loadResources, loadRoutes } from "./api.ts";
import { demoResources, demoRoutes, kioskLocation } from "./fixtures.ts";
import { mapAdapter } from "./map-adapter.ts";
import { getMapViewportPadding, getRouteViewportPoints } from "./viewport.ts";

test("filters resources by category, language, and searchable practical notes", () => {
  const results = filterResources(demoResources, {
    category: "government_service",
    language: "zh-Hans",
    query: "singpass",
  });

  assert.deepEqual(
    results.map((resource) => resource.id),
    ["servicesg-bukit-merah"],
  );
});

test("uses Blk 3 Jalan Bukit Merah as the kiosk beachhead", () => {
  assert.equal(kioskLocation.label.en, "GoodBois kiosk at Blk 3 Jalan Bukit Merah");
  assert.equal(kioskLocation.latitude, 1.287133554639335);
  assert.equal(kioskLocation.longitude, 103.8070005167375);
});

test("seeds actual Bukit Merah elderly points of interest", () => {
  const ids = demoResources.map((resource) => resource.id);

  assert.ok(demoResources.length >= 10);
  assert.deepEqual(
    [
      "queenstown-smc-mps",
      "thong-kheng-aac-community-health-post",
      "hock-san-zone-rc",
      "abc-brickworks-market-food-centre",
      "fairprice-jalan-bukit-merah",
      "servicesg-bukit-merah",
      "bukit-merah-polyclinic",
    ].every((id) => ids.includes(id)),
    true,
  );
});

test("includes Queenstown SMC MPS session time and contact details", () => {
  const resource = demoResources.find((item) => item.id === "queenstown-smc-mps")!;

  assert.equal(
    getLocalizedText(resource.openingHours!, "en"),
    "Mondays, 7:00 PM - 10:00 PM; closed on public holidays",
  );
  assert.equal(resource.contactPhone, "9811 3883");
  assert.match(getLocalizedText(resource.practicalNotes[0], "en"), /Eric Chua/i);
});

test("falls back to English when translated resource copy is missing", () => {
  const resource = demoResources.find((item) => item.id === "anchorpoint-shopping-centre")!;

  assert.equal(getLocalizedText(resource.name, "nan-Hant"), "Anchorpoint Shopping Centre");
});

test("returns a wheelchair route before walking or driving when requested", () => {
  const route = getRouteForMode(demoRoutes["servicesg-bukit-merah"], "wheelchair");

  assert.equal(route.mode, "wheelchair");
  assert.equal(route.isRecommended, true);
  assert.match(route.providerLabel, /fixture fallback/i);
  assert.ok(route.polyline.length > 3);
});

test("builds a printable route payload with the guide disclaimer", () => {
  const resource = demoResources.find((item) => item.id === "servicesg-bukit-merah")!;
  const route = getRouteForMode(demoRoutes["servicesg-bukit-merah"], "wheelchair");
  const payload = buildRoutePrintPayload(resource, route, "zh-Hans");

  assert.equal(payload.destinationName, getLocalizedText(resource.name, "zh-Hans"));
  assert.equal(payload.routeMode, "wheelchair");
  assert.match(payload.disclaimerEnglish, /not an official dispatch/i);
  assert.ok(payload.steps.length >= 3);
});

test("keeps missing translations readable through English fallback", () => {
  const resource = demoResources.find((item) => item.id === "queenstown-smc-mps")!;

  assert.equal(getLocalizedText(resource.name, "ta"), resource.name.en);
  assert.doesNotMatch(getLocalizedText(resource.name, "zh-Hans"), /\u00c3|\u00c2|\u00e2\u20ac/);
});

test("falls back to fixture resources when the worker resource fetch fails", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (() => Promise.reject(new Error("offline"))) as typeof fetch;

  try {
    const result = await loadResources(
      { category: "active_ageing", language: "all" },
      "http://127.0.0.1:8787",
    );

    assert.equal(result.source, "fixture");
    assert.deepEqual(
      result.resources.map((resource) => resource.id),
      ["thong-kheng-aac-community-health-post"],
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("falls back to clearly labelled fixture routes when the worker route fetch fails", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (() => Promise.reject(new Error("offline"))) as typeof fetch;

  try {
    const result = await loadRoutes("servicesg-bukit-merah", "wheelchair", "http://127.0.0.1:8787");

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

test("Bukit Merah official map resources link back to agency contacts", () => {
  const resource = demoResources.find((item) => item.id === "queenstown-smc-mps");

  assert.equal(resource?.linkedAgencyKey, "queenstown_smc_mps");
  assert.equal(resource?.latitude, 1.287133554639335);
  assert.equal(resource?.longitude, 103.8070005167375);
});

test("route viewport points include origin, destination, and full polyline", () => {
  const resource = demoResources.find((item) => item.id === "servicesg-bukit-merah")!;
  const route = getRouteForMode(demoRoutes[resource.id], "wheelchair");
  const points = getRouteViewportPoints(route, resource);

  assert.deepEqual(points[0], [route.origin.latitude, route.origin.longitude]);
  assert.deepEqual(points.at(-1), [resource.latitude, resource.longitude]);
  assert.ok(points.length >= route.polyline.length + 2);
});

test("seeded ServiceSG route follows the Bukit Merah corridor", () => {
  const route = getRouteForMode(demoRoutes["servicesg-bukit-merah"], "walk");

  assert.ok(route.polyline.length >= 7);
  assert.ok(
    route.polyline.some(
      (point) =>
        Math.abs(point.latitude - 1.28495) < 0.00001 &&
        Math.abs(point.longitude - 103.8148) < 0.00001,
    ),
  );
});

test("map viewport padding accounts for iPad bottom panels and desktop side panels", () => {
  const ipadDirections = getMapViewportPadding(834, 1194, "directions");
  const desktopDetails = getMapViewportPadding(1366, 1024, "details");

  assert.ok(ipadDirections.bottomRight[1] >= 700);
  assert.ok(desktopDetails.bottomRight[0] >= 500);
});

test("kiosk marker renders above colocated POI markers", () => {
  const source = readFileSync(new URL("../../components/map/MapCanvas.tsx", import.meta.url), "utf8");
  const resourcesIndex = source.indexOf("{resources.map((resource)");
  const kioskIndex = source.indexOf("title={getLocalizedText(kioskLocation.label, language)}");

  assert.ok(resourcesIndex > -1);
  assert.ok(kioskIndex > -1);
  assert.ok(resourcesIndex < kioskIndex);
  assert.match(source, /zIndexOffset=\{2000\}/);
});
