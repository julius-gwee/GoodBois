import type { Resource, RouteOption } from "@/types/goodbois";

export type RouteViewportPoint = [number, number];
export type MapViewportPanel = "drawer" | "details" | "directions" | "none";
export type MapViewportPadding = {
  topLeft: [number, number];
  bottomRight: [number, number];
};

export function getRouteViewportPoints(route: RouteOption, destination: Resource): RouteViewportPoint[] {
  return [
    [route.origin.latitude, route.origin.longitude],
    ...route.polyline.map((point) => [point.latitude, point.longitude] as RouteViewportPoint),
    [destination.latitude, destination.longitude],
  ];
}

export function getFocusBounds(
  point: RouteViewportPoint,
  delta = 0.00008,
): [RouteViewportPoint, RouteViewportPoint] {
  return [
    [point[0] - delta, point[1] - delta],
    [point[0] + delta, point[1] + delta],
  ];
}

export function getMapViewportPadding(
  width: number,
  height: number,
  panel: MapViewportPanel,
): MapViewportPadding {
  const safeHeader = 118;
  const languageBar = 96;

  if (width >= 1024) {
    const rightPanel = panel === "details" ? 500 : panel === "directions" ? 530 : 56;
    const leftPanel = panel === "drawer" ? 520 : 56;
    return {
      topLeft: [leftPanel, safeHeader],
      bottomRight: [rightPanel, languageBar],
    };
  }

  const panelHeight =
    panel === "directions"
      ? Math.min(Math.round(height * 0.64), Math.max(420, height - 260))
      : panel === "details"
        ? Math.min(Math.round(height * 0.6), Math.max(380, height - 280))
        : panel === "drawer"
          ? Math.min(Math.round(height * 0.46), Math.max(300, height - 360))
          : languageBar;

  return {
    topLeft: [36, safeHeader],
    bottomRight: [36, Math.max(languageBar, panelHeight + languageBar)],
  };
}
