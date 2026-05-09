import type { Resource, ResourceFilters } from "../types/contracts";
import { workerDemoResources } from "../fixtures/map-demo";

function copyValues(values: Array<Record<string, string> | undefined>): string {
  return values
    .flatMap((value) => (value ? Object.values(value) : []))
    .join(" ")
    .toLocaleLowerCase();
}

export function findNearby(filters: ResourceFilters = {}): Resource[] {
  const query = filters.query?.trim().toLocaleLowerCase();

  return workerDemoResources.filter((resource) => {
    if (filters.category && filters.category !== "all" && resource.category !== filters.category) {
      return false;
    }

    if (
      filters.language &&
      filters.language !== "all" &&
      !resource.languages.includes(filters.language)
    ) {
      return false;
    }

    if (!query) {
      return true;
    }

    const haystack = [
      resource.id,
      resource.category,
      copyValues([resource.name, resource.description, resource.address, resource.openingHours]),
      copyValues(resource.accessibilityFeatures),
      copyValues(resource.practicalNotes),
    ]
      .join(" ")
      .toLocaleLowerCase();

    return haystack.includes(query);
  });
}
