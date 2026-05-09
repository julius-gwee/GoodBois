"use client";

import TranscriptPanel from "@/components/atoms/TranscriptPanel";
import { cn } from "@/lib/utils";

type ListeningStateProps = {
  transcript: { english: string; srcLang: string } | null;
  onStop: () => void;
  className?: string;
};

export default function ListeningState({
  transcript,
  onStop,
  className,
}: ListeningStateProps) {
  return (
    <div
      className={cn(
        "flex w-full flex-col items-center gap-8 px-[8vw]",
        className
      )}
    >
      <TranscriptPanel transcript={transcript} isListening={true} />

      <button
        type="button"
        onClick={onStop}
        className={cn(
          "rounded-full border border-stone-wash bg-soft-cream/80 px-6 py-3",
          "text-base font-medium text-body-gray hover:bg-deep-linen transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-sage/40 focus-visible:ring-offset-2 focus-visible:ring-offset-soft-cream"
        )}
      >
        Stop · 停止
      </button>
    </div>
  );
}
