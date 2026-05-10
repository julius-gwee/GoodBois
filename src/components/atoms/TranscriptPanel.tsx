"use client";

import { useUILang, useUIStrings } from "@/lib/i18n/LanguageContext";
import { cn } from "@/lib/utils";

type TranscriptPanelProps = {
  transcript: { english: string; srcLang: string } | null;
  isListening: boolean;
  className?: string;
};

export default function TranscriptPanel({
  transcript,
  isListening,
  className,
}: TranscriptPanelProps) {
  const t = useUIStrings();
  const lang = useUILang();
  return (
    <div className={cn("flex flex-col items-center gap-4 text-center", className)}>
      {isListening && (
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-deep-terracotta opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-deep-terracotta" />
          </span>
          <span lang={lang} className="text-base font-medium text-muted-stone">
            {t.listening}
          </span>
        </div>
      )}

      {transcript && transcript.english && (
        <div className="flex max-w-3xl flex-col items-center gap-2">
          <p className="text-2xl font-medium text-body-gray" lang="en">
            {transcript.english}
          </p>
          {transcript.srcLang && transcript.srcLang !== "en" && (
            <p className="text-sm uppercase tracking-wide text-muted-stone">
              {transcript.srcLang}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
