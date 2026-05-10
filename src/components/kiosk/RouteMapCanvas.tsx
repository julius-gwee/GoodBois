"use client";

import { Icon, latLngBounds, type LatLngExpression } from "leaflet";
import { ArrowLeft } from "lucide-react";
import { useEffect, useMemo } from "react";
import { MapContainer, Marker, Polyline, TileLayer, useMap } from "react-leaflet";

import { mapAdapter } from "@/lib/map/map-adapter";
import { Button } from "@/components/ui/button";

type LatLng = { latitude: number; longitude: number };

type RouteMapCanvasProps = {
  origin: LatLng;
  destination: LatLng;
  polyline: LatLng[];
  destinationLabel: string;
  originLabel: string;
  hint?: string | null;
  distanceMeters?: number | null;
  durationMinutes?: number | null;
  approximate?: boolean;
  backLabel: string;
  onBack: () => void;
};

const destinationIcon = new Icon({
  iconUrl:
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='44' height='44' viewBox='0 0 44 44'%3E%3Ccircle cx='22' cy='22' r='18' fill='%23B8502E' stroke='%23F5F2EC' stroke-width='5'/%3E%3Ccircle cx='22' cy='22' r='7' fill='%231A1A16'/%3E%3C/svg%3E",
  iconSize: [44, 44],
  iconAnchor: [22, 22],
});

const originIcon = new Icon({
  iconUrl:
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='42' height='42' viewBox='0 0 42 42'%3E%3Ccircle cx='21' cy='21' r='17' fill='%238C6B45' stroke='%23F5F2EC' stroke-width='5'/%3E%3Cpath d='M21 11v20M11 21h20' stroke='%23F5F2EC' stroke-width='3' stroke-linecap='round'/%3E%3Ccircle cx='21' cy='21' r='5' fill='%238C6B45' stroke='%23F5F2EC' stroke-width='2'/%3E%3C/svg%3E",
  iconSize: [42, 42],
  iconAnchor: [21, 21],
});

export default function RouteMapCanvas({
  origin,
  destination,
  polyline,
  destinationLabel,
  originLabel,
  hint,
  distanceMeters,
  durationMinutes,
  approximate,
  backLabel,
  onBack,
}: RouteMapCanvasProps) {
  const center = useMemo<LatLngExpression>(
    () => [mapAdapter.center.latitude, mapAdapter.center.longitude],
    [],
  );
  const positions = useMemo<LatLngExpression[]>(
    () => polyline.map((p) => [p.latitude, p.longitude] as LatLngExpression),
    [polyline],
  );
  const meta = useMemo(
    () => formatMeta({ distanceMeters, durationMinutes, approximate }),
    [distanceMeters, durationMinutes, approximate],
  );

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-deep-linen">
      <MapContainer
        center={center}
        zoom={mapAdapter.zoom}
        minZoom={12}
        maxZoom={19}
        zoomControl={false}
        attributionControl={false}
        className="kawan-leaflet-map"
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer url={mapAdapter.tileUrl} attribution={mapAdapter.attribution} />
        <FitRoute positions={positions} />
        {positions.length >= 2 ? (
          <Polyline
            positions={positions}
            pathOptions={{
              color: "#3D7A3D",
              weight: 7,
              opacity: 0.85,
              dashArray: approximate ? "8 10" : undefined,
            }}
          />
        ) : null}
        <Marker
          position={[origin.latitude, origin.longitude]}
          icon={originIcon}
          title={originLabel}
          zIndexOffset={2000}
        />
        <Marker
          position={[destination.latitude, destination.longitude]}
          icon={destinationIcon}
          title={destinationLabel}
        />
      </MapContainer>

      <div className="pointer-events-none absolute inset-x-0 top-0 z-[500] p-[6vw]">
        <div className="pointer-events-auto inline-flex max-w-full flex-col gap-1 rounded-3xl bg-soft-cream/95 px-5 py-4 shadow-lg backdrop-blur">
          <p className="text-sm font-medium uppercase tracking-wide text-forest-sage">
            {originLabel}
          </p>
          <p className="text-2xl font-semibold text-deep-charcoal">{destinationLabel}</p>
          {hint ? <p className="mt-1 max-w-md text-base text-body-gray">{hint}</p> : null}
          {meta ? <p className="mt-1 text-sm text-muted-stone">{meta}</p> : null}
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 z-[500] flex justify-center p-[6vw]">
        <Button
          type="button"
          onClick={onBack}
          className="min-h-14 rounded-full bg-forest-sage px-8 text-lg font-semibold text-soft-cream hover:bg-leaf-green"
        >
          <ArrowLeft className="mr-2 size-5" aria-hidden="true" />
          {backLabel}
        </Button>
      </div>

      <div className="pointer-events-none absolute bottom-2 right-2 z-[500] rounded-lg bg-soft-cream/95 px-3 py-2 text-right text-[10px] font-medium text-muted-stone shadow">
        <p>OneMap</p>
        <p>Map data © Singapore Land Authority</p>
      </div>
    </main>
  );
}

function formatMeta({
  distanceMeters,
  durationMinutes,
  approximate,
}: {
  distanceMeters?: number | null;
  durationMinutes?: number | null;
  approximate?: boolean;
}): string {
  const parts: string[] = [];
  if (typeof distanceMeters === "number" && distanceMeters > 0) {
    parts.push(
      distanceMeters < 1000 ? `${distanceMeters} m` : `${(distanceMeters / 1000).toFixed(1)} km`,
    );
  }
  if (typeof durationMinutes === "number") parts.push(`~${durationMinutes} min walk`);
  if (approximate) parts.push("approx. direct line");
  return parts.join(" · ");
}

function FitRoute({ positions }: { positions: LatLngExpression[] }) {
  const map = useMap();
  useEffect(() => {
    const id = window.setTimeout(() => {
      map.invalidateSize();
      if (positions.length >= 2) {
        map.fitBounds(latLngBounds(positions), { padding: [56, 56], maxZoom: 18 });
      }
    }, 150);
    return () => window.clearTimeout(id);
  }, [map, positions]);
  return null;
}
