import type {
  DirectoryLanguage,
  LocalizedText,
  Resource,
  ResourceFilters,
  RouteMode,
  RouteOption,
  RoutePrintPayload,
} from "@/types/goodbois";

export function getLocalizedText(copy: LocalizedText | undefined, language: DirectoryLanguage): string {
  if (!copy) {
    return "";
  }

  return copy[language] ?? copy.en;
}

export function filterResources(resources: Resource[], filters: ResourceFilters): Resource[] {
  const query = filters.query?.trim().toLocaleLowerCase();

  return resources.filter((resource) => {
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

    if (
      filters.requireWheelchairFriendly &&
      !resource.accessibilityFeatures.some((feature) =>
        getLocalizedText(feature, "en").toLocaleLowerCase().includes("wheelchair"),
      )
    ) {
      return false;
    }

    if (!query) {
      return true;
    }

    const haystack = [
      resource.id,
      resource.category,
      getLocalizedText(resource.name, "en"),
      getLocalizedText(resource.description, "en"),
      getLocalizedText(resource.address, "en"),
      ...resource.languages,
      ...resource.accessibilityFeatures.map((feature) => getLocalizedText(feature, "en")),
      ...resource.practicalNotes.map((note) => getLocalizedText(note, "en")),
    ]
      .join(" ")
      .toLocaleLowerCase();

    return haystack.includes(query);
  });
}

export function getRouteForMode(routes: RouteOption[], mode: RouteMode): RouteOption {
  return (
    routes.find((route) => route.mode === mode) ??
    routes.find((route) => route.isRecommended) ??
    routes[0]
  );
}

export function buildRoutePrintPayload(
  resource: Resource,
  route: RouteOption,
  language: DirectoryLanguage,
): RoutePrintPayload {
  return {
    destinationName: getLocalizedText(resource.name, language),
    routeMode: route.mode,
    distanceMeters: route.distanceMeters,
    durationMinutes: route.durationMinutes,
    generatedAt: new Date().toISOString(),
    kioskLocation: getLocalizedText(route.origin.label, language),
    steps: route.steps.map((step) => getLocalizedText(step.instruction, language)),
    disclaimerEnglish: "This is a guide, not an official dispatch.",
  };
}
