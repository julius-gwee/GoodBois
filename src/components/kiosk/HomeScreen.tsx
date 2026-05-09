"use client";

import VoiceAgentBlob from "@/components/atoms/VoiceAgentBlob";
import LanguageFadeCycle from "@/components/atoms/LanguageFadeCycle";
import AccessibilityButton from "@/components/atoms/AccessibilityButton";
import Wordmark from "./Wordmark";

type ActivationSource = "blob-tap" | "accessibility-touch";

type HomeScreenProps = {
  onActivate?: (source: ActivationSource) => void;
};

export default function HomeScreen({ onActivate }: HomeScreenProps) {
  return (
    <main className="relative flex min-h-screen flex-col bg-soft-cream">
      {/* Top bar */}
      <header className="flex items-center justify-between px-[8vw] py-[5vh]">
        <Wordmark />
        <AccessibilityButton />
      </header>

      {/* Centered blob + cycle */}
      <div className="flex flex-1 flex-col items-center justify-center gap-8 px-[8vw] pb-[6vh]">
        <VoiceAgentBlob
          ariaLabel="Tap to speak to Kawan"
          onActivate={() => onActivate?.("blob-tap")}
        />
        <LanguageFadeCycle />
      </div>
    </main>
  );
}
