"use client";

import TranscriptPanel from "@/components/atoms/TranscriptPanel";
import { cn } from "@/lib/utils";

type ThinkingStateProps = {
  transcript: { original: string; english?: string; language: string } | null;
  onCancel: () => void;
  className?: string;
};

export default function ThinkingState({
  transcript,
  onCancel,
  className,
}: ThinkingStateProps) {
  return (
    <div
      className={cn(
        "flex w-full flex-col items-center gap-8 px-[8vw]",
        className
      )}
    >
      <TranscriptPanel transcript={transcript} isListening={false} />

      <div className="flex items-center gap-2">
        <span className="text-base font-medium text-muted-stone">
          Thinking · 正在思考
        </span>
        <span className="flex gap-1" aria-hidden="true">
          <span
            className="h-2 w-2 animate-bounce rounded-full bg-forest-sage"
            style={{ animationDelay: "0ms" }}
          />
          <span
            className="h-2 w-2 animate-bounce rounded-full bg-forest-sage"
            style={{ animationDelay: "150ms" }}
          />
          <span
            className="h-2 w-2 animate-bounce rounded-full bg-forest-sage"
            style={{ animationDelay: "300ms" }}
          />
        </span>
      </div>

      <button
        type="button"
        onClick={onCancel}
        className={cn(
          "rounded-full border border-stone-wash bg-soft-cream/80 px-6 py-3",
          "text-base font-medium text-body-gray hover:bg-deep-linen transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-sage/40 focus-visible:ring-offset-2 focus-visible:ring-offset-soft-cream"
        )}
      >
        Cancel · 取消
      </button>
    </div>
  );
}
