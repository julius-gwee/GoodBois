import type { AgencyContact } from "../types/contracts";
import type { Repos } from "../db/repos";

export type SignpostArgs = { agencyKey: string };

export class AgencyNotAllowedError extends Error {
  readonly code = "AGENCY_NOT_ALLOWED";
  constructor(agencyKey: string) {
    super(`Agency "${agencyKey}" is not in the allowlisted directory or is inactive.`);
    this.name = "AgencyNotAllowedError";
  }
}

export async function signpost(
  args: SignpostArgs,
  repos: Pick<Repos, "agencies">,
): Promise<AgencyContact> {
  const a = await repos.agencies.getByKey(args.agencyKey);
  if (!a || !a.active) throw new AgencyNotAllowedError(args.agencyKey);
  return a;
}
