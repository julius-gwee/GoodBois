"use client";

import { useEffect, useId, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

type VoiceAgentBlobProps = {
  ariaLabel: string;
  onActivate?: () => void;
  className?: string;
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
}: VoiceAgentBlobProps) {
  const reducedMotion = useReducedMotion();
  const [isPressing, setIsPressing] = useState(false);
  const gradientId = useId();
  const pressTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (pressTimeoutRef.current) clearTimeout(pressTimeoutRef.current);
    };
  }, []);

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

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={handleClick}
      className={cn(
        "group relative cursor-pointer rounded-full border-0 bg-transparent p-20",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-sage/40 focus-visible:ring-offset-8 focus-visible:ring-offset-soft-cream",
        className
      )}
    >
      {/* rgba(62,62,56,...) is the --body-gray token. Update both shadows if the token changes. */}
      <motion.svg
        viewBox="0 0 200 200"
        className={cn(
          "h-[40vmin] w-[40vmin]",
          "drop-shadow-[0_8px_24px_rgba(62,62,56,0.08)]",
          "transition-[filter] duration-150",
          "group-hover:drop-shadow-[0_8px_24px_rgba(62,62,56,0.16)]"
        )}
        animate={
          isPressing
            ? { scale: [1.0, 1.07, 1.0] }
            : { scale: breatheKeyframes }
        }
        transition={
          isPressing
            ? { duration: PRESS_DURATION_MS / 1000, ease: "easeOut" }
            : {
                duration: breatheDuration,
                repeat: Infinity,
                ease: "easeInOut",
              }
        }
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
