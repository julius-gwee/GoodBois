"use client";

import { useEffect, useRef } from "react";
import { Save, X } from "lucide-react";
import ChatMessage from "@/components/atoms/ChatMessage";
import AgencyCard from "@/components/atoms/AgencyCard";
import { cn } from "@/lib/utils";
import type { AgencyContact } from "@/types/goodbois";

export type ChatEntry = {
  id: string;
  role: "agent" | "user";
  text: string;
  englishText?: string;
  language: string;
  agency?: AgencyContact;
};

type ChatStateProps = {
  messages: ChatEntry[];
  language: string;
  onSaveReceipt: () => void;
  onReset: () => void;
  className?: string;
};

export default function ChatState({
  messages,
  language,
  onSaveReceipt,
  onReset,
  className,
}: ChatStateProps) {
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
            englishText={m.englishText}
            language={m.language}
          >
            {m.agency && <AgencyCard agency={m.agency} language={language} />}
          </ChatMessage>
        ))}
      </div>

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onReset}
          className={cn(
            "flex items-center gap-2 rounded-full border border-stone-wash bg-soft-cream/80 px-5 py-3",
            "text-base font-medium text-muted-stone hover:bg-deep-linen transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-sage/40 focus-visible:ring-offset-2 focus-visible:ring-offset-soft-cream"
          )}
        >
          <X className="h-4 w-4" aria-hidden="true" />
          <span>Done · 完成</span>
        </button>
        <button
          type="button"
          onClick={onSaveReceipt}
          className={cn(
            "flex items-center gap-2 rounded-full bg-forest-sage px-6 py-3",
            "text-base font-semibold text-soft-cream hover:bg-leaf-green transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-sage/40 focus-visible:ring-offset-2 focus-visible:ring-offset-soft-cream"
          )}
        >
          <Save className="h-4 w-4" aria-hidden="true" />
          <span>Save as receipt · 保存为收据</span>
        </button>
      </div>
    </div>
  );
}
