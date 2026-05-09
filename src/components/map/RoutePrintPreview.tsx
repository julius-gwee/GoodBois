"use client";

import { X } from "lucide-react";

import { t } from "@/lib/map/i18n";
import type { DirectoryLanguage, RoutePrintPayload } from "@/types/goodbois";
import { Button } from "@/components/ui/button";

type RoutePrintPreviewProps = {
  payload: RoutePrintPayload;
  language: DirectoryLanguage;
  onClose: () => void;
};

export function RoutePrintPreview({ payload, language, onClose }: RoutePrintPreviewProps) {
  return (
    <section className="mt-5 rounded-xl border border-dashed border-stone-wash bg-soft-cream p-4 text-deep-charcoal">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-xl font-semibold">{t(language, "printableGuide")}</h3>
        <Button type="button" variant="ghost" size="icon" aria-label={t(language, "close")} onClick={onClose}>
          <X className="size-5" aria-hidden="true" />
        </Button>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-3 text-base">
        <div>
          <dt className="text-muted-stone">{t(language, "destination")}</dt>
          <dd className="font-semibold">{payload.destinationName}</dd>
        </div>
        <div>
          <dt className="text-muted-stone">{t(language, "route")}</dt>
          <dd className="font-semibold">
            {payload.durationMinutes} min · {payload.distanceMeters} m
          </dd>
        </div>
      </dl>
      <ol className="mt-4 space-y-2 text-base leading-6">
        {payload.steps.map((step, index) => (
          <li key={`${step}-${index}`}>
            {index + 1}. {step}
          </li>
        ))}
      </ol>
      <p className="mt-4 rounded-lg bg-deep-linen p-3 text-sm font-medium text-body-gray">
        {t(language, "routeDisclaimer")} / {payload.disclaimerEnglish}
      </p>
    </section>
  );
}
