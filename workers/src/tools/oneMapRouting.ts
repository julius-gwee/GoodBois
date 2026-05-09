import type { LocalizedText, Resource, RouteMode, RouteOption, RouteStep } from "../types/contracts";
import { workerDemoRoutes } from "../fixtures/map-demo";

export type WorkerEnv = {
  ONEMAP_ACCESS_TOKEN?: string;
  ONEMAP_EMAIL?: string;
  ONEMAP_PASSWORD?: string;
  ONEMAP_API_BASE_URL?: string;
  ONEMAP_WHEELCHAIR_ROUTE_TYPE?: string;
};

type Coordinates = {
  latitude: number;
  longitude: number;
};

type OneMapRouteInstruction = [
  string,
  string,
  number,
  string,
  number,
  string,
  string,
  string,
  string,
  string,
];

type OneMapRouteResponse = {
  status?: number;
  status_message?: string;
  message?: string;
  error?: string;
  route_geometry?: string;
  route_summary?: {
    total_time?: number;
    total_distance?: number;
  };
  route_instructions?: OneMapRouteInstruction[];
};

type OneMapRouteSource = "bfa" | "public" | "public-walk-fallback";

const defaultKioskOrigin = {
  latitude: 1.28741,
  longitude: 103.83924,
  label: {
    en: "GoodBois kiosk at Jalan Kukoh void deck",
    "zh-Hans": "惹兰古谷组屋楼下 GoodBois 服务亭",
    "nan-Hant": "GoodBois kiosk at Jalan Kukoh void deck",
    ms: "Kios GoodBois di kolong Jalan Kukoh",
    ta: "ஜாலான் குகோ void deck GoodBois நிலையம்",
  },
};

export function getFallbackRoutes(destinationResourceId: string, mode?: RouteMode): RouteOption[] {
  const routes = workerDemoRoutes[destinationResourceId] ?? Object.values(workerDemoRoutes)[0] ?? [];
  const filteredRoutes = mode ? routes.filter((route) => route.mode === mode) : routes;
  return filteredRoutes.map((route) => ({
    ...route,
    providerLabel: route.providerLabel.toLocaleLowerCase().includes("fixture fallback")
      ? route.providerLabel
      : `${route.providerLabel} (fixture fallback)`,
  }));
}

export async function findRoutes(
  resource: Resource | undefined,
  mode: RouteMode | undefined,
  env: WorkerEnv,
): Promise<RouteOption[]> {
  if (!resource) {
    return getFallbackRoutes("", mode);
  }

  const requestedModes: RouteMode[] = mode ? [mode] : ["wheelchair", "walk", "drive"];
  const resolvedRoutes = await Promise.all(
    requestedModes.map((routeMode) => resolveOneMapRoute(defaultKioskOrigin, resource, routeMode, env)),
  );
  const liveRoutes = resolvedRoutes.filter((route): route is RouteOption => Boolean(route));

  if (liveRoutes.length > 0) {
    return liveRoutes;
  }

  return getFallbackRoutes(resource.id, mode);
}

async function resolveOneMapRoute(
  origin: typeof defaultKioskOrigin,
  destination: Resource,
  mode: RouteMode,
  env: WorkerEnv,
): Promise<RouteOption | undefined> {
  if (mode !== "wheelchair") {
    return fetchOneMapRoute(origin, destination, mode, "public", env);
  }

  const bfaRoute = await fetchOneMapRoute(origin, destination, mode, "bfa", env);
  if (bfaRoute) {
    return bfaRoute;
  }

  return fetchOneMapRoute(origin, destination, mode, "public-walk-fallback", env);
}

async function fetchOneMapRoute(
  origin: typeof defaultKioskOrigin,
  destination: Resource,
  mode: RouteMode,
  source: OneMapRouteSource,
  env: WorkerEnv,
): Promise<RouteOption | undefined> {
  const token = await getOneMapToken(env);
  if (!token) {
    return undefined;
  }

  const apiBaseUrl = env.ONEMAP_API_BASE_URL ?? "https://www.onemap.gov.sg";
  const routeType = getOneMapRouteType(mode, source, env);
  const url = new URL(source === "bfa" ? "/api/bfa/routingsvc/route" : "/api/public/routingsvc/route", apiBaseUrl);
  url.searchParams.set("start", `${origin.latitude},${origin.longitude}`);
  url.searchParams.set("end", `${destination.latitude},${destination.longitude}`);
  if (routeType) {
    url.searchParams.set("routeType", routeType);
  }

  const response = await fetch(url, {
    headers: {
      Authorization: token.startsWith("Bearer ") ? token : `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    return undefined;
  }

  const payload = (await response.json()) as OneMapRouteResponse;
  if (payload.error || payload.message || !payload.route_summary) {
    return undefined;
  }

  const polyline = payload.route_geometry
    ? decodePolyline(payload.route_geometry)
    : [
        { latitude: origin.latitude, longitude: origin.longitude },
        { latitude: destination.latitude, longitude: destination.longitude },
      ];
  const durationMinutes = Math.max(1, Math.round((payload.route_summary.total_time ?? 60) / 60));
  const distanceMeters = Math.round(payload.route_summary.total_distance ?? estimateDistanceMeters(origin, destination));

  return {
    id: `${destination.id}-${mode}-onemap`,
    destinationResourceId: destination.id,
    mode,
    durationMinutes,
    distanceMeters,
    isRecommended: mode === "wheelchair",
    providerLabel: getProviderLabel(mode, source),
    origin,
    polyline,
    notes: getRouteNotes(mode, source),
    steps: buildRouteSteps(payload.route_instructions, destination, durationMinutes, distanceMeters),
  };
}

async function getOneMapToken(env: WorkerEnv): Promise<string | undefined> {
  if (env.ONEMAP_ACCESS_TOKEN) {
    return env.ONEMAP_ACCESS_TOKEN;
  }

  if (!env.ONEMAP_EMAIL || !env.ONEMAP_PASSWORD) {
    return undefined;
  }

  const apiBaseUrl = env.ONEMAP_API_BASE_URL ?? "https://www.onemap.gov.sg";
  const response = await fetch(new URL("/api/auth/post/getToken", apiBaseUrl), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      email: env.ONEMAP_EMAIL,
      password: env.ONEMAP_PASSWORD,
    }),
  });

  if (!response.ok) {
    return undefined;
  }

  const payload = (await response.json()) as { access_token?: string };
  return payload.access_token;
}

function getOneMapRouteType(mode: RouteMode, source: OneMapRouteSource, env: WorkerEnv): string | undefined {
  if (source === "bfa") {
    return undefined;
  }

  if (mode === "drive") {
    return "drive";
  }

  if (mode === "wheelchair") {
    return source === "public-walk-fallback" ? "walk" : (env.ONEMAP_WHEELCHAIR_ROUTE_TYPE ?? "walk");
  }

  return "walk";
}

function getProviderLabel(mode: RouteMode, source: OneMapRouteSource): string {
  if (source === "bfa") {
    return "OneMap Barrier-Free Access route";
  }

  if (source === "public-walk-fallback") {
    return "OneMap walking fallback";
  }

  return mode === "drive" ? "OneMap driving route" : "OneMap walking route";
}

function getRouteNotes(mode: RouteMode, source: OneMapRouteSource): LocalizedText[] {
  if (mode === "wheelchair" && source === "public-walk-fallback") {
    return [
      {
        en: "OneMap Barrier-Free Access did not return a route, so a live OneMap walking fallback is shown. Confirm ramps and lifts before leaving.",
        "zh-Hans": "OneMap 无障碍路线没有返回结果，因此显示实时步行备用路线。出发前请确认斜坡和电梯。",
        ms: "OneMap Barrier-Free Access tidak mengembalikan laluan, jadi laluan jalan kaki OneMap dipaparkan. Sahkan tanjakan dan lif sebelum bergerak.",
        ta: "OneMap Barrier-Free Access பாதை கிடைக்காததால், OneMap நடைபாதை மாற்றாக காட்டப்படுகிறது. செல்லும் முன் சரிவு பாதை மற்றும் லிப்ட் நிலையை உறுதிசெய்யவும்.",
      },
    ];
  }

  return [
    {
      en: "Live route from OneMap. Use judgement at crossings and check lift status before leaving.",
      "zh-Hans": "OneMap 实时路线。过马路时请自行判断，并在出发前确认电梯状态。",
      ms: "Laluan langsung daripada OneMap. Berhati-hati di lintasan dan semak lif sebelum bergerak.",
      ta: "OneMap நேரடி பாதை. சாலைக் கடப்புகளில் கவனமாக இருந்து, செல்லும் முன் லிப்ட் நிலையைச் சரிபார்க்கவும்.",
    },
  ];
}

function buildRouteSteps(
  instructions: OneMapRouteInstruction[] | undefined,
  destination: Resource,
  durationMinutes: number,
  distanceMeters: number,
): RouteStep[] {
  if (!instructions || instructions.length === 0) {
    return [
      {
        id: `${destination.id}-step-1`,
        instruction: {
          en: `Follow the mapped route to ${destination.name.en}.`,
        },
        distanceMeters,
        durationMinutes,
        latitude: destination.latitude,
        longitude: destination.longitude,
      },
    ];
  }

  return instructions.map((instruction, index) => {
    const [latitude, longitude] = parseInstructionCoordinate(instruction[3]);
    return {
      id: `${destination.id}-step-${index + 1}`,
      instruction: {
        en: instruction[9] || `${instruction[0]} ${instruction[1]}`.trim(),
      },
      distanceMeters: Number(instruction[2]) || 0,
      durationMinutes: Math.max(1, Math.round((Number(instruction[4]) || 60) / 60)),
      latitude: latitude ?? destination.latitude,
      longitude: longitude ?? destination.longitude,
    };
  });
}

function parseInstructionCoordinate(value: string): [number | undefined, number | undefined] {
  const [latitude, longitude] = value.split(",").map(Number);
  return [Number.isFinite(latitude) ? latitude : undefined, Number.isFinite(longitude) ? longitude : undefined];
}

function decodePolyline(encoded: string): Coordinates[] {
  let index = 0;
  let latitude = 0;
  let longitude = 0;
  const coordinates: Coordinates[] = [];

  while (index < encoded.length) {
    const latitudeChange = decodePolylineValue(encoded, () => index++);
    const longitudeChange = decodePolylineValue(encoded, () => index++);
    latitude += latitudeChange;
    longitude += longitudeChange;
    coordinates.push({
      latitude: latitude / 1e5,
      longitude: longitude / 1e5,
    });
  }

  return coordinates;
}

function decodePolylineValue(encoded: string, nextIndex: () => number): number {
  let result = 0;
  let shift = 0;
  let byte: number;

  do {
    byte = encoded.charCodeAt(nextIndex()) - 63;
    result |= (byte & 0x1f) << shift;
    shift += 5;
  } while (byte >= 0x20);

  return result & 1 ? ~(result >> 1) : result >> 1;
}

function estimateDistanceMeters(start: Coordinates, end: Coordinates): number {
  const earthRadiusMeters = 6371000;
  const lat1 = toRadians(start.latitude);
  const lat2 = toRadians(end.latitude);
  const deltaLat = toRadians(end.latitude - start.latitude);
  const deltaLng = toRadians(end.longitude - start.longitude);
  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
  return 2 * earthRadiusMeters * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}
