"use client";

import { Icon, type LatLngExpression } from "leaflet";
import { LocateFixed, MessageCircle, Navigation } from "lucide-react";
import { useEffect, useMemo } from "react";
import { MapContainer, Marker, Polyline, TileLayer, useMap } from "react-leaflet";

import { getLocalizedText } from "@/lib/map/directory";
import { kioskLocation } from "@/lib/map/fixtures";
import { mapAdapter } from "@/lib/map/map-adapter";
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
};

const selectedIcon = new Icon({
  iconUrl:
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='44' height='44' viewBox='0 0 44 44'%3E%3Ccircle cx='22' cy='22' r='18' fill='%23f59e0b' stroke='white' stroke-width='5'/%3E%3Ccircle cx='22' cy='22' r='7' fill='%23171717'/%3E%3C/svg%3E",
  iconSize: [44, 44],
  iconAnchor: [22, 22],
});

const resourceIcon = new Icon({
  iconUrl:
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Ccircle cx='20' cy='20' r='16' fill='%230f766e' stroke='white' stroke-width='5'/%3E%3Ccircle cx='20' cy='20' r='6' fill='white'/%3E%3C/svg%3E",
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

const kioskIcon = new Icon({
  iconUrl:
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='42' height='42' viewBox='0 0 42 42'%3E%3Ccircle cx='21' cy='21' r='17' fill='%232563eb' stroke='white' stroke-width='5'/%3E%3Cpath d='M21 11v20M11 21h20' stroke='white' stroke-width='3' stroke-linecap='round'/%3E%3Ccircle cx='21' cy='21' r='5' fill='%232563eb' stroke='white' stroke-width='2'/%3E%3C/svg%3E",
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

  return (
    <section className="relative z-0 h-[100dvh] min-h-[48dvh] flex-1 overflow-hidden bg-[#dce9e3] text-neutral-950">
      <MapContainer
        center={center}
        zoom={mapAdapter.zoom}
        minZoom={15}
        maxZoom={19}
        zoomControl={false}
        className="kawan-leaflet-map"
        style={{ height: "100%", width: "100%" }}
        attributionControl
      >
        <TileLayer url={mapAdapter.tileUrl} attribution={mapAdapter.attribution} />
        <MapSizeSync />
        <FlyToSelected position={selectedPosition} />
        {routePositions ? (
          <Polyline
            positions={routePositions}
            pathOptions={{
              color: selectedRoute?.mode === "wheelchair" ? "#0f766e" : "#2563eb",
              weight: 7,
              opacity: 0.85,
              dashArray: selectedRoute?.mode === "wheelchair" ? "8 10" : undefined,
            }}
          />
        ) : null}
        <Marker position={[kioskLocation.latitude, kioskLocation.longitude]} icon={kioskIcon} />
        {resources.map((resource) => (
          <Marker
            key={resource.id}
            position={[resource.latitude, resource.longitude]}
            icon={selectedResource?.id === resource.id ? selectedIcon : resourceIcon}
            eventHandlers={{ click: () => onSelectResource(resource) }}
            title={getLocalizedText(resource.name, language)}
          />
        ))}
      </MapContainer>

      <div className="pointer-events-none absolute bottom-24 left-4 z-[500] rounded-full bg-white px-3 py-1 text-sm font-semibold shadow">
        <span className="inline-flex items-center gap-2">
          <LocateFixed className="size-4 text-blue-700" aria-hidden="true" />
          {language === "en" ? "Your location" : getLocalizedText(kioskLocation.label, language)}
        </span>
      </div>

      <div className="absolute right-4 top-28 z-[500] flex flex-col gap-3">
        <Button type="button" variant="secondary" className="size-14 rounded-full shadow-lg" aria-label="Locate me">
          <Navigation className="size-6" aria-hidden="true" />
        </Button>
        {fromChat ? (
          <Button
            type="button"
            className="size-14 rounded-full bg-amber-500 text-neutral-950 shadow-lg hover:bg-amber-400"
            aria-label="Back to chat"
            onClick={onBackToChat}
          >
            <MessageCircle className="size-6" aria-hidden="true" />
          </Button>
        ) : null}
      </div>
      <div className="absolute bottom-24 right-4 z-[500] rounded-lg bg-white/95 px-3 py-2 text-sm font-semibold shadow">
        OneMap
      </div>
    </section>
  );
}

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

function FlyToSelected({ position }: { position: LatLngExpression }) {
  const map = useMap();
  useEffect(() => {
    const timeout = window.setTimeout(() => {
      map.invalidateSize();
      map.flyTo(position, map.getZoom(), { duration: 0.45 });
    }, 150);

    return () => window.clearTimeout(timeout);
  }, [map, position]);

  return null;
}
