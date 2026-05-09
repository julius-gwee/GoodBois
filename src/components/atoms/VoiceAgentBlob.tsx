"use client";

import { useEffect, useId, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

type VoiceAgentBlobProps = {
  ariaLabel: string;
  onActivate?: () => void;
  className?: string;
  mode?: "idle" | "listening" | "thinking"; // default "idle"
  position?: "center" | "bottom";            // default "center"
  pulseToken?: number;                        // increment to trigger one listening pulse
};

// Three hand-tuned 5-petal silhouettes on a 200x200 viewBox, centered around (100,100).
// Each path traces five cardinal lobes with slightly different control points so the
// morph reads as one flower breathing rather than three unrelated shapes.
const PETAL_PATHS = [
  "M100,18 C140,18 168,46 178,82 C196,108 184,146 154,162 C132,180 100,182 80,170 C44,176 16,148 22,108 C12,80 36,42 70,28 C82,22 90,18 100,18 Z",
  "M100,22 C148,18 172,52 174,90 C188,116 178,150 146,164 C124,180 96,184 76,168 C42,172 20,140 26,104 C18,76 42,38 74,30 C84,24 92,22 100,22 Z",
  "M100,16 C144,22 170,48 180,86 C190,112 180,150 150,168 C128,182 96,178 78,166 C42,178 14,144 24,106 C16,78 38,40 72,26 C84,20 92,16 100,16 Z",
];

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
  const gradientId = useId();
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
    // Defer the state update out of the effect body to avoid cascading renders.
    // setTimeout(..., 0) schedules it after the current render cycle, keeping
    // the pulse visually immediate while satisfying the linter rule.
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
    // onActivate fires immediately (not after the press animation) for minimum
    // tap-to-action latency. If a future caller replaces this UI on activate,
    // consider delaying by PRESS_DURATION_MS.
    onActivate?.();
  };

  // While pressing: short keyframe scale 1.0 → 1.07 → 1.0
  // Otherwise: continuous breathing 0.95 ↔ 1.05 (or 0.98 ↔ 1.02 reduced)
  const breatheKeyframes = reducedMotion
    ? [0.98, 1.02, 0.98]
    : [0.95, 1.05, 0.95];
  const breatheDuration = reducedMotion ? 12 : 4;

  // Scale priority: pressing > listening pulse > breathing
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

  // Thinking adds a gentle wobble rotation on top
  const rotateAnimate = mode === "thinking" ? [-8, 0, 8, 0] : 0;
  const rotateTransition =
    mode === "thinking"
      ? { duration: 2, repeat: Infinity, ease: "easeInOut" as const }
      : { duration: 0.4, ease: "easeOut" as const };

  const sizeClasses =
    position === "bottom"
      ? "h-[20vmin] w-[20vmin]"
      : "h-[40vmin] w-[40vmin]";

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
      {/* rgba(62,62,56,...) is the --body-gray token. Update both shadows if the token changes. */}
      <motion.svg
        viewBox="0 0 200 200"
        className={cn(
          sizeClasses,
          "drop-shadow-[0_8px_24px_rgba(62,62,56,0.08)]",
          "transition-[filter] duration-150",
          "group-hover:drop-shadow-[0_8px_24px_rgba(62,62,56,0.16)]"
        )}
        animate={{ scale: scaleAnimate, rotate: rotateAnimate }}
        transition={{ scale: scaleTransition, rotate: rotateTransition }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3D7A3D" />
            <stop offset="100%" stopColor="#5FA05F" />
          </linearGradient>
        </defs>
        <motion.path
          fill={`url(#${gradientId})`}
          animate={
            reducedMotion
              ? { d: PETAL_PATHS[0] }
              : { d: [...PETAL_PATHS, PETAL_PATHS[0]] }
          }
          transition={
            reducedMotion
              ? undefined
              : { duration: 6, repeat: Infinity, ease: "easeInOut" }
          }
        />
      </motion.svg>
    </button>
  );
}
