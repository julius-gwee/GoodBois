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
  tileUrl: string;
  attribution: string;
  center: {
    latitude: number;
    longitude: number;
  };
  zoom: number;
  projectResources(resources: Resource[]): MapPoint[];
  projectRoute(route: RouteOption): MapRouteOverlay;
};

const bounds = {
  minLatitude: 1.2808,
  maxLatitude: 1.2878,
  minLongitude: 103.8388,
  maxLongitude: 103.8434,
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
  tileUrl: "https://www.onemap.gov.sg/maps/tiles/Default/{z}/{x}/{y}.png",
  attribution:
    '<img src="https://www.onemap.gov.sg/web-assets/images/logo/om_logo.png" alt="OneMap" style="height:20px;width:20px;vertical-align:middle;margin-right:4px" /> OneMap | Map data © Singapore Land Authority',
  center: {
    latitude: 1.28741,
    longitude: 103.83924,
  },
  zoom: 18,
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
