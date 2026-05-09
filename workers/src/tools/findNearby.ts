import type { AgencyCategory, AgencyContact } from "../types/contracts";
import type { Repos } from "../db/repos";

export type FindNearbyArgs = { category: AgencyCategory };

const MAX = 3;

export async function findNearby(
  args: FindNearbyArgs,
  repos: Pick<Repos, "agencies">,
): Promise<AgencyContact[]> {
  const rows = await repos.agencies.list({ category: args.category, activeOnly: true });
  return rows.slice(0, MAX);
}
