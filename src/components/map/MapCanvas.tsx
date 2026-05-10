"use client";

import { Icon, latLngBounds, type LatLngExpression } from "leaflet";
import { LocateFixed, MessageCircle, Navigation } from "lucide-react";
import { useEffect, useMemo } from "react";
import { MapContainer, Marker, Polyline, TileLayer, useMap } from "react-leaflet";

import { getLocalizedText } from "@/lib/map/directory";
import { kioskLocation } from "@/lib/map/fixtures";
import { mapAdapter } from "@/lib/map/map-adapter";
import {
  getFocusBounds,
  getMapViewportPadding,
  getRouteViewportPoints,
  type MapViewportPanel,
} from "@/lib/map/viewport";
import type { DirectoryLanguage, Resource, RouteOption } from "@/types/goodbois";
import { Button } from "@/components/ui/button";

type MapCanvasProps = {
  resources: Resource[];
  selectedResource?: Resource;
  selectedRoute?: RouteOption;
  language: DirectoryLanguage;
  fromChat: boolean;
  onSelectResource: (resource: Resource) => void;
  onBackToChat: () => void;
  panel: MapViewportPanel;
};

const selectedIcon = new Icon({
  iconUrl:
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='44' height='44' viewBox='0 0 44 44'%3E%3Ccircle cx='22' cy='22' r='18' fill='%23B8502E' stroke='%23F5F2EC' stroke-width='5'/%3E%3Ccircle cx='22' cy='22' r='7' fill='%231A1A16'/%3E%3C/svg%3E",
  iconSize: [44, 44],
  iconAnchor: [22, 22],
});

const resourceIcon = new Icon({
  iconUrl:
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Ccircle cx='20' cy='20' r='16' fill='%233D7A3D' stroke='%23F5F2EC' stroke-width='5'/%3E%3Ccircle cx='20' cy='20' r='6' fill='%23F5F2EC'/%3E%3C/svg%3E",
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

const kioskIcon = new Icon({
  iconUrl:
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='42' height='42' viewBox='0 0 42 42'%3E%3Ccircle cx='21' cy='21' r='17' fill='%238C6B45' stroke='%23F5F2EC' stroke-width='5'/%3E%3Cpath d='M21 11v20M11 21h20' stroke='%23F5F2EC' stroke-width='3' stroke-linecap='round'/%3E%3Ccircle cx='21' cy='21' r='5' fill='%238C6B45' stroke='%23F5F2EC' stroke-width='2'/%3E%3C/svg%3E",
  iconSize: [42, 42],
  iconAnchor: [21, 21],
});

export function MapCanvas({
  resources,
  selectedResource,
  selectedRoute,
  language,
  fromChat,
  onSelectResource,
  onBackToChat,
  panel,
}: MapCanvasProps) {
  const center = useMemo<LatLngExpression>(
    () => [mapAdapter.center.latitude, mapAdapter.center.longitude],
    [],
  );
  const routePositions = useMemo(
    () => selectedRoute?.polyline.map((point) => [point.latitude, point.longitude] as LatLngExpression),
    [selectedRoute],
  );
  const selectedPosition = useMemo<LatLngExpression>(
    () =>
      selectedResource
        ? [selectedResource.latitude, selectedResource.longitude]
        : [mapAdapter.center.latitude, mapAdapter.center.longitude],
    [selectedResource],
  );
  const routeViewportPoints = useMemo<LatLngExpression[] | undefined>(
    () =>
      selectedRoute && selectedResource
        ? getRouteViewportPoints(selectedRoute, selectedResource)
        : undefined,
    [selectedRoute, selectedResource],
  );

  return (
    <section className="relative z-0 h-[100dvh] min-h-[48dvh] flex-1 overflow-hidden bg-deep-linen text-deep-charcoal">
      <MapContainer
        center={center}
        zoom={mapAdapter.zoom}
        minZoom={15}
        maxZoom={19}
        zoomControl={false}
        className="kawan-leaflet-map"
        style={{ height: "100%", width: "100%" }}
        attributionControl={false}
      >
        <TileLayer url={mapAdapter.tileUrl} attribution={mapAdapter.attribution} />
        <MapSizeSync />
        <FitRouteOrFly position={selectedPosition} routePoints={routeViewportPoints} panel={panel} />
        {routePositions ? (
          <Polyline
            positions={routePositions}
            pathOptions={{
              color: selectedRoute?.mode === "wheelchair" ? "#3D7A3D" : "#8C6B45",
              weight: 7,
              opacity: 0.85,
              dashArray: selectedRoute?.mode === "wheelchair" ? "8 10" : undefined,
            }}
          />
        ) : null}
        {resources.map((resource) => (
          <Marker
            key={resource.id}
            position={[resource.latitude, resource.longitude]}
            icon={selectedResource?.id === resource.id ? selectedIcon : resourceIcon}
            eventHandlers={{ click: () => onSelectResource(resource) }}
            title={getLocalizedText(resource.name, language)}
          />
        ))}
        <Marker
          position={[kioskLocation.latitude, kioskLocation.longitude]}
          icon={kioskIcon}
          title={getLocalizedText(kioskLocation.label, language)}
          zIndexOffset={2000}
        />
      </MapContainer>

      <div className="pointer-events-none absolute bottom-[calc(6.5rem+env(safe-area-inset-bottom))] left-4 z-[500] rounded-full border border-stone-wash bg-soft-cream px-3 py-1 text-sm font-semibold text-deep-charcoal shadow">
        <span className="inline-flex items-center gap-2">
          <LocateFixed className="size-4 text-forest-sage" aria-hidden="true" />
          {language === "en" ? "Your location" : getLocalizedText(kioskLocation.label, language)}
        </span>
      </div>

      <div className="absolute right-4 top-28 z-[500] flex flex-col gap-3">
        <Button type="button" variant="secondary" className="size-14 rounded-full bg-soft-cream text-deep-charcoal shadow-lg hover:bg-deep-linen" aria-label="Locate me">
          <Navigation className="size-6" aria-hidden="true" />
        </Button>
        {fromChat ? (
          <Button
            type="button"
            className="size-14 rounded-full bg-forest-sage text-soft-cream shadow-lg hover:bg-leaf-green"
            aria-label="Back to chat"
            onClick={onBackToChat}
          >
            <MessageCircle className="size-6" aria-hidden="true" />
          </Button>
        ) : null}
      </div>
      <div className="absolute bottom-[calc(6.5rem+env(safe-area-inset-bottom))] right-4 z-[500] rounded-lg border border-stone-wash bg-soft-cream/95 px-3 py-2 text-right text-xs font-semibold text-body-gray shadow">
        <p>OneMap</p>
        <p className="text-[10px] font-medium text-muted-stone">Map data (c) Singapore Land Authority</p>
      </div>
    </section>
  );
}

export default MapCanvas;

function MapSizeSync() {
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();
    const syncSize = () => map.invalidateSize({ pan: false });
    const resizeObserver = new ResizeObserver(syncSize);

    resizeObserver.observe(container);
    syncSize();
    const firstTick = window.setTimeout(syncSize, 120);
    const secondTick = window.setTimeout(syncSize, 500);

    return () => {
      resizeObserver.disconnect();
      window.clearTimeout(firstTick);
      window.clearTimeout(secondTick);
    };
  }, [map]);

  return null;
}

function FitRouteOrFly({
  position,
  routePoints,
  panel,
}: {
  position: LatLngExpression;
  routePoints?: LatLngExpression[];
  panel: MapViewportPanel;
}) {
  const map = useMap();
  useEffect(() => {
    const timeout = window.setTimeout(() => {
      map.invalidateSize();
      const { topLeft, bottomRight } = getMapViewportPadding(window.innerWidth, window.innerHeight, panel);
      if (routePoints && routePoints.length > 1) {
        map.fitBounds(latLngBounds(routePoints), {
          paddingTopLeft: topLeft,
          paddingBottomRight: bottomRight,
          maxZoom: 18,
        });
        return;
      }

      map.fitBounds(latLngBounds(getFocusBounds(position as [number, number])), {
        paddingTopLeft: topLeft,
        paddingBottomRight: bottomRight,
        maxZoom: 18,
      });
    }, 150);

    return () => window.clearTimeout(timeout);
  }, [map, panel, position, routePoints]);

  return null;
}
