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
        "w-full rounded-lg border bg-white p-4 text-left shadow-sm transition hover:border-teal-500 focus-visible:ring-3 focus-visible:ring-teal-300 focus-visible:outline-none",
        selected ? "border-teal-600 ring-2 ring-teal-200" : "border-neutral-200",
      )}
      onClick={() => onSelect(resource)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-lg font-semibold text-neutral-950">
            {getLocalizedText(resource.name, language)}
          </p>
          <p className="flex items-center gap-1 text-sm text-neutral-600">
            <MapPin className="size-4" aria-hidden="true" />
            {categoryLabels[resource.category][language] ?? categoryLabels[resource.category].en}
          </p>
        </div>
        {hasCaution ? (
          <TriangleAlert className="size-6 shrink-0 text-amber-600" aria-label="Caution" />
        ) : (
          <ShieldCheck className="size-6 shrink-0 text-teal-700" aria-label="Verified or safe status" />
        )}
      </div>
      <p className="mt-3 text-base leading-6 text-neutral-800">
        {getLocalizedText(resource.description, language)}
      </p>
      <div className="mt-3 flex flex-wrap gap-2 text-sm">
        <span className="rounded-full bg-teal-50 px-3 py-1 font-medium text-teal-800">
          {verificationLabels[resource.verificationStatus][language] ??
            verificationLabels[resource.verificationStatus].en}
        </span>
        {resource.openingHours ? (
          <span className="rounded-full bg-stone-100 px-3 py-1 text-neutral-700">
            {getLocalizedText(resource.openingHours, language)}
          </span>
        ) : null}
        <span className="rounded-full bg-blue-50 px-3 py-1 font-medium text-blue-900">
          {t(language, confidenceKeys[resource.confidenceLevel])}
        </span>
        {resource.currentHazardStatus && resource.currentHazardStatus !== "none" ? (
          <span className="rounded-full bg-amber-100 px-3 py-1 font-medium text-amber-950">
            {t(language, hazardStatusKeys[resource.currentHazardStatus])}
          </span>
        ) : null}
      </div>
    </button>
  );
}
