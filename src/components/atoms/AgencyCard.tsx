"use client";

import { Phone, MapPin, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AgencyContact } from "@/types/goodbois";

type AgencyCardProps = {
  agency: AgencyContact;
  language: string;
  className?: string;
};

export default function AgencyCard({ agency, language, className }: AgencyCardProps) {
  const blurb =
    agency.multilingualBlurb[language] ?? agency.multilingualBlurb.en ?? "";

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-2xl border border-stone-wash bg-soft-cream p-5",
        "text-body-gray",
        className
      )}
    >
      <p className="text-lg font-semibold text-deep-charcoal">{agency.name}</p>

      {blurb && (
        <p className="text-base leading-relaxed" lang={language}>
          {blurb}
        </p>
      )}

      {agency.hotline && (
        <a
          href={`tel:${agency.hotline.replace(/\s+/g, "")}`}
          className="flex items-center gap-3 rounded-xl bg-forest-sage px-5 py-4 text-soft-cream hover:bg-leaf-green transition-colors"
        >
          <Phone className="h-6 w-6" aria-hidden="true" />
          <span className="text-2xl font-semibold tracking-wide">
            {agency.hotline}
          </span>
        </a>
      )}

      {agency.address && (
        <div className="flex items-start gap-2 text-sm text-muted-stone">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{agency.address}</span>
        </div>
      )}

      {agency.openingHours && (
        <div className="flex items-start gap-2 text-sm text-muted-stone">
          <Clock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{agency.openingHours}</span>
        </div>
      )}
    </div>
  );
}
