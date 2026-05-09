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

type AccessibilitySheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function AccessibilitySheet({
  open,
  onOpenChange,
}: AccessibilitySheetProps) {
  const handleTypeInstead = () => {
    // Phase 1 stub. Phase 2 wires this to the real touch-input flow.
    console.info("[kawan] type fallback requested");
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="bg-soft-cream">
        <SheetHeader>
          <SheetTitle className="text-2xl text-deep-charcoal">
            I can&apos;t speak right now
          </SheetTitle>
          <SheetDescription className="text-lg text-body-gray">
            我不能说话
          </SheetDescription>
        </SheetHeader>
        <div className="px-6 pb-8 pt-4">
          <Button
            onClick={handleTypeInstead}
            className="h-14 w-full bg-forest-sage text-lg text-soft-cream hover:bg-leaf-green"
          >
            Type instead / 改用打字
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
