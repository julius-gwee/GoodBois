"use client";

import { X } from "lucide-react";

import { getLocalizedText } from "@/lib/map/directory";
import { categoryLabels, confidenceKeys, hazardStatusKeys, t, verificationLabels } from "@/lib/map/i18n";
import type { DirectoryLanguage, Resource } from "@/types/goodbois";
import { Button } from "@/components/ui/button";

type ResourcePrintPreviewProps = {
  resource: Resource;
  language: DirectoryLanguage;
  onClose: () => void;
};

export function ResourcePrintPreview({ resource, language, onClose }: ResourcePrintPreviewProps) {
  return (
    <section className="mt-5 rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-4 text-neutral-950">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-xl font-semibold">{t(language, "printableDetails")}</h3>
        <Button type="button" variant="ghost" size="icon" aria-label={t(language, "close")} onClick={onClose}>
          <X className="size-5" aria-hidden="true" />
        </Button>
      </div>

      <div className="mt-3 space-y-3 text-base leading-6">
        <div>
          <p className="text-sm font-medium text-neutral-500">{t(language, "destination")}</p>
          <p className="text-lg font-semibold">{getLocalizedText(resource.name, language)}</p>
          <p className="text-neutral-700">
            {categoryLabels[resource.category][language] ?? categoryLabels[resource.category].en}
          </p>
        </div>

        <DetailRow label={t(language, "whatHere")} value={getLocalizedText(resource.address, language)} />
        {resource.openingHours ? (
          <DetailRow label={t(language, "openNow")} value={getLocalizedText(resource.openingHours, language)} />
        ) : null}
        {resource.contactPhone ? <DetailRow label={t(language, "contact")} value={resource.contactPhone} /> : null}

        <div>
          <p className="font-semibold">{t(language, "accessibility")}</p>
          <ul className="mt-1 list-inside list-disc space-y-1">
            {resource.accessibilityFeatures.map((feature) => (
              <li key={getLocalizedText(feature, "en")}>{getLocalizedText(feature, language)}</li>
            ))}
          </ul>
        </div>

        <div>
          <p className="font-semibold">{t(language, "practicalNotes")}</p>
          <ul className="mt-1 list-inside list-disc space-y-1">
            {resource.practicalNotes.map((note) => (
              <li key={getLocalizedText(note, "en")}>{getLocalizedText(note, language)}</li>
            ))}
          </ul>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <p className="rounded-lg bg-white px-3 py-2">
            {verificationLabels[resource.verificationStatus][language] ?? verificationLabels[resource.verificationStatus].en}
          </p>
          <p className="rounded-lg bg-white px-3 py-2">{t(language, confidenceKeys[resource.confidenceLevel])}</p>
          <p className="rounded-lg bg-white px-3 py-2">
            {t(language, hazardStatusKeys[resource.currentHazardStatus ?? "unknown"])}
          </p>
        </div>

        <p className="rounded-lg bg-white p-3 text-sm font-medium text-neutral-700">
          {t(language, "detailsDisclaimer")}
        </p>
      </div>
    </section>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm font-medium text-neutral-500">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  );
}
