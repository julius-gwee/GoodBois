"use client";

import { categoryLabels } from "@/lib/map/i18n";
import type { DirectoryLanguage, ResourceCategory } from "@/types/goodbois";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
          variant="outline"
          className={cn(
            "min-h-11 shrink-0 rounded-full border px-4 text-base shadow-sm",
            selectedCategory === category
              ? "border-forest-sage bg-forest-sage text-soft-cream hover:bg-leaf-green hover:text-soft-cream"
              : "border-stone-wash bg-deep-linen text-deep-charcoal hover:bg-stone-wash",
          )}
          aria-pressed={selectedCategory === category}
          onClick={() => onCategoryChange(category)}
        >
          {categoryLabels[category][language] ?? categoryLabels[category].en}
        </Button>
      ))}
    </div>
  );
}
