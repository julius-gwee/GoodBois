"use client";

import { categoryLabels } from "@/lib/map/i18n";
import type { DirectoryLanguage, ResourceCategory } from "@/types/goodbois";
import { Button } from "@/components/ui/button";

const categories: Array<ResourceCategory | "all"> = [
  "all",
  "senior_activity",
  "rc_centre",
  "clinic",
  "accessible_restroom",
  "digital_form_help",
  "pickup_dropoff",
];

type CategoryChipsProps = {
  language: DirectoryLanguage;
  selectedCategory: ResourceCategory | "all";
  onCategoryChange: (category: ResourceCategory | "all") => void;
};

export function CategoryChips({
  language,
  selectedCategory,
  onCategoryChange,
}: CategoryChipsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1" role="list" aria-label="Directory categories">
      {categories.map((category) => (
        <Button
          key={category}
          type="button"
          variant={selectedCategory === category ? "default" : "secondary"}
          className="min-h-11 shrink-0 rounded-full px-4 text-base shadow-sm"
          aria-pressed={selectedCategory === category}
          onClick={() => onCategoryChange(category)}
        >
          {categoryLabels[category][language] ?? categoryLabels[category].en}
        </Button>
      ))}
    </div>
  );
}
