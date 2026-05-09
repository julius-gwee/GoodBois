// src/components/kiosk/Wordmark.tsx
import { cn } from "@/lib/utils";

type WordmarkProps = {
  className?: string;
};

export default function Wordmark({ className }: WordmarkProps) {
  return (
    <span
      className={cn(
        "text-2xl font-semibold tracking-tight text-deep-charcoal",
        className
      )}
    >
      Kawan
    </span>
  );
}
