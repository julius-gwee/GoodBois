"use client";

import { useEffect, useRef } from "react";
import { Eye, MapPin, X } from "lucide-react";
import ChatMessage from "@/components/atoms/ChatMessage";
import { useUILang, useUIStrings } from "@/lib/i18n/LanguageContext";
import { cn } from "@/lib/utils";

export type ChatEntry = {
  id: string;
  role: "agent" | "user";
  text: string;
  language: string;
};

type ChatStateProps = {
  messages: ChatEntry[];
  onViewReceipt?: () => void; // present only when a receipt is ready
  onViewDirections?: () => void; // present only when a signposted agency has coords
  onReset: () => void;
  className?: string;
};

export default function ChatState({
  messages,
  onViewReceipt,
  onViewDirections,
  onReset,
  className,
}: ChatStateProps) {
  const t = useUIStrings();
  const lang = useUILang();
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  return (
    <div
      className={cn(
        "flex w-full flex-col gap-4 px-[8vw]",
        className
      )}
    >
      <div
        ref={scrollRef}
        className="flex max-h-[55vh] flex-col gap-4 overflow-y-auto rounded-3xl bg-soft-cream/40 p-4"
      >
        {messages.map((m) => (
          <ChatMessage
            key={m.id}
            role={m.role}
            text={m.text}
            language={m.language}
          />
        ))}
      </div>

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onReset}
          lang={lang}
          className={cn(
            "flex items-center gap-2 rounded-full border border-stone-wash bg-soft-cream/80 px-5 py-3",
            "text-base font-medium text-muted-stone hover:bg-deep-linen transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-sage/40 focus-visible:ring-offset-2 focus-visible:ring-offset-soft-cream"
          )}
        >
          <X className="h-4 w-4" aria-hidden="true" />
          <span>{t.done}</span>
        </button>
        {onViewDirections && (
          <button
            type="button"
            onClick={onViewDirections}
            lang={lang}
            className={cn(
              "flex items-center gap-2 rounded-full border border-forest-sage/40 bg-soft-cream/80 px-5 py-3",
              "text-base font-semibold text-forest-sage hover:bg-deep-linen transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-sage/40 focus-visible:ring-offset-2 focus-visible:ring-offset-soft-cream"
            )}
          >
            <MapPin className="h-4 w-4" aria-hidden="true" />
            <span>{t.viewDirections}</span>
          </button>
        )}
        {onViewReceipt && (
          <button
            type="button"
            onClick={onViewReceipt}
            lang={lang}
            className={cn(
              "flex items-center gap-2 rounded-full bg-forest-sage px-6 py-3",
              "text-base font-semibold text-soft-cream hover:bg-leaf-green transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-sage/40 focus-visible:ring-offset-2 focus-visible:ring-offset-soft-cream"
            )}
          >
            <Eye className="h-4 w-4" aria-hidden="true" />
            <span>{t.viewReceipt}</span>
          </button>
        )}
      </div>
    </div>
  );
}
