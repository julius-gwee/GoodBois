"use client";

import { cn } from "@/lib/utils";

type ChatMessageProps = {
  role: "agent" | "user";
  text: string;
  language: string;
  className?: string;
};

export default function ChatMessage({
  role,
  text,
  language,
  className,
}: ChatMessageProps) {
  const isAgent = role === "agent";
  return (
    <div
      className={cn(
        "flex w-full",
        isAgent ? "justify-start" : "justify-end",
        className
      )}
    >
      <div
        className={cn(
          "max-w-[78%] rounded-3xl px-6 py-4",
          isAgent
            ? "bg-deep-linen text-body-gray"
            : "bg-forest-sage text-soft-cream"
        )}
      >
        <p className="text-xl leading-relaxed" lang={language}>
          {text}
        </p>
      </div>
    </div>
  );
}
