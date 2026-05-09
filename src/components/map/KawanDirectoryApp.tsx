"use client";

import { MessageCircle } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";

import { getLocalizedText, getRouteForMode, filterResources } from "@/lib/map/directory";
import { loadResources, loadRoutes, type DataSource } from "@/lib/map/api";
import { demoResources, demoRoutes } from "@/lib/map/fixtures";
import { t } from "@/lib/map/i18n";
import type { DirectoryLanguage, Resource, ResourceCategory, RouteMode } from "@/types/goodbois";
import { Button } from "@/components/ui/button";
import { DirectoryDrawer } from "./DirectoryDrawer";
import { DirectionsPanel } from "./DirectionsPanel";
import { LanguageBar } from "./LanguageBar";
import { ResourceDetailsPanel } from "./ResourceDetailsPanel";

const MapCanvas = dynamic(() => import("./MapCanvas").then((module) => module.MapCanvas), {
  ssr: false,
  loading: () => <div className="min-h-[48dvh] flex-1 bg-[#dce9e3] lg:min-h-dvh" />,
});

type KawanDirectoryAppProps = {
  initialLanguage?: DirectoryLanguage;
  initialFromChat?: boolean;
};

export function KawanDirectoryApp({
  initialLanguage = "en",
  initialFromChat = false,
}: KawanDirectoryAppProps) {
  const [language, setLanguage] = useState<DirectoryLanguage>(initialLanguage);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<ResourceCategory | "all">("all");
  const [resources, setResources] = useState<Resource[]>(demoResources);
  const [routesByResource, setRoutesByResource] = useState(demoRoutes);
  const [dataSource, setDataSource] = useState<DataSource>("fixture");
  const [loading, setLoading] = useState(false);
  const [selectedResource, setSelectedResource] = useState<Resource>(demoResources[0]);
  const [showDetails, setShowDetails] = useState(false);
  const [showDirections, setShowDirections] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [routeMode, setRouteMode] = useState<RouteMode>("wheelchair");
  const [fromChat] = useState(initialFromChat);
  const [mode, setMode] = useState<"map" | "chat">(initialFromChat ? "map" : "map");

  useEffect(() => {
    let cancelled = false;

    async function syncResources() {
      setLoading(true);
      const result = await loadResources({ query, category, language: "all" });
      if (!cancelled) {
        setResources(result.resources);
        setDataSource(result.source);
        setLoading(false);
      }
    }

    void syncResources();

    return () => {
      cancelled = true;
    };
  }, [category, query]);

  const filteredResources = useMemo(
    () => filterResources(resources, { query, category, language: "all" }),
    [resources, query, category],
  );
  const activeResource = filteredResources.some((resource) => resource.id === selectedResource.id)
    ? selectedResource
    : (filteredResources[0] ?? selectedResource);

  const selectedRoutes = routesByResource[activeResource.id] ?? demoRoutes[activeResource.id] ?? demoRoutes["senior-corner"];
  const selectedRoute = getRouteForMode(selectedRoutes, routeMode);

  useEffect(() => {
    let cancelled = false;

    async function syncRoutes() {
      const result = await loadRoutes(activeResource.id);
      if (!cancelled && result.routes.length > 0) {
        setRoutesByResource((current) => ({
          ...current,
          [activeResource.id]: result.routes,
        }));
      }
    }

    void syncRoutes();

    return () => {
      cancelled = true;
    };
  }, [activeResource.id]);

  function selectResource(resource: Resource) {
    setSelectedResource(resource);
    setShowDetails(true);
    setShowDirections(false);
    setShowPrintPreview(false);
  }

  function backToChat() {
    setMode("chat");
    setShowDetails(false);
    setShowDirections(false);
    setShowPrintPreview(false);
  }

  function speak(text: string) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
  }

  if (mode === "chat") {
    return (
      <main className="flex min-h-dvh flex-col bg-neutral-950 text-white">
        <section className="flex flex-1 flex-col items-center justify-center gap-6 p-8 text-center">
          <div className="flex size-20 items-center justify-center rounded-3xl bg-teal-600 text-4xl font-semibold">
            K
          </div>
          <div className="max-w-xl space-y-3">
            <p className="text-lg font-medium text-teal-200">Kawan</p>
            <h1 className="text-4xl font-semibold">{t(language, "chatPlaceholder")}</h1>
            <p className="text-xl leading-8 text-neutral-200">{t(language, "chatPlaceholderBody")}</p>
          </div>
          <Button
            type="button"
            className="min-h-14 rounded-full bg-amber-500 px-6 text-lg text-neutral-950 hover:bg-amber-400"
            onClick={() => setMode("map")}
          >
            {t(language, "findPlaces")}
          </Button>
        </section>
        <LanguageBar language={language} onLanguageChange={setLanguage} />
      </main>
    );
  }

  return (
    <main className="relative flex h-dvh min-h-dvh flex-col overflow-hidden bg-neutral-100 text-neutral-950 lg:block">
      <header className="fixed left-3 right-3 top-3 z-[700] rounded-2xl bg-white/95 p-3 shadow-lg backdrop-blur lg:left-6 lg:right-auto lg:w-[560px]">
        <div className="flex items-center gap-3">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-teal-700 text-2xl font-semibold text-white">
            K
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium uppercase tracking-wide text-teal-700">Kawan</p>
            <h1 className="truncate text-2xl font-semibold text-neutral-950">
              {getLocalizedText(activeResource.name, language)}
            </h1>
          </div>
          <Button type="button" className="min-h-12 rounded-full bg-amber-500 px-4 text-neutral-950 hover:bg-amber-400">
            <MessageCircle className="size-5" aria-hidden="true" />
            <span className="hidden sm:inline">{t(language, "talk")}</span>
          </Button>
        </div>
      </header>

      <MapCanvas
        resources={filteredResources}
        selectedResource={activeResource}
        selectedRoute={showDirections ? selectedRoute : undefined}
        language={language}
        fromChat={fromChat}
        onSelectResource={selectResource}
        onBackToChat={backToChat}
      />

      {!showDetails && !showDirections ? (
        <DirectoryDrawer
          language={language}
          query={query}
          category={category}
          resources={filteredResources}
          selectedResource={activeResource}
          loading={loading}
          source={dataSource}
          onQueryChange={setQuery}
          onCategoryChange={setCategory}
          onSelectResource={selectResource}
        />
      ) : null}

      {showDetails && !showDirections ? (
        <ResourceDetailsPanel
          resource={activeResource}
          language={language}
          fromChat={fromChat}
          onClose={() => setShowDetails(false)}
          onDirections={() => {
            setShowDirections(true);
            setShowPrintPreview(false);
          }}
          onPrintDetails={() => {
            setShowDirections(true);
            setShowPrintPreview(true);
          }}
          onReadAloud={() =>
            speak(
              [
                getLocalizedText(activeResource.name, language),
                getLocalizedText(activeResource.description, language),
                ...activeResource.practicalNotes.map((note) => getLocalizedText(note, language)),
              ].join(". "),
            )
          }
          onBackToChat={backToChat}
        />
      ) : null}

      {showDirections ? (
        <DirectionsPanel
          resource={activeResource}
          routes={selectedRoutes}
          routeMode={routeMode}
          language={language}
          fromChat={fromChat}
          showPrintPreview={showPrintPreview}
          onRouteModeChange={setRouteMode}
          onClose={() => {
            setShowDirections(false);
            setShowPrintPreview(false);
          }}
          onPrint={() => setShowPrintPreview(true)}
          onClosePrint={() => setShowPrintPreview(false)}
          onReadAloud={() =>
            speak(selectedRoute.steps.map((step) => getLocalizedText(step.instruction, language)).join(". "))
          }
          onBackToChat={backToChat}
        />
      ) : null}

      <div className="z-[700] lg:fixed lg:bottom-0 lg:left-0 lg:right-0">
        <LanguageBar language={language} onLanguageChange={setLanguage} />
      </div>
    </main>
  );
}
