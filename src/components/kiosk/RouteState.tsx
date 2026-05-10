"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

import { mapAdapter } from "@/lib/map/map-adapter";
import { useUIStrings } from "@/lib/i18n/LanguageContext";
import type { AgencyContact, KioskRouteResponse } from "@/types/goodbois";

const RouteMapCanvas = dynamic(() => import("./RouteMapCanvas"), {
  ssr: false,
  loading: () => <div className="h-dvh w-full bg-deep-linen" />,
});

const WORKER_BASE =
  typeof process !== "undefined" ? process.env.NEXT_PUBLIC_KAWAN_API_BASE : undefined;

type LatLng = { latitude: number; longitude: number };

type RouteData = {
  origin: LatLng;
  destination: LatLng;
  polyline: LatLng[];
  distanceMeters: number | null;
  durationMinutes: number | null;
  approximate: boolean;
};

type RouteStateProps = {
  agency: AgencyContact;
  onBack: () => void;
};

// Straight kiosk→agency line — the immediate render while (or instead of) the
// worker's OneMap route. mapAdapter.center is the kiosk's fixed location.
function straightLineFallback(agency: AgencyContact): RouteData | null {
  if (agency.latitude == null || agency.longitude == null) return null;
  const origin = { latitude: mapAdapter.center.latitude, longitude: mapAdapter.center.longitude };
  const destination = { latitude: agency.latitude, longitude: agency.longitude };
  return {
    origin,
    destination,
    polyline: [origin, destination],
    distanceMeters: null,
    durationMinutes: null,
    approximate: true,
  };
}

export default function RouteState({ agency, onBack }: RouteStateProps) {
  const t = useUIStrings();
  const [route, setRoute] = useState<RouteData | null>(() => straightLineFallback(agency));

  useEffect(() => {
    if (!WORKER_BASE) return; // mock mode — keep the straight-line fallback
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `${WORKER_BASE.replace(/\/$/, "")}/route?agencyKey=${encodeURIComponent(agency.key)}`,
        );
        if (!res.ok) return;
        const data = (await res.json()) as KioskRouteResponse;
        if (cancelled || !Array.isArray(data.polyline) || data.polyline.length < 2) return;
        setRoute({
          origin: data.origin,
          destination: data.destination,
          polyline: data.polyline,
          distanceMeters: typeof data.distanceMeters === "number" ? data.distanceMeters : null,
          durationMinutes: typeof data.durationMinutes === "number" ? data.durationMinutes : null,
          approximate: !data.provider || /direct line/i.test(data.provider),
        });
      } catch {
        // keep the straight-line fallback
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [agency.key]);

  if (!route) return null; // agency has no coordinates — nothing to render

  return (
    <RouteMapCanvas
      origin={route.origin}
      destination={route.destination}
      polyline={route.polyline}
      destinationLabel={agency.name}
      originLabel={t.yourLocation}
      hint={agency.walkingDirectionsHint ?? agency.address ?? null}
      distanceMeters={route.distanceMeters}
      durationMinutes={route.durationMinutes}
      approximate={route.approximate}
      backLabel={t.back}
      onBack={onBack}
    />
  );
}
