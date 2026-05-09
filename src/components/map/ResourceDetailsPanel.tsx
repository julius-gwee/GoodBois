"use client";

import { ArrowLeft, Clock, MessageCircle, Phone, Printer, Route, Volume2 } from "lucide-react";

import { getLocalizedText } from "@/lib/map/directory";
import { categoryLabels, confidenceKeys, hazardStatusKeys, t, verificationLabels } from "@/lib/map/i18n";
import type { DirectoryLanguage, Resource } from "@/types/goodbois";
import { Button } from "@/components/ui/button";
import { ResourcePrintPreview } from "./ResourcePrintPreview";

type ResourceDetailsPanelProps = {
  resource: Resource;
  language: DirectoryLanguage;
  fromChat: boolean;
  onClose: () => void;
  onDirections: () => void;
  onPrintDetails: () => void;
  onClosePrintDetails: () => void;
  onReadAloud: () => void;
  onBackToChat: () => void;
  showPrintDetails: boolean;
};

export function ResourceDetailsPanel({
  resource,
  language,
  fromChat,
  onClose,
  onDirections,
  onPrintDetails,
  onClosePrintDetails,
  onReadAloud,
  onBackToChat,
  showPrintDetails,
}: ResourceDetailsPanelProps) {
  return (
    <aside className="absolute inset-x-0 bottom-0 z-50 max-h-[74dvh] overflow-y-auto rounded-t-2xl border border-stone-wash bg-soft-cream p-5 text-deep-charcoal shadow-[0_-16px_45px_rgba(26,26,22,0.22)] lg:inset-y-6 lg:left-auto lg:right-6 lg:w-[430px] lg:rounded-2xl">
      <div className="mb-4 flex items-center justify-between gap-3">
        <Button type="button" variant="outline" className="min-h-11 rounded-full border-stone-wash bg-deep-linen text-deep-charcoal hover:bg-stone-wash" onClick={onClose}>
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

      <div className="space-y-3">
        <p className="text-base font-medium text-forest-sage">
          {categoryLabels[resource.category][language] ?? categoryLabels[resource.category].en}
        </p>
        <h2 className="text-3xl font-semibold leading-tight text-deep-charcoal">
          {getLocalizedText(resource.name, language)}
        </h2>
        <p className="text-lg leading-7 text-body-gray">
          {getLocalizedText(resource.description, language)}
        </p>
        {resource.openingHours ? (
          <p className="flex items-center gap-2 rounded-lg bg-deep-linen px-3 py-2 text-base text-body-gray">
            <Clock className="size-5 text-muted-stone" aria-hidden="true" />
            {getLocalizedText(resource.openingHours, language)}
          </p>
        ) : null}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <Button type="button" className="min-h-14 bg-forest-sage text-base text-soft-cream hover:bg-leaf-green" onClick={onDirections}>
          <Route className="size-5" aria-hidden="true" />
          {t(language, "directions")}
        </Button>
        <Button type="button" variant="outline" className="min-h-14 border-stone-wash bg-deep-linen text-base text-deep-charcoal hover:bg-stone-wash" onClick={onPrintDetails}>
          <Printer className="size-5" aria-hidden="true" />
          {t(language, "printDetails")}
        </Button>
        <Button type="button" variant="secondary" className="min-h-14 bg-deep-linen text-base text-deep-charcoal hover:bg-stone-wash" onClick={onReadAloud}>
          <Volume2 className="size-5" aria-hidden="true" />
          {t(language, "readAloud")}
        </Button>
        {resource.contactPhone ? (
          <Button type="button" variant="secondary" className="min-h-14 bg-deep-linen text-base text-deep-charcoal hover:bg-stone-wash">
            <Phone className="size-5" aria-hidden="true" />
            {resource.contactPhone}
          </Button>
        ) : null}
      </div>

      <Section title={t(language, "whatHere")}>
        <p>{getLocalizedText(resource.address, language)}</p>
      </Section>
      <Section title={t(language, "accessibility")}>
        <ul className="space-y-2">
          {resource.accessibilityFeatures.map((feature) => (
            <li key={getLocalizedText(feature, "en")}>{getLocalizedText(feature, language)}</li>
          ))}
        </ul>
      </Section>
      <Section title={t(language, "practicalNotes")}>
        <ul className="space-y-2">
          {resource.practicalNotes.map((note) => (
            <li key={getLocalizedText(note, "en")}>{getLocalizedText(note, language)}</li>
          ))}
        </ul>
      </Section>
      <p className="mt-4 rounded-lg bg-deep-linen px-3 py-2 text-base font-medium text-forest-sage">
        {verificationLabels[resource.verificationStatus][language] ??
          verificationLabels[resource.verificationStatus].en}
      </p>
      <div className="mt-3 grid gap-2 text-base font-medium sm:grid-cols-2">
        <p className="rounded-lg bg-deep-linen px-3 py-2 text-body-gray">
          {t(language, confidenceKeys[resource.confidenceLevel])}
        </p>
        <p className="rounded-lg border border-deep-terracotta/30 bg-deep-linen px-3 py-2 text-deep-terracotta">
          {t(language, hazardStatusKeys[resource.currentHazardStatus ?? "unknown"])}
        </p>
      </div>
      {showPrintDetails ? (
        <ResourcePrintPreview resource={resource} language={language} onClose={onClosePrintDetails} />
      ) : null}
    </aside>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-5 space-y-2 border-t border-stone-wash pt-4 text-base leading-7 text-body-gray">
      <h3 className="text-lg font-semibold text-deep-charcoal">{title}</h3>
      {children}
    </section>
  );
}
