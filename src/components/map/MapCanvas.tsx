"use client";

import { LocateFixed, MessageCircle, Navigation } from "lucide-react";

import { mapAdapter } from "@/lib/map/map-adapter";
import { getLocalizedText } from "@/lib/map/directory";
import { kioskLocation } from "@/lib/map/fixtures";
import type { DirectoryLanguage, Resource, RouteOption } from "@/types/goodbois";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type MapCanvasProps = {
  resources: Resource[];
  selectedResource?: Resource;
  selectedRoute?: RouteOption;
  language: DirectoryLanguage;
  fromChat: boolean;
  onSelectResource: (resource: Resource) => void;
  onBackToChat: () => void;
};

export function MapCanvas({
  resources,
  selectedResource,
  selectedRoute,
  language,
  fromChat,
  onSelectResource,
  onBackToChat,
}: MapCanvasProps) {
  const points = mapAdapter.projectResources(resources);
  const route = selectedRoute ? mapAdapter.projectRoute(selectedRoute) : undefined;
  const path = route?.points.map((point) => `${point.x},${point.y}`).join(" ");

  return (
    <section className="relative min-h-[48dvh] flex-1 overflow-hidden bg-[#dce9e3] text-neutral-950 lg:min-h-dvh">
      <div className="absolute inset-0 bg-[linear-gradient(30deg,rgba(255,255,255,.55)_1px,transparent_1px),linear-gradient(120deg,rgba(255,255,255,.5)_1px,transparent_1px)] bg-[size:78px_78px]" />
      <div className="absolute left-[12%] top-0 h-full w-16 -rotate-12 bg-[#98b8bf]/70" />
      <div className="absolute left-[34%] top-[-20%] h-[140%] w-20 rotate-[28deg] bg-[#aec7b4]/80" />
      <div className="absolute right-[18%] top-0 h-full w-16 rotate-[8deg] bg-[#f0d29a]/80" />
      <div className="absolute bottom-[20%] left-0 h-16 w-full -rotate-6 bg-[#9db6cc]/70" />

      {path ? (
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <polyline
            points={path}
            fill="none"
            stroke="#0f766e"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.2"
            strokeDasharray={selectedRoute?.mode === "wheelchair" ? "1 1.5" : undefined}
          />
        </svg>
      ) : null}

      <div
        className="absolute z-10 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
        style={{ left: "38%", top: "58%" }}
      >
        <span className="rounded-full border-4 border-white bg-blue-600 p-2 shadow-lg" aria-label="Your location">
          <LocateFixed className="size-5 text-white" aria-hidden="true" />
        </span>
        <span className="mt-1 max-w-48 truncate rounded-full bg-white px-3 py-1 text-sm font-semibold shadow">
          {language === "en" ? "Your location" : getLocalizedText(kioskLocation.label, language)}
        </span>
      </div>

      {points.map((point) => {
        const resource = resources.find((item) => item.id === point.id);
        if (!resource) {
          return null;
        }

        const selected = selectedResource?.id === resource.id;

        return (
          <button
            key={point.id}
            type="button"
            className={cn(
              "absolute z-20 flex size-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-4 border-white shadow-lg transition focus-visible:ring-3 focus-visible:ring-teal-300 focus-visible:outline-none",
              selected ? "scale-110 bg-amber-500" : "bg-teal-700",
            )}
            style={{ left: `${point.x}%`, top: `${point.y}%` }}
            aria-label={getLocalizedText(resource.name, language)}
            onClick={() => onSelectResource(resource)}
          >
            <MapPinGlyph selected={selected} />
          </button>
        );
      })}

      <div className="absolute right-4 top-28 z-30 flex flex-col gap-3">
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
    </section>
  );
}

function MapPinGlyph({ selected }: { selected: boolean }) {
  return (
    <span
      className={cn(
        "block size-4 rounded-full border-2 border-white",
        selected ? "bg-neutral-950" : "bg-white",
      )}
      aria-hidden="true"
    />
  );
}
