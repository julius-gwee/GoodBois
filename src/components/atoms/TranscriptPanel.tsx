"use client";

import { cn } from "@/lib/utils";

type TranscriptPanelProps = {
  transcript: { original: string; english?: string; language: string } | null;
  isListening: boolean;
  className?: string;
};

export default function TranscriptPanel({
  transcript,
  isListening,
  className,
}: TranscriptPanelProps) {
  return (
    <div className={cn("flex flex-col items-center gap-4 text-center", className)}>
      {isListening && (
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-deep-terracotta opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-deep-terracotta" />
          </span>
          <span className="text-base font-medium text-muted-stone">
            Listening · 正在听
          </span>
        </div>
      )}

      {transcript && (
        <div className="flex max-w-3xl flex-col items-center gap-2">
          <p
            className="text-2xl font-medium text-body-gray"
            lang={transcript.language}
          >
            {transcript.original}
          </p>
          {transcript.english && transcript.language !== "en" && (
            <p className="text-base text-muted-stone" lang="en">
              {transcript.english}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
