"use client";

import { directoryLanguages, t } from "@/lib/map/i18n";
import type { DirectoryLanguage } from "@/types/goodbois";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type LanguageBarProps = {
  language: DirectoryLanguage;
  onLanguageChange: (language: DirectoryLanguage) => void;
};

export function LanguageBar({ language, onLanguageChange }: LanguageBarProps) {
  return (
    <section
      aria-label={t(language, "language")}
      className="flex w-full items-center gap-2 overflow-x-auto border-t border-stone-wash bg-soft-cream/95 px-4 py-3 shadow-[0_-10px_30px_rgba(26,26,22,0.08)] backdrop-blur"
    >
      {directoryLanguages.map((item) => (
        <Button
          key={item.code}
          type="button"
          variant="outline"
          className={cn(
            "min-h-12 min-w-20 rounded-full border px-4 text-base",
            language === item.code
              ? "border-forest-sage bg-forest-sage text-soft-cream hover:bg-leaf-green hover:text-soft-cream"
              : "border-stone-wash bg-deep-linen text-deep-charcoal hover:bg-stone-wash",
          )}
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
