import type { Resource, RouteOption } from "@/types/goodbois";

export type MapPoint = {
  id: string;
  x: number;
  y: number;
};

export type MapRouteOverlay = {
  id: string;
  points: MapPoint[];
};

export type MapAdapter = {
  projectResources(resources: Resource[]): MapPoint[];
  projectRoute(route: RouteOption): MapRouteOverlay;
};

const bounds = {
  minLatitude: 1.30145,
  maxLatitude: 1.303,
  minLongitude: 103.85045,
  maxLongitude: 103.85235,
};

function project(latitude: number, longitude: number, id: string): MapPoint {
  const x =
    ((longitude - bounds.minLongitude) / (bounds.maxLongitude - bounds.minLongitude)) * 100;
  const y =
    100 - ((latitude - bounds.minLatitude) / (bounds.maxLatitude - bounds.minLatitude)) * 100;

  return {
    id,
    x: Math.min(94, Math.max(6, x)),
    y: Math.min(90, Math.max(10, y)),
  };
}

export const mapAdapter: MapAdapter = {
  projectResources(resources) {
    return resources.map((resource) => project(resource.latitude, resource.longitude, resource.id));
  },
  projectRoute(route) {
    return {
      id: route.id,
      points: route.polyline.map((point, index) =>
        project(point.latitude, point.longitude, `${route.id}-${index}`),
      ),
    };
  },
};
