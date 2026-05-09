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
    <aside className="absolute inset-x-0 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-[60] max-h-[calc(78dvh-5rem)] overflow-y-auto rounded-t-2xl border border-stone-wash bg-soft-cream p-5 text-deep-charcoal shadow-[0_-16px_45px_rgba(26,26,22,0.22)] lg:inset-y-6 lg:left-auto lg:right-6 lg:w-[460px] lg:rounded-2xl">
      <div className="mb-4 flex items-center justify-between gap-3">
        <Button type="button" variant="secondary" className="min-h-11 rounded-full bg-deep-linen text-deep-charcoal hover:bg-stone-wash" onClick={onClose}>
          <ArrowLeft className="size-5" aria-hidden="true" />
          {t(language, "close")}
        </Button>
        {fromChat ? (
          <Button type="button" className="min-h-11 rounded-full bg-forest-sage text-soft-cream hover:bg-leaf-green" onClick={onBackToChat}>
            <MessageCircle className="size-5" aria-hidden="true" />
            {t(language, "backToChat")}
          </Button>
        ) : null}
      </div>

      <p className="text-base font-medium text-forest-sage">{t(language, "routeOptions")}</p>
      <h2 className="mt-1 text-3xl font-semibold leading-tight">
        {getLocalizedText(route.origin.label, language)} -&gt; {getLocalizedText(resource.name, language)}
      </h2>

      <div className="mt-5 grid grid-cols-3 gap-2">
        {routeModes.map((mode) => (
          <Button
            key={mode}
            type="button"
            variant="outline"
            className={
              routeMode === mode
                ? "min-h-14 rounded-full border-forest-sage bg-forest-sage text-base text-soft-cream hover:bg-leaf-green hover:text-soft-cream"
                : "min-h-14 rounded-full border-stone-wash bg-deep-linen text-base text-deep-charcoal hover:bg-stone-wash hover:text-deep-charcoal"
            }
            aria-pressed={routeMode === mode}
            onClick={() => onRouteModeChange(mode)}
          >
            {routeModeLabels[mode][language] ?? routeModeLabels[mode].en}
          </Button>
        ))}
      </div>

      <section className="mt-5 rounded-xl bg-deep-linen p-4 text-deep-charcoal">
        <p className="text-lg font-semibold">{t(language, "selectedRoute")}</p>
        <div className="mt-2 flex items-end gap-4">
          <p className="text-5xl font-semibold">{route.durationMinutes}</p>
          <p className="pb-2 text-lg text-body-gray">min / {route.distanceMeters} m</p>
        </div>
        <p className="mt-2 text-base font-medium text-forest-sage">
          Route source: {getRouteSourceLabel(route.providerLabel)}
        </p>
        {route.notes.map((note) => (
          <p key={getLocalizedText(note, "en")} className="mt-3 text-base leading-6 text-body-gray">
            {getLocalizedText(note, language)}
          </p>
        ))}
      </section>

      <ol className="mt-5 space-y-3">
        {route.steps.map((step, index) => (
          <li key={step.id} className="flex gap-3 rounded-xl bg-deep-linen p-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-leaf-green font-semibold text-deep-charcoal">
              {index + 1}
            </span>
            <div>
              <p className="text-lg leading-7 text-deep-charcoal">{getLocalizedText(step.instruction, language)}</p>
              <p className="text-sm text-muted-stone">
                {step.distanceMeters} m / {step.durationMinutes} min
              </p>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <Button type="button" variant="secondary" className="min-h-14 bg-deep-linen text-base text-deep-charcoal hover:bg-stone-wash" onClick={onReadAloud}>
          <Volume2 className="size-5" aria-hidden="true" />
          {t(language, "readAloud")}
        </Button>
        <Button type="button" className="min-h-14 bg-forest-sage text-base text-soft-cream hover:bg-leaf-green" onClick={onPrint}>
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

function getRouteSourceLabel(providerLabel: string) {
  const normalized = providerLabel.toLowerCase();

  if (normalized.includes("barrier-free") || normalized.includes("bfa")) {
    return "OneMap BFA";
  }

  if (normalized.includes("walking fallback")) {
    return "OneMap walking fallback";
  }

  if (normalized.includes("fixture fallback")) {
    return "Demo route";
  }

  if (normalized.includes("walking")) {
    return "OneMap walking";
  }

  if (normalized.includes("driving")) {
    return "OneMap driving";
  }

  return providerLabel;
}
