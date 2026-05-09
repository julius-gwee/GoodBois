"use client";

import { directoryLanguages, t } from "@/lib/map/i18n";
import type { DirectoryLanguage } from "@/types/goodbois";
import { Button } from "@/components/ui/button";

type LanguageBarProps = {
  language: DirectoryLanguage;
  onLanguageChange: (language: DirectoryLanguage) => void;
};

export function LanguageBar({ language, onLanguageChange }: LanguageBarProps) {
  return (
    <section
      aria-label={t(language, "language")}
      className="flex w-full items-center gap-2 overflow-x-auto border-t border-neutral-200 bg-white/95 px-4 py-3 shadow-[0_-10px_30px_rgba(23,23,23,0.08)] backdrop-blur"
    >
      {directoryLanguages.map((item) => (
        <Button
          key={item.code}
          type="button"
          variant={language === item.code ? "default" : "outline"}
          className="min-h-12 min-w-20 rounded-full px-4 text-base"
          aria-pressed={language === item.code}
          onClick={() => onLanguageChange(item.code)}
        >
          <span aria-hidden="true" className="font-semibold">
            {item.shortLabel}
          </span>
          <span className="sr-only">{item.label}</span>
        </Button>
      ))}
    </section>
  );
}
