import type { Case } from "../types/contracts";
import type { NewCaseInput, Repos } from "../db/repos";

export type EscalateToMpRcArgs = NewCaseInput;

const PHONE_REGEX = /\b(?:1800-?\d{3}-?\d{4}|\d{3,4}-?\d{4}|9\d{2}|99[59])\b/g;

export async function escalateToMpRc(
  args: EscalateToMpRcArgs,
  repos: Pick<Repos, "cases" | "agencies">,
): Promise<Case> {
  await validateSuggestedSteps(args.suggestedNextSteps, repos);
  return repos.cases.create(args);
}

async function validateSuggestedSteps(
  steps: readonly string[],
  repos: Pick<Repos, "agencies">,
): Promise<void> {
  const allAgencies = await repos.agencies.list();
  const knownNumbers = new Set(
    allAgencies
      .map((a) => a.hotline)
      .filter((h): h is string => Boolean(h))
      .map((h) => normalizePhone(h)),
  );
  for (const step of steps) {
    const matches = step.match(PHONE_REGEX) ?? [];
    for (const m of matches) {
      if (!knownNumbers.has(normalizePhone(m))) {
        console.warn(
          `[escalateToMpRc] suggested step references unknown phone number: ${m}. Step: "${step}"`,
        );
      }
    }
  }
}

function normalizePhone(s: string): string {
  return s.replace(/[^0-9]/g, "");
}
