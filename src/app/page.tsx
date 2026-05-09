// src/app/page.tsx (TEMPORARY for Task 8 verification — Task 10 replaces this)
"use client";

import LanguageFadeCycle from "@/components/atoms/LanguageFadeCycle";
import VoiceAgentBlob from "@/components/atoms/VoiceAgentBlob";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-soft-cream">
      <VoiceAgentBlob
        ariaLabel="Tap to speak to Kawan"
        onActivate={() => console.log("[kawan] blob activated")}
      />
      <LanguageFadeCycle />
    </main>
  );
}
