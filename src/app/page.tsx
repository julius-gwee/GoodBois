// src/app/page.tsx
"use client";

import HomeScreen from "@/components/kiosk/HomeScreen";

export default function Page() {
  return (
    <HomeScreen
      onActivate={(source) => {
        // Phase 1 stub. Phase 2 wires this to consent / listening flow.
        console.info(`[kawan] activated via ${source}`);
      }}
    />
  );
}
