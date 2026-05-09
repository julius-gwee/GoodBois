"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  HOME_GREETINGS,
  type HomeGreeting,
} from "@/lib/i18n/home-greetings";

type LanguageFadeCycleProps = {
  paused?: boolean;
};

const HOLD_MS_NORMAL = 3000;
const HOLD_MS_REDUCED = 8000;
const CROSSFADE_MS = 600;

export default function LanguageFadeCycle({
  paused = false,
}: LanguageFadeCycleProps) {
  const reducedMotion = useReducedMotion();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (paused) return;

    const holdMs = reducedMotion ? HOLD_MS_REDUCED : HOLD_MS_NORMAL;
    const interval = setInterval(() => {
      setIndex((i) => (i + 1) % HOME_GREETINGS.length);
    }, holdMs + CROSSFADE_MS);

    return () => clearInterval(interval);
  }, [paused, reducedMotion]);

  const current: HomeGreeting = HOME_GREETINGS[index];
  const yShift = reducedMotion ? 0 : 4;

  return (
    <div
      className="flex flex-col items-center gap-2 text-center"
      aria-live="polite"
      aria-atomic="true"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={current.lang}
          initial={{ opacity: 0, y: yShift }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -yShift }}
          transition={{ duration: CROSSFADE_MS / 1000, ease: "easeInOut" }}
          lang={current.lang}
          className="flex flex-col items-center gap-2"
        >
          <p className="text-3xl font-semibold text-body-gray">
            {current.greeting}
          </p>
          <p className="text-xl text-muted-stone">{current.cue}</p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
