"use client";

import { Search } from "lucide-react";

import { t } from "@/lib/map/i18n";
import type { DirectoryLanguage, Resource, ResourceCategory } from "@/types/goodbois";
import { CategoryChips } from "./CategoryChips";
import { ResourceCard } from "./ResourceCard";

type DirectoryDrawerProps = {
  language: DirectoryLanguage;
  query: string;
  category: ResourceCategory | "all";
  resources: Resource[];
  selectedResource?: Resource;
  loading: boolean;
  source: "worker" | "fixture";
  onQueryChange: (query: string) => void;
  onCategoryChange: (category: ResourceCategory | "all") => void;
  onSelectResource: (resource: Resource) => void;
};

export function DirectoryDrawer({
  language,
  query,
  category,
  resources,
  selectedResource,
  loading,
  source,
  onQueryChange,
  onCategoryChange,
  onSelectResource,
}: DirectoryDrawerProps) {
  return (
    <aside className="z-[700] flex max-h-[52dvh] flex-col rounded-t-2xl bg-neutral-50 shadow-[0_-14px_40px_rgba(23,23,23,0.16)] lg:fixed lg:bottom-20 lg:left-6 lg:max-h-[58dvh] lg:w-[440px] lg:rounded-2xl">
      <div className="space-y-3 border-b border-neutral-200 p-4">
        <label className="relative block">
          <span className="sr-only">{t(language, "search")}</span>
          <Search className="pointer-events-none absolute left-4 top-1/2 size-6 -translate-y-1/2 text-neutral-500" />
          <input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder={t(language, "search")}
            className="min-h-14 w-full rounded-full border border-neutral-200 bg-white px-12 text-lg text-neutral-950 shadow-sm outline-none transition focus:border-teal-600 focus:ring-3 focus:ring-teal-200"
          />
        </label>
        <CategoryChips language={language} selectedCategory={category} onCategoryChange={onCategoryChange} />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-neutral-950">{t(language, "nearby")}</h2>
          <span className="rounded-full bg-neutral-200 px-3 py-1 text-sm font-medium text-neutral-700">
            {resources.length}
          </span>
        </div>
        {source === "fixture" ? (
          <p className="mb-3 rounded-lg bg-amber-100 px-3 py-2 text-sm font-medium text-amber-950">
            Demo data shown. Worker connection is not active.
          </p>
        ) : null}
        {loading ? (
          <p className="mb-3 rounded-lg bg-teal-50 px-3 py-2 text-sm font-medium text-teal-900">
            Loading places...
          </p>
        ) : null}
        <div className="space-y-3">
          {resources.map((resource) => (
            <ResourceCard
              key={resource.id}
              resource={resource}
              language={language}
              selected={selectedResource?.id === resource.id}
              onSelect={onSelectResource}
            />
          ))}
        </div>
      </div>
    </aside>
  );
}
