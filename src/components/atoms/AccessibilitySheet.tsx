// src/components/atoms/AccessibilitySheet.tsx
"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useUILang, useUIStrings } from "@/lib/i18n/LanguageContext";

type AccessibilitySheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function AccessibilitySheet({
  open,
  onOpenChange,
}: AccessibilitySheetProps) {
  const t = useUIStrings();
  const lang = useUILang();
  const handleTypeInstead = () => {
    // Phase 1 stub. Phase 2 wires this to the real touch-input flow.
    console.info("[kawan] type fallback requested");
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="bg-soft-cream">
        <SheetHeader>
          <SheetTitle lang={lang} className="text-2xl text-deep-charcoal">
            {t.cannotSpeak}
          </SheetTitle>
          <SheetDescription className="sr-only">
            {t.typeInstead}
          </SheetDescription>
        </SheetHeader>
        <div className="px-6 pb-8 pt-4">
          <Button
            onClick={handleTypeInstead}
            lang={lang}
            className="h-14 w-full bg-forest-sage text-lg text-soft-cream hover:bg-leaf-green"
          >
            {t.typeInstead}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
