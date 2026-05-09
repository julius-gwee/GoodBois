"use client";

import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

type ReceiptIframeProps = {
  pdfUrl: string;
  onBack: () => void;
  className?: string;
};

export default function ReceiptIframe({
  pdfUrl,
  onBack,
  className,
}: ReceiptIframeProps) {
  return (
    <div className={cn("relative h-screen w-screen bg-soft-cream", className)}>
      <iframe
        src={pdfUrl}
        title="Receipt / 收据"
        className="h-full w-full border-0 bg-soft-cream"
      />
      <button
        type="button"
        onClick={onBack}
        aria-label="Back to home / 回去"
        className={cn(
          "absolute left-6 top-6 flex items-center gap-2 rounded-full bg-soft-cream/95 px-5 py-3",
          "text-base font-medium text-body-gray shadow-sm border border-stone-wash",
          "hover:bg-deep-linen transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-sage/40 focus-visible:ring-offset-2 focus-visible:ring-offset-soft-cream"
        )}
      >
        <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        <span>Back · 回去</span>
      </button>
    </div>
  );
}
