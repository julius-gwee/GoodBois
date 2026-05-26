"use client";

import VoiceAgentBlob from "@/components/atoms/VoiceAgentBlob";
import AccessibilityButton from "@/components/atoms/AccessibilityButton";
import LanguageFadeCycle from "@/components/atoms/LanguageFadeCycle";
import ListeningState from "./ListeningState";
import ThinkingState from "./ThinkingState";
import ChatState from "./ChatState";
import ReceiptState from "./ReceiptState";
import Wordmark from "./Wordmark";
import { LanguageProvider, useUIStrings } from "@/lib/i18n/LanguageContext";
import { cn } from "@/lib/utils";
import { useKioskMachine } from "./useKioskMachine";

export default function KioskShell() {
  const {
    state,
    messages,
    transcript,
    receiptUrl,
    pulseToken,
    sessionLang,
    resetToIdle,
    handleBlobActivate,
    handleStop,
    handleCancel,
    handleViewReceipt,
  } = useKioskMachine();

  const blobMode: "idle" | "listening" | "thinking" =
    state === "listening"
      ? "listening"
      : state === "thinking"
        ? "thinking"
        : "idle";

  const showBlob = state !== "receipt";
  const isChatLayout = state === "chat";

  if (state === "receipt" && receiptUrl) {
    return <ReceiptState receiptUrl={receiptUrl} onBack={resetToIdle} />;
  }

  return (
    <LanguageProvider sessionLang={sessionLang}>
    <main className="relative flex min-h-screen flex-col bg-soft-cream">
      <header className="flex items-center justify-between px-[8vw] py-[5vh]">
        <Wordmark />
        <AccessibilityButton />
      </header>

      <div
        className={cn(
          "flex flex-1 flex-col items-center px-[8vw]",
          isChatLayout
            ? "justify-between gap-6 pb-6 pt-2"
            : "justify-center gap-8 pb-[6vh]",
        )}
      >
        {isChatLayout && (
          <ChatState
            messages={messages}
            onViewReceipt={receiptUrl ? handleViewReceipt : undefined}
            onReset={resetToIdle}
          />
        )}

        {showBlob && (
          <LocalizedBlob
            onActivate={handleBlobActivate}
            mode={blobMode}
            position={isChatLayout ? "bottom" : "center"}
            pulseToken={pulseToken}
          />
        )}

        {state === "idle" && <LanguageFadeCycle />}
        {state === "listening" && (
          <ListeningState transcript={transcript} onStop={handleStop} />
        )}
        {state === "thinking" && (
          <ThinkingState transcript={transcript} onCancel={handleCancel} />
        )}
      </div>
    </main>
    </LanguageProvider>
  );
}

// Wrapper so VoiceAgentBlob's aria-label localises with the active session
// language. VoiceAgentBlob itself takes a plain string prop — keeping that
// shape avoids spreading i18n knowledge into a presentational atom.
type LocalizedBlobProps = Omit<
  React.ComponentProps<typeof VoiceAgentBlob>,
  "ariaLabel"
>;

function LocalizedBlob(props: LocalizedBlobProps) {
  const t = useUIStrings();
  return <VoiceAgentBlob ariaLabel={t.tapToSpeak} {...props} />;
}
