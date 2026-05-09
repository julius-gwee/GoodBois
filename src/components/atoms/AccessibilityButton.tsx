"use client";

import { useState } from "react";
import { Accessibility } from "lucide-react";
import { cn } from "@/lib/utils";
import AccessibilitySheet from "./AccessibilitySheet";

type AccessibilityButtonProps = {
  className?: string;
};

export default function AccessibilityButton({
  className,
}: AccessibilityButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-label="Accessibility options"
        onClick={() => setOpen(true)}
        className={cn(
          "flex h-11 w-11 items-center justify-center rounded-full",
          "text-muted-stone hover:text-body-gray",
          "transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-sage/40 focus-visible:ring-offset-2 focus-visible:ring-offset-soft-cream",
          className
        )}
      >
        <Accessibility className="h-7 w-7" aria-hidden="true" />
      </button>
      <AccessibilitySheet open={open} onOpenChange={setOpen} />
    </>
  );
}
