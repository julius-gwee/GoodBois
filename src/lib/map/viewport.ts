import type { Resource, RouteOption } from "@/types/goodbois";

export type RouteViewportPoint = [number, number];

export function getRouteViewportPoints(route: RouteOption, destination: Resource): RouteViewportPoint[] {
  return [
    [route.origin.latitude, route.origin.longitude],
    ...route.polyline.map((point) => [point.latitude, point.longitude] as RouteViewportPoint),
    [destination.latitude, destination.longitude],
  ];
}
