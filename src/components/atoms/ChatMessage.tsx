"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type ChatMessageProps = {
  role: "agent" | "user";
  text: string;
  englishText?: string;
  language: string;
  children?: ReactNode;
  className?: string;
};

export default function ChatMessage({
  role,
  text,
  englishText,
  language,
  children,
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
        {englishText && language !== "en" && (
          <p
            className={cn(
              "mt-2 text-sm leading-snug",
              isAgent ? "text-muted-stone" : "text-soft-cream/80"
            )}
            lang="en"
          >
            {englishText}
          </p>
        )}
        {children && <div className="mt-4">{children}</div>}
      </div>
    </div>
  );
}
