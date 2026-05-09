// Demo stub per docs/refactor/2026-05-09-llm-turn-decision.md §7.
// Generates a reference id and logs the report. No D1 row, no external dispatch.

export type ReportHazardArgs = {
  category: string;
  location: string;
  description: string;
};

export type ReportHazardResult = {
  referenceId: string;
  routedTo: string;
};

const ROUTING: Record<string, string> = {
  lighting: "town-council",
  rubbish: "town-council",
  pest: "town-council",
  lift: "hdb",
  ceiling: "hdb",
  pothole: "lta",
  road: "lta",
  workplace: "mom",
};

let dailyCounter = 0;
let counterDate = "";

export async function reportHazard(args: ReportHazardArgs): Promise<ReportHazardResult> {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  if (counterDate !== today) {
    counterDate = today;
    dailyCounter = 0;
  }
  dailyCounter += 1;
  const referenceId = `HZ-${today}-${String(dailyCounter).padStart(3, "0")}`;
  const routedTo = ROUTING[args.category.toLowerCase()] ?? "town-council";
  console.log(`[reportHazard:stub] ${referenceId} routedTo=${routedTo}`, args);
  return { referenceId, routedTo };
}
