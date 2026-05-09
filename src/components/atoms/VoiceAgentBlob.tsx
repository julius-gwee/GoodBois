"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Check, Mic } from "lucide-react";
import { cn } from "@/lib/utils";

type VoiceAgentBlobProps = {
  ariaLabel: string;
  onActivate?: () => void;
  className?: string;
  mode?: "idle" | "listening" | "thinking"; // default "idle"
  position?: "center" | "bottom";            // default "center"
  pulseToken?: number;                        // increment to trigger one listening pulse
};

// Per-mode circle fill + icon foreground. Tuned to match the splash recording:
// idle reads as a calm stone, listening as an attentive blue, thinking flips to
// the brand green with a checkmark to signal "got it".
const MODE_STYLES = {
  idle: { fill: "#DDD9CE", icon: "#3E3E38" },        // stone-wash + body-gray
  listening: { fill: "#4F7CF0", icon: "#FFFFFF" },   // confident blue
  thinking: { fill: "#3DA56A", icon: "#FFFFFF" },    // success green
} as const;

const PRESS_DURATION_MS = 250;

export default function VoiceAgentBlob({
  ariaLabel,
  onActivate,
  className,
  mode = "idle",
  position = "center",
  pulseToken,
}: VoiceAgentBlobProps) {
  const reducedMotion = useReducedMotion();
  const [isPressing, setIsPressing] = useState(false);
  const [listeningPulse, setListeningPulse] = useState(false);
  const pressTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listeningPulseRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (pressTimeoutRef.current) clearTimeout(pressTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (mode !== "listening" || pulseToken === undefined) return;
    if (listeningPulseRef.current) clearTimeout(listeningPulseRef.current);
    const onId = setTimeout(() => {
      setListeningPulse(true);
      listeningPulseRef.current = setTimeout(() => setListeningPulse(false), 200);
    }, 0);
    listeningPulseRef.current = onId;
  }, [pulseToken, mode]);

  useEffect(
    () => () => {
      if (listeningPulseRef.current) clearTimeout(listeningPulseRef.current);
    },
    []
  );

  const handleClick = () => {
    if (pressTimeoutRef.current) clearTimeout(pressTimeoutRef.current);
    setIsPressing(true);
    pressTimeoutRef.current = setTimeout(
      () => setIsPressing(false),
      PRESS_DURATION_MS
    );
    onActivate?.();
  };

  const breatheKeyframes = reducedMotion
    ? [0.99, 1.01, 0.99]
    : [0.97, 1.03, 0.97];
  const breatheDuration = reducedMotion ? 12 : 4;

  const scaleAnimate = isPressing
    ? [1.0, 1.07, 1.0]
    : listeningPulse
      ? [1.0, 1.08, 1.0]
      : breatheKeyframes;

  const scaleTransition = isPressing
    ? { duration: PRESS_DURATION_MS / 1000, ease: "easeOut" as const }
    : listeningPulse
      ? { duration: 0.2, ease: "easeOut" as const }
      : { duration: breatheDuration, repeat: Infinity, ease: "easeInOut" as const };

  const sizeClasses =
    position === "bottom"
      ? "h-[20vmin] w-[20vmin]"
      : "h-[40vmin] w-[40vmin]";

  const styles = MODE_STYLES[mode];
  const Icon = mode === "thinking" ? Check : Mic;
  // Mic reads well at ~42% of the circle; Check needs a bit more presence.
  const iconScale = mode === "thinking" ? 0.5 : 0.42;

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={handleClick}
      className={cn(
        "group relative cursor-pointer rounded-full border-0 bg-transparent",
        position === "bottom" ? "p-6" : "p-20",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-sage/40 focus-visible:ring-offset-8 focus-visible:ring-offset-soft-cream",
        className
      )}
    >
      <motion.div
        className={cn(
          sizeClasses,
          "relative flex items-center justify-center rounded-full",
          // rgba(62,62,56,...) is the --body-gray token. Update both shadows if the token changes.
          "drop-shadow-[0_8px_24px_rgba(62,62,56,0.08)]",
          "transition-[filter] duration-150",
          "group-hover:drop-shadow-[0_8px_24px_rgba(62,62,56,0.16)]"
        )}
        animate={{ scale: scaleAnimate, backgroundColor: styles.fill }}
        transition={{
          scale: scaleTransition,
          backgroundColor: { duration: 0.4, ease: "easeOut" },
        }}
        initial={false}
      >
        <motion.span
          className="flex items-center justify-center"
          animate={{ color: styles.icon }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          style={{ width: `${iconScale * 100}%`, height: `${iconScale * 100}%` }}
        >
          <Icon
            strokeWidth={mode === "thinking" ? 3 : 2.4}
            className="h-full w-full"
            aria-hidden="true"
          />
        </motion.span>
      </motion.div>
    </button>
  );
}
