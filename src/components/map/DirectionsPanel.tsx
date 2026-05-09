"use client";

import { ArrowLeft, MessageCircle, Printer, Volume2 } from "lucide-react";

import { buildRoutePrintPayload, getLocalizedText, getRouteForMode } from "@/lib/map/directory";
import { routeModeLabels, t } from "@/lib/map/i18n";
import type { DirectoryLanguage, Resource, RouteMode, RouteOption } from "@/types/goodbois";
import { Button } from "@/components/ui/button";
import { RoutePrintPreview } from "./RoutePrintPreview";

const routeModes: RouteMode[] = ["wheelchair", "walk", "drive"];

type DirectionsPanelProps = {
  resource: Resource;
  routes: RouteOption[];
  routeMode: RouteMode;
  language: DirectoryLanguage;
  fromChat: boolean;
  showPrintPreview: boolean;
  onRouteModeChange: (mode: RouteMode) => void;
  onClose: () => void;
  onPrint: () => void;
  onClosePrint: () => void;
  onReadAloud: () => void;
  onBackToChat: () => void;
};

export function DirectionsPanel({
  resource,
  routes,
  routeMode,
  language,
  fromChat,
  showPrintPreview,
  onRouteModeChange,
  onClose,
  onPrint,
  onClosePrint,
  onReadAloud,
  onBackToChat,
}: DirectionsPanelProps) {
  const route = getRouteForMode(routes, routeMode);
  const printPayload = buildRoutePrintPayload(resource, route, language);

  return (
    <aside className="absolute inset-x-0 bottom-0 z-[60] max-h-[78dvh] overflow-y-auto rounded-t-2xl bg-neutral-950 p-5 text-white shadow-[0_-16px_45px_rgba(23,23,23,0.32)] lg:inset-y-6 lg:left-auto lg:right-6 lg:w-[460px] lg:rounded-2xl">
      <div className="mb-4 flex items-center justify-between gap-3">
        <Button type="button" variant="secondary" className="min-h-11 rounded-full" onClick={onClose}>
          <ArrowLeft className="size-5" aria-hidden="true" />
          {t(language, "close")}
        </Button>
        {fromChat ? (
          <Button type="button" className="min-h-11 rounded-full bg-amber-500 text-neutral-950 hover:bg-amber-400" onClick={onBackToChat}>
            <MessageCircle className="size-5" aria-hidden="true" />
            {t(language, "backToChat")}
          </Button>
        ) : null}
      </div>

      <p className="text-base font-medium text-teal-200">{t(language, "routeOptions")}</p>
      <h2 className="mt-1 text-3xl font-semibold leading-tight">
        {getLocalizedText(route.origin.label, language)} → {getLocalizedText(resource.name, language)}
      </h2>

      <div className="mt-5 grid grid-cols-3 gap-2">
        {routeModes.map((mode) => (
          <Button
            key={mode}
            type="button"
            variant={routeMode === mode ? "secondary" : "outline"}
            className="min-h-14 rounded-full border-white/20 bg-white/10 text-base text-white hover:bg-white/20 data-[variant=secondary]:bg-teal-300 data-[variant=secondary]:text-neutral-950"
            aria-pressed={routeMode === mode}
            onClick={() => onRouteModeChange(mode)}
          >
            {routeModeLabels[mode][language] ?? routeModeLabels[mode].en}
          </Button>
        ))}
      </div>

      <section className="mt-5 rounded-xl bg-white p-4 text-neutral-950">
        <p className="text-lg font-semibold">{t(language, "selectedRoute")}</p>
        <div className="mt-2 flex items-end gap-4">
          <p className="text-5xl font-semibold">{route.durationMinutes}</p>
          <p className="pb-2 text-lg">min · {route.distanceMeters} m</p>
        </div>
        <p className="mt-2 rounded-lg bg-amber-100 px-3 py-2 text-base font-medium text-amber-950">
          {route.providerLabel}
        </p>
        {route.notes.map((note) => (
          <p key={getLocalizedText(note, "en")} className="mt-3 text-base leading-6 text-neutral-700">
            {getLocalizedText(note, language)}
          </p>
        ))}
      </section>

      <ol className="mt-5 space-y-3">
        {route.steps.map((step, index) => (
          <li key={step.id} className="flex gap-3 rounded-xl bg-white/10 p-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-teal-300 font-semibold text-neutral-950">
              {index + 1}
            </span>
            <div>
              <p className="text-lg leading-7">{getLocalizedText(step.instruction, language)}</p>
              <p className="text-sm text-neutral-300">
                {step.distanceMeters} m · {step.durationMinutes} min
              </p>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <Button type="button" variant="secondary" className="min-h-14 text-base" onClick={onReadAloud}>
          <Volume2 className="size-5" aria-hidden="true" />
          {t(language, "readAloud")}
        </Button>
        <Button type="button" className="min-h-14 bg-amber-500 text-base text-neutral-950 hover:bg-amber-400" onClick={onPrint}>
          <Printer className="size-5" aria-hidden="true" />
          {t(language, "print")}
        </Button>
      </div>

      {showPrintPreview ? (
        <RoutePrintPreview payload={printPayload} language={language} onClose={onClosePrint} />
      ) : null}
    </aside>
  );
}
