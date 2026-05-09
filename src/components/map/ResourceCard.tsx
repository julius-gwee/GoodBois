"use client";

import { MapPin, ShieldCheck, TriangleAlert } from "lucide-react";

import { getLocalizedText } from "@/lib/map/directory";
import { categoryLabels, confidenceKeys, hazardStatusKeys, t, verificationLabels } from "@/lib/map/i18n";
import type { DirectoryLanguage, Resource } from "@/types/goodbois";
import { cn } from "@/lib/utils";

type ResourceCardProps = {
  resource: Resource;
  language: DirectoryLanguage;
  selected: boolean;
  onSelect: (resource: Resource) => void;
};

export function ResourceCard({ resource, language, selected, onSelect }: ResourceCardProps) {
  const hasCaution = resource.currentHazardStatus === "caution" || resource.currentHazardStatus === "avoid";

  return (
    <button
      type="button"
      className={cn(
        "w-full rounded-lg border bg-deep-linen p-4 text-left shadow-sm transition hover:border-leaf-green focus-visible:ring-3 focus-visible:ring-leaf-green/40 focus-visible:outline-none",
        selected ? "border-forest-sage ring-2 ring-leaf-green/30" : "border-stone-wash",
      )}
      onClick={() => onSelect(resource)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-lg font-semibold text-deep-charcoal">
            {getLocalizedText(resource.name, language)}
          </p>
          <p className="flex items-center gap-1 text-sm text-muted-stone">
            <MapPin className="size-4" aria-hidden="true" />
            {categoryLabels[resource.category][language] ?? categoryLabels[resource.category].en}
          </p>
        </div>
        {hasCaution ? (
          <TriangleAlert className="size-6 shrink-0 text-deep-terracotta" aria-label="Caution" />
        ) : (
          <ShieldCheck className="size-6 shrink-0 text-forest-sage" aria-label="Verified or safe status" />
        )}
      </div>
      <p className="mt-3 text-base leading-6 text-body-gray">
        {getLocalizedText(resource.description, language)}
      </p>
      <div className="mt-3 flex flex-wrap gap-2 text-sm">
        <span className="rounded-full bg-soft-cream px-3 py-1 font-medium text-forest-sage">
          {verificationLabels[resource.verificationStatus][language] ??
            verificationLabels[resource.verificationStatus].en}
        </span>
        {resource.openingHours ? (
          <span className="rounded-full bg-stone-wash px-3 py-1 text-body-gray">
            {getLocalizedText(resource.openingHours, language)}
          </span>
        ) : null}
        <span className="rounded-full bg-soft-cream px-3 py-1 font-medium text-body-gray">
          {t(language, confidenceKeys[resource.confidenceLevel])}
        </span>
        {resource.currentHazardStatus && resource.currentHazardStatus !== "none" ? (
          <span className="rounded-full border border-deep-terracotta/30 bg-soft-cream px-3 py-1 font-medium text-deep-terracotta">
            {t(language, hazardStatusKeys[resource.currentHazardStatus])}
          </span>
        ) : null}
      </div>
    </button>
  );
}
