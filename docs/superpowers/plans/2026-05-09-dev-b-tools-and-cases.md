# Dev B — Tools & Cases — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement Dev B's tools-and-cases lane for GoodBois — 4 allowlisted Worker tools, processing agent, in-memory repos with D1-ready interface seam, agency seed data, bilingual HTML receipt, and CSV export — on branch `jacksonB/tools-and-cases`.

**Architecture:** Cloudflare Worker built with Hono. Tools sit behind a registry-enforced allowlist. A processing agent dispatches the right tool based on a triage outcome. Repository interfaces (in-memory now, D1 later) keep all data access behind a swappable seam. Receipts render as bilingual HTML at `GET /receipts/:id`; case CSV export at `GET /export/cases.csv` is gated by a static env token.

**Tech Stack:** TypeScript, Hono 4.x (Worker framework), Vitest (unit tests), `@cloudflare/workers-types`. No D1 / R2 / pdf-lib / SEALion / Workers AI in this branch.

**Spec:** `docs/superpowers/specs/2026-05-09-dev-b-tools-cases-design.md`
**Handoff doc for Dev A:** `docs/agents/handoff-dev-b-to-dev-a.md`

---

## File map

Files created or modified across all tasks:

```
package.json                                   # +hono, +vitest, +@cloudflare/workers-types, +scripts
workers/tsconfig.json                          # NEW — standalone TS config
workers/vitest.config.ts                       # NEW — vitest config
workers/.gitignore                             # NEW — ignore wrangler.toml + dist
workers/src/index.ts                           # MODIFY — migrate to Hono
workers/src/types/contracts.ts                 # MODIFY — add TriageResult, ToolInvocation
src/types/goodbois.ts                          # MODIFY — mirror the type additions
workers/src/db/ids.ts                          # NEW
workers/src/db/ids.test.ts                     # NEW
workers/src/db/repos.ts                        # NEW — interfaces
workers/src/db/memory.ts                       # NEW — in-memory impls
workers/src/db/memory.test.ts                  # NEW
workers/src/db/seeds/agencies.ts               # NEW — 15–25 AgencyContact rows
workers/src/db/seeds/agencies.test.ts          # NEW
workers/src/tools/registry.ts                  # NEW — allowlist + dispatcher
workers/src/tools/registry.test.ts             # NEW
workers/src/tools/signpost.ts                  # NEW
workers/src/tools/signpost.test.ts             # NEW
workers/src/tools/findNearby.ts                # NEW
workers/src/tools/findNearby.test.ts           # NEW
workers/src/tools/generateReceipt.ts           # NEW
workers/src/tools/generateReceipt.test.ts      # NEW
workers/src/tools/escalateToMpRc.ts            # NEW
workers/src/tools/escalateToMpRc.test.ts       # NEW
workers/src/agents/processing/index.ts         # NEW — runProcessing
workers/src/agents/processing/index.test.ts    # NEW
workers/src/receipt/render.ts                  # NEW — HTML template
workers/src/receipt/render.test.ts             # NEW
workers/src/export/casesCsv.ts                 # NEW — CSV serialiser
workers/src/export/casesCsv.test.ts            # NEW
workers/src/env.ts                             # NEW — Hono Env type
workers/wrangler.toml.example                  # MODIFY — add EXPORT_TOKEN var
.env.example                                   # MODIFY — document EXPORT_TOKEN for local dev
```

Existing files **not** modified: `workers/src/fixtures/golden-demo.ts` (Dev D-owned), `workers/src/orchestrator/**`, `workers/src/agents/inquiry/**`, `workers/src/agents/triage/**`, `src/components/**`, `src/app/**`.

---

## Task 1: Install deps, set up TS + vitest config for workers/

**Files:**
- Modify: `package.json`
- Create: `workers/tsconfig.json`
- Create: `workers/vitest.config.ts`
- Create: `workers/.gitignore`

- [ ] **Step 1: Install runtime + dev dependencies**

Run from repo root:

```bash
npm install hono@^4.6.0
npm install -D vitest@^2.1.0 @cloudflare/workers-types@^4.20260101.0
```

Expected: `package.json` updates, `package-lock.json` updates, `node_modules/` populated. No errors.

- [ ] **Step 2: Add npm scripts to `package.json`**

In the `"scripts"` section, replace:

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint"
}
```

with:

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint",
  "test": "vitest run --config workers/vitest.config.ts",
  "test:watch": "vitest --config workers/vitest.config.ts",
  "dev:worker": "cd workers && wrangler dev"
}
```

- [ ] **Step 3: Create `workers/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "types": ["@cloudflare/workers-types"],
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "isolatedModules": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 4: Create `workers/vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
  resolve: {
    alias: {},
  },
  root: __dirname,
});
```

- [ ] **Step 5: Create `workers/.gitignore`**

```
wrangler.toml
.dev.vars
.wrangler/
dist/
```

- [ ] **Step 6: Verify vitest can run (with no tests yet)**

Run:

```bash
npm test
```

Expected: vitest reports `No test files found` (or similar) and exits 0. The point is that the runner is wired correctly.

If you see `--config` errors, double-check the path in `package.json`.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json workers/tsconfig.json workers/vitest.config.ts workers/.gitignore
git commit -m "chore: add hono, vitest, @cloudflare/workers-types for workers/"
```

---

## Task 2: Migrate `workers/src/index.ts` to Hono, preserve `/health` and `/turn` stub

**Files:**
- Create: `workers/src/env.ts`
- Modify: `workers/src/index.ts`

- [ ] **Step 1: Create `workers/src/env.ts`** (the Hono Env type for shared bindings)

```ts
export type Env = {
  Bindings: {
    EXPORT_TOKEN: string;
    WORKER_URL?: string;
  };
};
```

- [ ] **Step 2: Rewrite `workers/src/index.ts` with Hono**

Replace the entire file with:

```ts
import { Hono } from "hono";
import type { Env } from "./env";
import type { TurnRequest, TurnResponse } from "./types/contracts";

const app = new Hono<Env>();

app.get("/health", (c) => c.json({ ok: true, service: "goodbois-worker" }));

app.post("/turn", async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as Partial<TurnRequest>;
  const response: TurnResponse = {
    sessionId: body.sessionId ?? "demo-session-unwired",
    state: "error",
    kioskMessage: {
      original: "The GoodBois Worker scaffold is ready, but /turn is not implemented yet.",
      english: "The GoodBois Worker scaffold is ready, but /turn is not implemented yet.",
      language: body.language ?? "en",
    },
    nextActions: ["type", "reset"],
    error: {
      code: "TURN_NOT_IMPLEMENTED",
      message:
        "Wire this endpoint to golden demo fixtures first, then replace with the real orchestrator.",
      fallbackAvailable: true,
    },
  };
  return c.json(response, 501);
});

export default app;
```

- [ ] **Step 3: Verify no TypeScript errors in workers/**

Run:

```bash
npx tsc -p workers/tsconfig.json --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add workers/src/env.ts workers/src/index.ts
git commit -m "feat: migrate worker to hono router, preserve /health and /turn stub"
```

---

## Task 3: Add `TriageResult` and `ToolInvocation` to both type files

**Files:**
- Modify: `workers/src/types/contracts.ts`
- Modify: `src/types/goodbois.ts`

These types are needed by the processing agent contract and by `runProcessing`'s input/output. They live in `docs/standards/data-contracts.md` but haven't been ported into TypeScript yet. Both type files must stay in sync (per the handoff doc).

- [ ] **Step 1: Append to `workers/src/types/contracts.ts`**

Add the following at the end of the file (after the existing `TurnResponse` definition):

```ts
export type TriageResult = {
  id: string;
  sessionId: string;
  outcome: TriageOutcome;
  confidence: "high" | "medium" | "low";
  selectedToolName?: string;
  selectedAgencyKey?: string;
  followupQuestion?: string;
  reasoningSummary: string;
  createdAt: string;
};

export type ToolInvocation = {
  id: string;
  sessionId: string;
  toolName: string;
  argumentsJson: string;
  resultJson: string;
  startedAt: string;
  completedAt: string;
  success: boolean;
  errorMessage?: string;
};
```

- [ ] **Step 2: Mirror the same additions in `src/types/goodbois.ts`**

Append the identical block (copy-paste exactly the same code) to the end of `src/types/goodbois.ts`.

- [ ] **Step 3: Verify both files compile**

Run:

```bash
npx tsc -p workers/tsconfig.json --noEmit
npx tsc -p tsconfig.json --noEmit
```

Expected: no errors from either.

- [ ] **Step 4: Commit**

```bash
git add workers/src/types/contracts.ts src/types/goodbois.ts
git commit -m "feat: add TriageResult + ToolInvocation types to worker and frontend contracts"
```

---

## Task 4: ID generator with daily counter (TDD)

**Files:**
- Create: `workers/src/db/ids.ts`
- Test: `workers/src/db/ids.test.ts`

Generates `GBC-YYYYMMDD-NNN` and `GBR-YYYYMMDD-NNN` ids. Counter resets per Singapore-day per prefix.

- [ ] **Step 1: Write the failing test**

`workers/src/db/ids.test.ts`:

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { generateId, _resetCounters } from "./ids";

describe("generateId", () => {
  beforeEach(() => _resetCounters());

  it("formats GBC ids with SG date and 3-digit zero-padded counter", () => {
    const noonSgt = new Date("2026-05-09T04:00:00Z"); // = SGT 2026-05-09 12:00
    expect(generateId("GBC", noonSgt)).toBe("GBC-20260509-001");
    expect(generateId("GBC", noonSgt)).toBe("GBC-20260509-002");
  });

  it("uses Singapore Time for the day boundary", () => {
    // 16:30 UTC = 00:30 SGT next day
    const justAfterSgMidnight = new Date("2026-05-08T16:30:00Z");
    expect(generateId("GBR", justAfterSgMidnight)).toMatch(/^GBR-20260509-\d{3}$/);
  });

  it("counter resets per day per prefix", () => {
    const day1 = new Date("2026-05-09T04:00:00Z");
    const day2 = new Date("2026-05-10T04:00:00Z");
    expect(generateId("GBC", day1)).toBe("GBC-20260509-001");
    expect(generateId("GBC", day2)).toBe("GBC-20260510-001");
    expect(generateId("GBR", day1)).toBe("GBR-20260509-001");
    expect(generateId("GBC", day1)).toBe("GBC-20260509-002");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npm test
```

Expected: FAIL — module `./ids` does not exist.

- [ ] **Step 3: Implement `workers/src/db/ids.ts`**

```ts
type Prefix = "GBC" | "GBR";

const counters = new Map<string, number>();

export function generateId(prefix: Prefix, now: Date = new Date()): string {
  const ymd = sgYmd(now);
  const key = `${prefix}-${ymd}`;
  const next = (counters.get(key) ?? 0) + 1;
  counters.set(key, next);
  return `${prefix}-${ymd}-${String(next).padStart(3, "0")}`;
}

function sgYmd(d: Date): string {
  const sg = new Date(d.getTime() + 8 * 60 * 60 * 1000);
  const y = sg.getUTCFullYear();
  const m = String(sg.getUTCMonth() + 1).padStart(2, "0");
  const day = String(sg.getUTCDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

export function _resetCounters(): void {
  counters.clear();
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npm test
```

Expected: PASS — 3 tests in `ids.test.ts`.

- [ ] **Step 5: Commit**

```bash
git add workers/src/db/ids.ts workers/src/db/ids.test.ts
git commit -m "feat: id generator with per-day SGT counter for cases and receipts"
```

---

## Task 5: Repository interfaces

**Files:**
- Create: `workers/src/db/repos.ts`

Defines the seam between tools and storage. No implementation yet — just types.

- [ ] **Step 1: Write `workers/src/db/repos.ts`**

```ts
import type {
  AgencyCategory,
  AgencyContact,
  Case,
  Receipt,
  ToolInvocation,
} from "../types/contracts";

export type AgencyListFilter = {
  category?: AgencyCategory;
  activeOnly?: boolean;
};

export type NewCaseInput = Omit<Case, "id" | "createdAt" | "status" | "exportedAt"> & {
  exportChannel?: Case["exportChannel"];
};

export type NewReceiptInput = Omit<Receipt, "id" | "generatedAt" | "pdfUrl">;

export interface AgencyRepo {
  list(filter?: AgencyListFilter): Promise<AgencyContact[]>;
  getByKey(key: string): Promise<AgencyContact | null>;
  exists(key: string): Promise<boolean>;
}

export interface CaseRepo {
  create(input: NewCaseInput): Promise<Case>;
  getById(id: string): Promise<Case | null>;
  listForExport(): Promise<Case[]>;
  markExported(id: string, at: string): Promise<void>;
}

export interface ReceiptRepo {
  create(input: NewReceiptInput, pdfUrl: string): Promise<Receipt>;
  getById(id: string): Promise<Receipt | null>;
}

export interface ToolInvocationRepo {
  record(invocation: ToolInvocation): Promise<void>;
}

export type Repos = {
  agencies: AgencyRepo;
  cases: CaseRepo;
  receipts: ReceiptRepo;
  toolInvocations: ToolInvocationRepo;
};
```

- [ ] **Step 2: Verify compilation**

```bash
npx tsc -p workers/tsconfig.json --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add workers/src/db/repos.ts
git commit -m "feat: repository interfaces for agencies, cases, receipts, tool invocations"
```

---

## Task 6: In-memory repository implementations (TDD)

**Files:**
- Create: `workers/src/db/memory.ts`
- Test: `workers/src/db/memory.test.ts`

`createMemoryRepos(seedAgencies)` returns a `Repos` bundle backed by `Map`s.

- [ ] **Step 1: Write the failing test**

`workers/src/db/memory.test.ts`:

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { createMemoryRepos } from "./memory";
import { _resetCounters } from "./ids";
import type { AgencyContact } from "../types/contracts";

const sampleAgencies: AgencyContact[] = [
  {
    key: "alpha",
    name: "Alpha",
    category: "housing",
    multilingualBlurb: { en: "A", "zh-Hans": "甲" },
    active: true,
    source: "seed",
    updatedAt: "2026-05-09T00:00:00+08:00",
  },
  {
    key: "beta",
    name: "Beta",
    category: "transport",
    multilingualBlurb: { en: "B", "zh-Hans": "乙" },
    active: false,
    source: "seed",
    updatedAt: "2026-05-09T00:00:00+08:00",
  },
];

describe("createMemoryRepos.agencies", () => {
  it("getByKey returns the agency or null", async () => {
    const repos = createMemoryRepos(sampleAgencies);
    expect((await repos.agencies.getByKey("alpha"))?.name).toBe("Alpha");
    expect(await repos.agencies.getByKey("nope")).toBeNull();
  });

  it("exists is true only for known keys", async () => {
    const repos = createMemoryRepos(sampleAgencies);
    expect(await repos.agencies.exists("alpha")).toBe(true);
    expect(await repos.agencies.exists("nope")).toBe(false);
  });

  it("list filters by category and activeOnly", async () => {
    const repos = createMemoryRepos(sampleAgencies);
    const housing = await repos.agencies.list({ category: "housing" });
    expect(housing.map((a) => a.key)).toEqual(["alpha"]);
    const active = await repos.agencies.list({ activeOnly: true });
    expect(active.map((a) => a.key)).toEqual(["alpha"]);
  });
});

describe("createMemoryRepos.cases", () => {
  beforeEach(() => _resetCounters());

  it("create assigns id, createdAt, status='queued'", async () => {
    const repos = createMemoryRepos(sampleAgencies);
    const created = await repos.cases.create({
      sessionId: "s1",
      language: "zh-Hans",
      summaryEnglish: "x",
      transcript: "y",
      suggestedNextSteps: [],
      kioskId: "demo-laptop",
    });
    expect(created.id).toMatch(/^GBC-\d{8}-\d{3}$/);
    expect(created.status).toBe("queued");
    expect(created.createdAt).toBeTruthy();
  });

  it("listForExport returns queued and exported cases", async () => {
    const repos = createMemoryRepos(sampleAgencies);
    const a = await repos.cases.create({
      sessionId: "s1",
      language: "en",
      summaryEnglish: "1",
      transcript: "1",
      suggestedNextSteps: [],
      kioskId: "demo-laptop",
    });
    const b = await repos.cases.create({
      sessionId: "s2",
      language: "en",
      summaryEnglish: "2",
      transcript: "2",
      suggestedNextSteps: [],
      kioskId: "demo-laptop",
    });
    await repos.cases.markExported(b.id, "2026-05-09T10:00:00+08:00");
    const list = await repos.cases.listForExport();
    expect(list.map((c) => c.id).sort()).toEqual([a.id, b.id].sort());
    expect(list.find((c) => c.id === b.id)?.status).toBe("exported");
  });
});

describe("createMemoryRepos.receipts", () => {
  beforeEach(() => _resetCounters());

  it("create assigns id, generatedAt, stores pdfUrl", async () => {
    const repos = createMemoryRepos(sampleAgencies);
    const r = await repos.receipts.create(
      { sessionId: "s1", caseId: "GBC-20260509-001", language: "zh-Hans" },
      "https://example.test/receipts/GBR-20260509-001",
    );
    expect(r.id).toMatch(/^GBR-\d{8}-\d{3}$/);
    expect(r.pdfUrl).toBe("https://example.test/receipts/GBR-20260509-001");
    expect(r.generatedAt).toBeTruthy();
    expect((await repos.receipts.getById(r.id))?.id).toBe(r.id);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npm test
```

Expected: FAIL — module `./memory` does not exist.

- [ ] **Step 3: Implement `workers/src/db/memory.ts`**

```ts
import type { AgencyContact, Case, Receipt, ToolInvocation } from "../types/contracts";
import { generateId } from "./ids";
import type {
  AgencyRepo,
  CaseRepo,
  NewCaseInput,
  NewReceiptInput,
  ReceiptRepo,
  Repos,
  ToolInvocationRepo,
} from "./repos";

export function createMemoryRepos(seedAgencies: AgencyContact[]): Repos {
  const agencies = new Map<string, AgencyContact>();
  for (const a of seedAgencies) agencies.set(a.key, a);

  const cases = new Map<string, Case>();
  const receipts = new Map<string, Receipt>();
  const toolInvocations: ToolInvocation[] = [];

  const agencyRepo: AgencyRepo = {
    async list(filter) {
      let rows = Array.from(agencies.values());
      if (filter?.category) rows = rows.filter((a) => a.category === filter.category);
      if (filter?.activeOnly) rows = rows.filter((a) => a.active);
      return rows;
    },
    async getByKey(key) {
      return agencies.get(key) ?? null;
    },
    async exists(key) {
      return agencies.has(key);
    },
  };

  const caseRepo: CaseRepo = {
    async create(input: NewCaseInput) {
      const id = generateId("GBC");
      const now = new Date().toISOString();
      const row: Case = { ...input, id, createdAt: now, status: "queued" };
      cases.set(id, row);
      return row;
    },
    async getById(id) {
      return cases.get(id) ?? null;
    },
    async listForExport() {
      return Array.from(cases.values()).filter(
        (c) => c.status === "queued" || c.status === "exported",
      );
    },
    async markExported(id, at) {
      const row = cases.get(id);
      if (!row) return;
      row.status = "exported";
      row.exportedAt = at;
      cases.set(id, row);
    },
  };

  const receiptRepo: ReceiptRepo = {
    async create(input: NewReceiptInput, pdfUrl: string) {
      const id = generateId("GBR");
      const row: Receipt = {
        ...input,
        id,
        pdfUrl,
        generatedAt: new Date().toISOString(),
      };
      receipts.set(id, row);
      return row;
    },
    async getById(id) {
      return receipts.get(id) ?? null;
    },
  };

  const toolInvocationRepo: ToolInvocationRepo = {
    async record(invocation) {
      toolInvocations.push(invocation);
    },
  };

  return {
    agencies: agencyRepo,
    cases: caseRepo,
    receipts: receiptRepo,
    toolInvocations: toolInvocationRepo,
  };
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npm test
```

Expected: PASS — all `memory.test.ts` tests green.

- [ ] **Step 5: Commit**

```bash
git add workers/src/db/memory.ts workers/src/db/memory.test.ts
git commit -m "feat: in-memory repos for agencies, cases, receipts, tool invocations"
```

---

## Task 7: Agency seed data (15–25 entries)

**Files:**
- Create: `workers/src/db/seeds/agencies.ts`
- Test: `workers/src/db/seeds/agencies.test.ts`

Curated `AgencyContact` directory. Hotlines listed are publicly-published Singapore agency numbers; the team should re-verify before any non-demo deployment.

- [ ] **Step 1: Write the shape test**

`workers/src/db/seeds/agencies.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { agencies } from "./agencies";
import type { AgencyCategory } from "../../types/contracts";

const REQUIRED_CATEGORIES: AgencyCategory[] = [
  "housing",
  "transport",
  "healthcare",
  "social_services",
  "legal",
  "financial_assistance",
  "elderly_activity",
  "digital_help",
  "mp_meet_the_people",
  "rc_visit",
];

describe("agency seed data", () => {
  it("has 15 to 25 entries", () => {
    expect(agencies.length).toBeGreaterThanOrEqual(15);
    expect(agencies.length).toBeLessThanOrEqual(25);
  });

  it("every entry has en + zh-Hans blurbs", () => {
    for (const a of agencies) {
      expect(a.multilingualBlurb.en, `${a.key} missing en blurb`).toBeTruthy();
      expect(a.multilingualBlurb["zh-Hans"], `${a.key} missing zh-Hans blurb`).toBeTruthy();
    }
  });

  it("every required category is represented at least once", () => {
    const present = new Set(agencies.map((a) => a.category));
    for (const c of REQUIRED_CATEGORIES) {
      expect(present.has(c), `category ${c} missing`).toBe(true);
    }
  });

  it("every key is unique", () => {
    const keys = agencies.map((a) => a.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("every entry is marked active and source=seed", () => {
    for (const a of agencies) {
      expect(a.active, `${a.key} not active`).toBe(true);
      expect(a.source).toBe("seed");
    }
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npm test
```

Expected: FAIL — `./agencies` does not exist.

- [ ] **Step 3: Implement `workers/src/db/seeds/agencies.ts`**

```ts
import type { AgencyContact } from "../../types/contracts";

// Demo seed for GoodBois. Hotlines listed are publicly-published Singapore agency
// numbers as of mid-2026; verify with each agency before any non-demo deployment.
// All entries are marked source="seed" so triage can clearly distinguish them
// from "official" or "partner" sources later.

const UPDATED_AT = "2026-05-09T00:00:00+08:00";

export const agencies: AgencyContact[] = [
  {
    key: "hdb_essential_maintenance",
    name: "HDB Essential Maintenance Service Unit",
    hotline: "1800-225-5432",
    category: "housing",
    openingHours: "24 hours for essential maintenance",
    multilingualBlurb: {
      en: "For urgent HDB estate maintenance issues such as lift faults and water leaks.",
      "zh-Hans": "处理紧急组屋维修问题，例如电梯故障和漏水。",
    },
    active: true,
    source: "seed",
    updatedAt: UPDATED_AT,
  },
  {
    key: "hdb_branch_office",
    name: "HDB Branch Office (general enquiries)",
    hotline: "1800-225-5432",
    category: "housing",
    openingHours: "Mon–Fri 8am–5pm",
    multilingualBlurb: {
      en: "General HDB matters: rental, upgrading, mailbox, common-area issues.",
      "zh-Hans": "组屋一般事务：租赁、提升、信箱与公共区域问题。",
    },
    active: true,
    source: "seed",
    updatedAt: UPDATED_AT,
  },
  {
    key: "lta_customer_service",
    name: "Land Transport Authority Customer Service",
    hotline: "1800-225-5582",
    category: "transport",
    openingHours: "Mon–Fri 8.30am–6.30pm, Sat 8.30am–1pm",
    multilingualBlurb: {
      en: "Bus, MRT, taxi and concession-card matters.",
      "zh-Hans": "公交、地铁、德士与乐龄卡相关事宜。",
    },
    active: true,
    source: "seed",
    updatedAt: UPDATED_AT,
  },
  {
    key: "transport_aid_silver_generation",
    name: "Silver Generation Transport Aid",
    category: "transport",
    multilingualBlurb: {
      en: "Subsidised transport help for medical appointments through SGO and partner agencies.",
      "zh-Hans": "通过乐龄助理处与合作机构提供的就医交通资助。",
    },
    active: true,
    source: "seed",
    updatedAt: UPDATED_AT,
  },
  {
    key: "aic_eldercare_hotline",
    name: "Agency for Integrated Care Hotline",
    hotline: "1800-650-6060",
    category: "healthcare",
    openingHours: "Mon–Fri 8.30am–8.30pm, Sat 8.30am–4pm",
    multilingualBlurb: {
      en: "Information on home care, community care, day care and senior support services.",
      "zh-Hans": "查询居家护理、社区护理、日间护理与乐龄支援服务。",
    },
    active: true,
    source: "seed",
    updatedAt: UPDATED_AT,
  },
  {
    key: "scdf_emergency",
    name: "SCDF Emergency Ambulance",
    hotline: "995",
    category: "healthcare",
    openingHours: "24 hours",
    multilingualBlurb: {
      en: "Medical emergencies and ambulance dispatch. Call only for genuine emergencies.",
      "zh-Hans": "医疗紧急情况与救护车调派。仅在真正紧急时拨打。",
    },
    active: true,
    source: "seed",
    updatedAt: UPDATED_AT,
  },
  {
    key: "police_non_emergency",
    name: "Singapore Police Non-Emergency",
    hotline: "1800-255-0000",
    category: "legal",
    openingHours: "24 hours",
    multilingualBlurb: {
      en: "Non-urgent police matters. For emergencies dial 999.",
      "zh-Hans": "非紧急警务事项。如有紧急情况请拨999。",
    },
    active: true,
    source: "seed",
    updatedAt: UPDATED_AT,
  },
  {
    key: "legal_aid_bureau",
    name: "Legal Aid Bureau",
    hotline: "1800-325-1424",
    category: "legal",
    openingHours: "Mon–Fri 8.30am–5pm",
    multilingualBlurb: {
      en: "Civil legal aid for those who qualify on means and merits.",
      "zh-Hans": "为符合经济与案件条件的居民提供民事法律援助。",
    },
    active: true,
    source: "seed",
    updatedAt: UPDATED_AT,
  },
  {
    key: "family_service_centre",
    name: "Family Service Centre (nearest branch)",
    category: "social_services",
    multilingualBlurb: {
      en: "Counselling, family support and social services. Refer to nearest FSC.",
      "zh-Hans": "辅导、家庭支援与社会服务。可前往最靠近的家庭服务中心。",
    },
    active: true,
    source: "seed",
    updatedAt: UPDATED_AT,
  },
  {
    key: "silver_generation_office",
    name: "Silver Generation Office",
    hotline: "1800-650-6060",
    category: "social_services",
    multilingualBlurb: {
      en: "Outreach and information for seniors on schemes and benefits.",
      "zh-Hans": "为乐龄居民提供计划与福利的资讯与上门关怀。",
    },
    active: true,
    source: "seed",
    updatedAt: UPDATED_AT,
  },
  {
    key: "comcare_hotline",
    name: "ComCare Hotline",
    hotline: "1800-222-0000",
    category: "financial_assistance",
    openingHours: "Mon–Fri 8.30am–6pm, Sat 8.30am–1pm",
    multilingualBlurb: {
      en: "Financial assistance for low-income individuals and families.",
      "zh-Hans": "为低收入个人与家庭提供经济援助。",
    },
    active: true,
    source: "seed",
    updatedAt: UPDATED_AT,
  },
  {
    key: "cpf_senior_hotline",
    name: "CPF Senior Helpline",
    hotline: "1800-227-1188",
    category: "financial_assistance",
    openingHours: "Mon–Fri 8am–5.30pm",
    multilingualBlurb: {
      en: "CPF withdrawals, retirement payouts and Medisave matters.",
      "zh-Hans": "公积金提款、退休金与保健储蓄相关事宜。",
    },
    active: true,
    source: "seed",
    updatedAt: UPDATED_AT,
  },
  {
    key: "peoples_association",
    name: "People's Association (Community Centre)",
    hotline: "6225-5322",
    category: "elderly_activity",
    multilingualBlurb: {
      en: "Senior activities, courses and Community Centre programmes.",
      "zh-Hans": "乐龄活动、课程与民众俱乐部项目。",
    },
    active: true,
    source: "seed",
    updatedAt: UPDATED_AT,
  },
  {
    key: "active_ageing_centre",
    name: "Active Ageing Centre (nearest branch)",
    category: "elderly_activity",
    multilingualBlurb: {
      en: "Drop-in centres for seniors offering activities, befriending and light support.",
      "zh-Hans": "乐龄活动中心，提供活动、陪伴与轻度支援服务。",
    },
    active: true,
    source: "seed",
    updatedAt: UPDATED_AT,
  },
  {
    key: "skillsfuture_singapore",
    name: "SkillsFuture Singapore",
    hotline: "6785-5785",
    category: "digital_help",
    openingHours: "Mon–Fri 9am–6pm",
    multilingualBlurb: {
      en: "Digital and skills training, including senior-friendly courses.",
      "zh-Hans": "数码与技能培训，包括乐龄友善课程。",
    },
    active: true,
    source: "seed",
    updatedAt: UPDATED_AT,
  },
  {
    key: "sg_digital_office_seniors_go_digital",
    name: "Seniors Go Digital",
    category: "digital_help",
    multilingualBlurb: {
      en: "1-on-1 help with mobile apps, Singpass and government e-services.",
      "zh-Hans": "提供手机应用、Singpass与政府电子服务的一对一指导。",
    },
    active: true,
    source: "seed",
    updatedAt: UPDATED_AT,
  },
  {
    key: "mp_meet_the_people_session",
    name: "MP Meet-the-People Session",
    category: "mp_meet_the_people",
    openingHours: "Weekly, varies by constituency",
    multilingualBlurb: {
      en: "Weekly session where residents can request help from their elected MP.",
      "zh-Hans": "每周一次的接见居民活动，可向民选议员寻求协助。",
    },
    active: true,
    source: "seed",
    updatedAt: UPDATED_AT,
  },
  {
    key: "rc_visit",
    name: "Residents' Committee Visit",
    category: "rc_visit",
    multilingualBlurb: {
      en: "Local Residents' Committee volunteers can follow up on neighbourhood and welfare matters.",
      "zh-Hans": "居民委员会志工可跟进社区与福利相关事宜。",
    },
    active: true,
    source: "seed",
    updatedAt: UPDATED_AT,
  },
];
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npm test
```

Expected: PASS — all 5 shape tests green; agency count is 18 (within 15–25).

- [ ] **Step 5: Commit**

```bash
git add workers/src/db/seeds/agencies.ts workers/src/db/seeds/agencies.test.ts
git commit -m "feat: seed 18 AgencyContact rows covering every category with EN+ZH blurbs"
```

---

## Task 8: Tool registry with allowlist enforcement (TDD)

**Files:**
- Create: `workers/src/tools/registry.ts`
- Test: `workers/src/tools/registry.test.ts`

The registry is the single choke point. `simulateBooking` is intentionally excluded.

- [ ] **Step 1: Write the failing test**

`workers/src/tools/registry.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { ALLOWLIST, isAllowedTool } from "./registry";

describe("tool registry", () => {
  it("ALLOWLIST contains exactly the four MVP tools", () => {
    expect([...ALLOWLIST].sort()).toEqual(
      ["escalateToMpRc", "findNearby", "generateReceipt", "signpost"].sort(),
    );
  });

  it("isAllowedTool accepts allowlisted names", () => {
    expect(isAllowedTool("signpost")).toBe(true);
    expect(isAllowedTool("findNearby")).toBe(true);
    expect(isAllowedTool("generateReceipt")).toBe(true);
    expect(isAllowedTool("escalateToMpRc")).toBe(true);
  });

  it("isAllowedTool rejects simulateBooking and unknown names", () => {
    expect(isAllowedTool("simulateBooking")).toBe(false);
    expect(isAllowedTool("eval")).toBe(false);
    expect(isAllowedTool("")).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npm test
```

Expected: FAIL — `./registry` does not exist.

- [ ] **Step 3: Implement `workers/src/tools/registry.ts`**

```ts
export const ALLOWLIST = [
  "signpost",
  "findNearby",
  "generateReceipt",
  "escalateToMpRc",
] as const;

export type ToolName = (typeof ALLOWLIST)[number];

const allowedSet = new Set<string>(ALLOWLIST);

export function isAllowedTool(name: string): name is ToolName {
  return allowedSet.has(name);
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npm test
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add workers/src/tools/registry.ts workers/src/tools/registry.test.ts
git commit -m "feat: tool registry with MVP allowlist (simulateBooking excluded)"
```

---

## Task 9: `signpost` tool (TDD)

**Files:**
- Create: `workers/src/tools/signpost.ts`
- Test: `workers/src/tools/signpost.test.ts`

Returns the curated `AgencyContact` for a given key. Throws structured error if key is unknown or the agency is inactive.

- [ ] **Step 1: Write the failing test**

`workers/src/tools/signpost.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { signpost, AgencyNotAllowedError } from "./signpost";
import { createMemoryRepos } from "../db/memory";
import type { AgencyContact } from "../types/contracts";

const seed: AgencyContact[] = [
  {
    key: "active_one",
    name: "Active",
    category: "housing",
    multilingualBlurb: { en: "x", "zh-Hans": "x" },
    active: true,
    source: "seed",
    updatedAt: "2026-05-09T00:00:00+08:00",
  },
  {
    key: "inactive_one",
    name: "Inactive",
    category: "housing",
    multilingualBlurb: { en: "x", "zh-Hans": "x" },
    active: false,
    source: "seed",
    updatedAt: "2026-05-09T00:00:00+08:00",
  },
];

describe("signpost", () => {
  it("returns the agency for an active known key", async () => {
    const repos = createMemoryRepos(seed);
    const a = await signpost({ agencyKey: "active_one" }, repos);
    expect(a.key).toBe("active_one");
  });

  it("throws AgencyNotAllowedError for unknown key", async () => {
    const repos = createMemoryRepos(seed);
    await expect(signpost({ agencyKey: "missing" }, repos)).rejects.toBeInstanceOf(
      AgencyNotAllowedError,
    );
  });

  it("throws AgencyNotAllowedError for inactive key", async () => {
    const repos = createMemoryRepos(seed);
    await expect(signpost({ agencyKey: "inactive_one" }, repos)).rejects.toBeInstanceOf(
      AgencyNotAllowedError,
    );
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npm test
```

Expected: FAIL — module `./signpost` does not exist.

- [ ] **Step 3: Implement `workers/src/tools/signpost.ts`**

```ts
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
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npm test
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add workers/src/tools/signpost.ts workers/src/tools/signpost.test.ts
git commit -m "feat: signpost tool with active-only allowlist enforcement"
```

---

## Task 10: `findNearby` text-first stub (TDD)

**Files:**
- Create: `workers/src/tools/findNearby.ts`
- Test: `workers/src/tools/findNearby.test.ts`

Returns up to 3 active agencies in the requested category. Real geo lookup is Dev C's lane.

- [ ] **Step 1: Write the failing test**

`workers/src/tools/findNearby.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { findNearby } from "./findNearby";
import { createMemoryRepos } from "../db/memory";
import type { AgencyContact } from "../types/contracts";

function fixture(key: string, active = true): AgencyContact {
  return {
    key,
    name: key,
    category: "healthcare",
    multilingualBlurb: { en: "x", "zh-Hans": "x" },
    active,
    source: "seed",
    updatedAt: "2026-05-09T00:00:00+08:00",
  };
}

describe("findNearby", () => {
  it("returns up to 3 active agencies in the category", async () => {
    const repos = createMemoryRepos([
      fixture("h1"),
      fixture("h2"),
      fixture("h3"),
      fixture("h4"),
      { ...fixture("inactive"), active: false },
    ]);
    const result = await findNearby({ category: "healthcare" }, repos);
    expect(result.length).toBe(3);
    expect(result.every((a) => a.active)).toBe(true);
  });

  it("returns an empty array when no active agencies match", async () => {
    const repos = createMemoryRepos([{ ...fixture("inactive"), active: false }]);
    const result = await findNearby({ category: "healthcare" }, repos);
    expect(result).toEqual([]);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npm test
```

Expected: FAIL — `./findNearby` does not exist.

- [ ] **Step 3: Implement `workers/src/tools/findNearby.ts`**

```ts
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
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npm test
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add workers/src/tools/findNearby.ts workers/src/tools/findNearby.test.ts
git commit -m "feat: findNearby stub returns top-3 active agencies in category"
```

---

## Task 11: `generateReceipt` tool (TDD)

**Files:**
- Create: `workers/src/tools/generateReceipt.ts`
- Test: `workers/src/tools/generateReceipt.test.ts`

Persists a `Receipt` row and sets `pdfUrl` to the worker's HTML route. The `workerUrl` argument is configurable so tests can assert it.

- [ ] **Step 1: Write the failing test**

`workers/src/tools/generateReceipt.test.ts`:

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { generateReceipt } from "./generateReceipt";
import { createMemoryRepos } from "../db/memory";
import { _resetCounters } from "../db/ids";

describe("generateReceipt", () => {
  beforeEach(() => _resetCounters());

  it("creates a receipt with pdfUrl pointing to the worker route", async () => {
    const repos = createMemoryRepos([]);
    const r = await generateReceipt(
      {
        sessionId: "s1",
        caseId: "GBC-20260509-001",
        language: "zh-Hans",
        workerUrl: "https://goodbois.example",
      },
      repos,
    );
    expect(r.id).toMatch(/^GBR-\d{8}-\d{3}$/);
    expect(r.pdfUrl).toBe(`https://goodbois.example/receipts/${r.id}`);
    expect(r.language).toBe("zh-Hans");
    expect(r.caseId).toBe("GBC-20260509-001");
  });

  it("works without a caseId (signpost-only receipts)", async () => {
    const repos = createMemoryRepos([]);
    const r = await generateReceipt(
      { sessionId: "s2", language: "en", workerUrl: "https://goodbois.example" },
      repos,
    );
    expect(r.caseId).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npm test
```

Expected: FAIL — `./generateReceipt` does not exist.

- [ ] **Step 3: Implement `workers/src/tools/generateReceipt.ts`**

```ts
import type { Receipt } from "../types/contracts";
import type { Repos } from "../db/repos";

export type GenerateReceiptArgs = {
  sessionId: string;
  caseId?: string;
  language: string;
  workerUrl: string;
};

export async function generateReceipt(
  args: GenerateReceiptArgs,
  repos: Pick<Repos, "receipts">,
): Promise<Receipt> {
  // The persistence layer assigns the id; we then derive the pdfUrl from it.
  // Because the URL depends on the id, we need to perform a two-phase create:
  // generate the id implicitly inside `repos.receipts.create`, but pass a
  // placeholder URL that the repo overwrites — or compute the URL here using
  // a placeholder and let the repo store it as-is.
  //
  // For the in-memory repo, the simplest correct approach is: pass a placeholder,
  // read back the id, then update the row. To keep this tool independent of
  // repo internals, we instead rely on the repo accepting `pdfUrl` as a param
  // and we compute it after the create call by re-reading the receipt.
  const placeholderUrl = "pending";
  const created = await repos.receipts.create(
    {
      sessionId: args.sessionId,
      caseId: args.caseId,
      language: args.language,
    },
    placeholderUrl,
  );
  const finalUrl = `${args.workerUrl.replace(/\/$/, "")}/receipts/${created.id}`;
  // Mutate in place via getById — memory repo returns the live reference.
  const stored = await repos.receipts.getById(created.id);
  if (stored) stored.pdfUrl = finalUrl;
  return { ...created, pdfUrl: finalUrl };
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npm test
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add workers/src/tools/generateReceipt.ts workers/src/tools/generateReceipt.test.ts
git commit -m "feat: generateReceipt tool persists row and points pdfUrl at worker HTML route"
```

---

## Task 12: `escalateToMpRc` tool with suggested-next-steps validation (TDD)

**Files:**
- Create: `workers/src/tools/escalateToMpRc.ts`
- Test: `workers/src/tools/escalateToMpRc.test.ts`

Persists a `Case`. Scans `suggestedNextSteps` for phone numbers; flags any number not present in the agency directory (logs only — does not strip in v1).

- [ ] **Step 1: Write the failing test**

`workers/src/tools/escalateToMpRc.test.ts`:

```ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import { escalateToMpRc } from "./escalateToMpRc";
import { createMemoryRepos } from "../db/memory";
import { _resetCounters } from "../db/ids";
import type { AgencyContact } from "../types/contracts";

const seed: AgencyContact[] = [
  {
    key: "scdf_emergency",
    name: "SCDF",
    hotline: "995",
    category: "healthcare",
    multilingualBlurb: { en: "x", "zh-Hans": "x" },
    active: true,
    source: "seed",
    updatedAt: "2026-05-09T00:00:00+08:00",
  },
  {
    key: "hdb",
    name: "HDB",
    hotline: "1800-225-5432",
    category: "housing",
    multilingualBlurb: { en: "x", "zh-Hans": "x" },
    active: true,
    source: "seed",
    updatedAt: "2026-05-09T00:00:00+08:00",
  },
];

describe("escalateToMpRc", () => {
  beforeEach(() => _resetCounters());

  it("creates a case with status='queued' and the supplied fields", async () => {
    const repos = createMemoryRepos(seed);
    const c = await escalateToMpRc(
      {
        sessionId: "s1",
        language: "zh-Hans",
        summaryEnglish: "broken lift",
        summaryUserLanguage: "电梯坏了",
        transcript: "block 123 lift broken",
        suggestedNextSteps: ["Call HDB hotline 1800-225-5432"],
        kioskId: "demo-laptop",
      },
      repos,
    );
    expect(c.id).toMatch(/^GBC-\d{8}-\d{3}$/);
    expect(c.status).toBe("queued");
    expect(c.summaryEnglish).toBe("broken lift");
    expect(c.kioskId).toBe("demo-laptop");
    expect(await repos.cases.getById(c.id)).not.toBeNull();
  });

  it("warns on suggested steps containing unknown phone numbers", async () => {
    const repos = createMemoryRepos(seed);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    await escalateToMpRc(
      {
        sessionId: "s1",
        language: "en",
        summaryEnglish: "x",
        transcript: "x",
        suggestedNextSteps: ["Call 8888-7777 for unknown help"],
        kioskId: "demo-laptop",
      },
      repos,
    );
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it("does not warn when all numbers are in the directory", async () => {
    const repos = createMemoryRepos(seed);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    await escalateToMpRc(
      {
        sessionId: "s1",
        language: "en",
        summaryEnglish: "x",
        transcript: "x",
        suggestedNextSteps: ["Call 1800-225-5432 (HDB)", "Talk to your RC chairman"],
        kioskId: "demo-laptop",
      },
      repos,
    );
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npm test
```

Expected: FAIL — `./escalateToMpRc` does not exist.

- [ ] **Step 3: Implement `workers/src/tools/escalateToMpRc.ts`**

```ts
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
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npm test
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add workers/src/tools/escalateToMpRc.ts workers/src/tools/escalateToMpRc.test.ts
git commit -m "feat: escalateToMpRc tool with suggested-steps phone validation"
```

---

## Task 13: Processing agent dispatch (TDD)

**Files:**
- Create: `workers/src/agents/processing/index.ts`
- Test: `workers/src/agents/processing/index.test.ts`

`runProcessing` is the function Dev A's orchestrator imports. It maps a triage outcome to the right tool call, never throws, and always returns a `ProcessingOutput`.

- [ ] **Step 1: Write the failing test**

`workers/src/agents/processing/index.test.ts`:

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { runProcessing } from "./index";
import { createMemoryRepos } from "../../db/memory";
import { _resetCounters } from "../../db/ids";
import type { AgencyContact, TriageResult } from "../../types/contracts";

const seed: AgencyContact[] = [
  {
    key: "hdb",
    name: "HDB",
    hotline: "1800-225-5432",
    category: "housing",
    multilingualBlurb: { en: "x", "zh-Hans": "x" },
    active: true,
    source: "seed",
    updatedAt: "2026-05-09T00:00:00+08:00",
  },
  {
    key: "scdf",
    name: "SCDF",
    hotline: "995",
    category: "healthcare",
    multilingualBlurb: { en: "x", "zh-Hans": "x" },
    active: true,
    source: "seed",
    updatedAt: "2026-05-09T00:00:00+08:00",
  },
];

function triage(overrides: Partial<TriageResult>): TriageResult {
  return {
    id: "t1",
    sessionId: "s1",
    outcome: "signpost",
    confidence: "high",
    reasoningSummary: "test",
    createdAt: "2026-05-09T10:00:00+08:00",
    ...overrides,
  };
}

const baseInput = {
  sessionId: "s1",
  language: "zh-Hans",
  transcriptEnglish: "broken lift, dialysis transport needed",
  workerUrl: "https://goodbois.example",
};

describe("runProcessing", () => {
  beforeEach(() => _resetCounters());

  it("signpost outcome calls signpost and returns agencyContact", async () => {
    const repos = createMemoryRepos(seed);
    const out = await runProcessing(
      {
        ...baseInput,
        triage: triage({ outcome: "signpost", selectedAgencyKey: "hdb" }),
      },
      repos,
    );
    expect(out.toolName).toBe("signpost");
    expect(out.agencyContact?.key).toBe("hdb");
    expect(out.error).toBeUndefined();
  });

  it("signpost with unknown agency returns AGENCY_NOT_ALLOWED", async () => {
    const repos = createMemoryRepos(seed);
    const out = await runProcessing(
      {
        ...baseInput,
        triage: triage({ outcome: "signpost", selectedAgencyKey: "unknown" }),
      },
      repos,
    );
    expect(out.error?.code).toBe("AGENCY_NOT_ALLOWED");
    expect(out.error?.fallbackAvailable).toBe(true);
  });

  it("find_nearby returns up to 3 agencies", async () => {
    const repos = createMemoryRepos(seed);
    const out = await runProcessing(
      {
        ...baseInput,
        triage: triage({ outcome: "find_nearby", selectedAgencyKey: undefined }),
        findNearbyCategory: "housing",
      },
      repos,
    );
    expect(out.toolName).toBe("findNearby");
    expect(out.agencyContacts?.length ?? 0).toBeGreaterThan(0);
  });

  it("escalate writes a case and a receipt", async () => {
    const repos = createMemoryRepos(seed);
    const out = await runProcessing(
      {
        ...baseInput,
        triage: triage({ outcome: "escalate" }),
        suggestedNextSteps: ["Talk to RC chairman"],
        summaryEnglish: "broken lift",
      },
      repos,
    );
    expect(out.toolName).toBe("escalateToMpRc+generateReceipt");
    expect(out.case?.status).toBe("queued");
    expect(out.receipt?.pdfUrl).toMatch(/^https:\/\/goodbois\.example\/receipts\/GBR-/);
  });

  it("simulate_booking returns TOOL_NOT_ALLOWED", async () => {
    const repos = createMemoryRepos(seed);
    const out = await runProcessing(
      { ...baseInput, triage: triage({ outcome: "simulate_booking" }) },
      repos,
    );
    expect(out.error?.code).toBe("TOOL_NOT_ALLOWED");
  });

  it("out_of_scope falls back to a curated hotline signpost", async () => {
    const repos = createMemoryRepos(seed);
    const out = await runProcessing(
      {
        ...baseInput,
        triage: triage({ outcome: "out_of_scope", selectedAgencyKey: "scdf" }),
      },
      repos,
    );
    expect(out.toolName).toBe("signpost");
    expect(out.agencyContact?.key).toBe("scdf");
  });

  it("records a tool invocation on success", async () => {
    const repos = createMemoryRepos(seed);
    const out = await runProcessing(
      {
        ...baseInput,
        triage: triage({ outcome: "signpost", selectedAgencyKey: "hdb" }),
      },
      repos,
    );
    expect(out.toolInvocation.toolName).toBe("signpost");
    expect(out.toolInvocation.success).toBe(true);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npm test
```

Expected: FAIL — `./index` does not exist.

- [ ] **Step 3: Implement `workers/src/agents/processing/index.ts`**

```ts
import type {
  AgencyCategory,
  AgencyContact,
  Case,
  Receipt,
  ToolInvocation,
  TriageResult,
} from "../../types/contracts";
import type { Repos } from "../../db/repos";
import { signpost, AgencyNotAllowedError } from "../../tools/signpost";
import { findNearby } from "../../tools/findNearby";
import { generateReceipt } from "../../tools/generateReceipt";
import { escalateToMpRc } from "../../tools/escalateToMpRc";
import { isAllowedTool } from "../../tools/registry";

export type ProcessingErrorCode =
  | "AGENCY_NOT_ALLOWED"
  | "TOOL_NOT_ALLOWED"
  | "PROCESSING_FAILED";

export type ProcessingInput = {
  sessionId: string;
  language: string;
  triage: TriageResult;
  transcriptEnglish: string;
  workerUrl: string;
  resident?: { block?: string; unit?: string; alias?: string };
  // Filled in by the orchestrator when applicable:
  findNearbyCategory?: AgencyCategory;
  summaryEnglish?: string;
  summaryUserLanguage?: string;
  suggestedNextSteps?: string[];
  kioskId?: string;
};

export type ProcessingOutput = {
  toolName: string;
  agencyContact?: AgencyContact;
  agencyContacts?: AgencyContact[];
  case?: Case;
  receipt?: Receipt;
  toolInvocation: ToolInvocation;
  error?: { code: ProcessingErrorCode; message: string; fallbackAvailable: boolean };
};

export async function runProcessing(
  input: ProcessingInput,
  repos: Repos,
): Promise<ProcessingOutput> {
  const startedAt = new Date().toISOString();

  const requestedTool = input.triage.selectedToolName;
  if (requestedTool && !isAllowedTool(requestedTool)) {
    return errorOut(
      "TOOL_NOT_ALLOWED",
      `Tool "${requestedTool}" is not in the allowlist.`,
      requestedTool,
      startedAt,
      repos,
    );
  }

  if (input.triage.outcome === "simulate_booking") {
    return errorOut(
      "TOOL_NOT_ALLOWED",
      "simulateBooking is not enabled in this build.",
      "simulateBooking",
      startedAt,
      repos,
    );
  }

  try {
    switch (input.triage.outcome) {
      case "signpost":
      case "out_of_scope": {
        const key = input.triage.selectedAgencyKey ?? "";
        const agency = await signpost({ agencyKey: key }, repos);
        return ok("signpost", { agencyContact: agency }, startedAt, repos, input.sessionId, {
          agencyKey: key,
        });
      }
      case "find_nearby": {
        const cat = input.findNearbyCategory;
        if (!cat) {
          return errorOut(
            "PROCESSING_FAILED",
            "find_nearby requires a category.",
            "findNearby",
            startedAt,
            repos,
          );
        }
        const agencies = await findNearby({ category: cat }, repos);
        return ok(
          "findNearby",
          { agencyContacts: agencies },
          startedAt,
          repos,
          input.sessionId,
          { category: cat },
        );
      }
      case "escalate": {
        const summaryEnglish = input.summaryEnglish ?? input.transcriptEnglish.slice(0, 300);
        const c = await escalateToMpRc(
          {
            sessionId: input.sessionId,
            language: input.language,
            summaryEnglish,
            summaryUserLanguage: input.summaryUserLanguage,
            transcript: input.transcriptEnglish,
            suggestedNextSteps: input.suggestedNextSteps ?? [],
            residentBlock: input.resident?.block,
            residentUnit: input.resident?.unit,
            residentNameAlias: input.resident?.alias,
            kioskId: input.kioskId ?? "demo-laptop",
            exportChannel: "csv",
          },
          repos,
        );
        const r = await generateReceipt(
          {
            sessionId: input.sessionId,
            caseId: c.id,
            language: input.language,
            workerUrl: input.workerUrl,
          },
          repos,
        );
        return ok(
          "escalateToMpRc+generateReceipt",
          { case: c, receipt: r },
          startedAt,
          repos,
          input.sessionId,
          { caseId: c.id, receiptId: r.id },
        );
      }
      case "ask_followup":
        return errorOut(
          "PROCESSING_FAILED",
          "ask_followup is owned by the orchestrator, not the processing agent.",
          "n/a",
          startedAt,
          repos,
        );
      default:
        return errorOut(
          "PROCESSING_FAILED",
          `Unknown triage outcome: ${input.triage.outcome}`,
          "n/a",
          startedAt,
          repos,
        );
    }
  } catch (e) {
    if (e instanceof AgencyNotAllowedError) {
      return errorOut(
        "AGENCY_NOT_ALLOWED",
        e.message,
        input.triage.selectedToolName ?? "signpost",
        startedAt,
        repos,
      );
    }
    return errorOut(
      "PROCESSING_FAILED",
      e instanceof Error ? e.message : String(e),
      input.triage.selectedToolName ?? "n/a",
      startedAt,
      repos,
    );
  }
}

async function ok(
  toolName: string,
  payload: Pick<
    ProcessingOutput,
    "agencyContact" | "agencyContacts" | "case" | "receipt"
  >,
  startedAt: string,
  repos: Repos,
  sessionId: string,
  args: Record<string, unknown>,
): Promise<ProcessingOutput> {
  const completedAt = new Date().toISOString();
  const invocation: ToolInvocation = {
    id: `${sessionId}-${completedAt}`,
    sessionId,
    toolName,
    argumentsJson: JSON.stringify(args),
    resultJson: JSON.stringify(payload),
    startedAt,
    completedAt,
    success: true,
  };
  await repos.toolInvocations.record(invocation);
  return { toolName, ...payload, toolInvocation: invocation };
}

async function errorOut(
  code: ProcessingErrorCode,
  message: string,
  toolName: string,
  startedAt: string,
  repos: Repos,
): Promise<ProcessingOutput> {
  const completedAt = new Date().toISOString();
  const invocation: ToolInvocation = {
    id: `err-${completedAt}`,
    sessionId: "",
    toolName,
    argumentsJson: "{}",
    resultJson: JSON.stringify({ code, message }),
    startedAt,
    completedAt,
    success: false,
    errorMessage: message,
  };
  await repos.toolInvocations.record(invocation);
  return {
    toolName,
    toolInvocation: invocation,
    error: { code, message, fallbackAvailable: true },
  };
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npm test
```

Expected: PASS — all 7 processing tests green.

- [ ] **Step 5: Commit**

```bash
git add workers/src/agents/processing/index.ts workers/src/agents/processing/index.test.ts
git commit -m "feat: processing agent dispatches triage outcomes through allowlisted tools"
```

---

## Task 14: Bilingual HTML receipt render + `GET /receipts/:id` route

**Files:**
- Create: `workers/src/receipt/render.ts`
- Test: `workers/src/receipt/render.test.ts`
- Modify: `workers/src/index.ts`

- [ ] **Step 1: Write the render unit test**

`workers/src/receipt/render.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { renderReceiptHtml } from "./render";
import type { Receipt, Case } from "../types/contracts";

const receipt: Receipt = {
  id: "GBR-20260509-001",
  sessionId: "s1",
  caseId: "GBC-20260509-001",
  language: "zh-Hans",
  pdfUrl: "https://goodbois.example/receipts/GBR-20260509-001",
  generatedAt: "2026-05-09T10:00:00+08:00",
};

const linkedCase: Case = {
  id: "GBC-20260509-001",
  sessionId: "s1",
  language: "zh-Hans",
  summaryEnglish: "Resident reports a broken lift.",
  summaryUserLanguage: "居民报告电梯故障。",
  transcript: "Block 123 lift broken.",
  suggestedNextSteps: ["Call HDB hotline 1800-225-5432"],
  kioskId: "demo-laptop",
  status: "queued",
  createdAt: "2026-05-09T10:00:00+08:00",
};

describe("renderReceiptHtml", () => {
  it("includes the receipt id, case id, and disclaimer", () => {
    const html = renderReceiptHtml({ receipt, case: linkedCase });
    expect(html).toContain("GBR-20260509-001");
    expect(html).toContain("GBC-20260509-001");
    expect(html).toContain("This is not an official agency dispatch");
  });

  it("includes both language summaries when available", () => {
    const html = renderReceiptHtml({ receipt, case: linkedCase });
    expect(html).toContain("Resident reports a broken lift");
    expect(html).toContain("居民报告电梯故障");
  });

  it("renders without a case", () => {
    const html = renderReceiptHtml({ receipt });
    expect(html).toContain("GBR-20260509-001");
    expect(html).toContain("This is not an official agency dispatch");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npm test
```

Expected: FAIL — `./render` does not exist.

- [ ] **Step 3: Implement `workers/src/receipt/render.ts`**

```ts
import type { Case, Receipt } from "../types/contracts";

export type RenderReceiptInput = {
  receipt: Receipt;
  case?: Case;
};

const DISCLAIMER_EN = "This is not an official agency dispatch.";
const DISCLAIMER_ZH = "本回执并非政府机构正式派遣记录。";

export function renderReceiptHtml({ receipt, case: c }: RenderReceiptInput): string {
  return `<!doctype html>
<html lang="${escapeHtml(receipt.language)}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>GoodBois Receipt ${escapeHtml(receipt.id)}</title>
  <style>
    body { font-family: system-ui, -apple-system, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif; background: #fff; color: #111; margin: 0; padding: 2rem; }
    .receipt { max-width: 720px; margin: 0 auto; border: 2px solid #111; padding: 2rem; }
    h1 { font-size: 2rem; margin: 0 0 1rem; }
    h2 { font-size: 1.25rem; margin: 1.25rem 0 0.5rem; }
    .id { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 1rem; }
    .meta { color: #555; font-size: 0.9rem; }
    ul { padding-left: 1.25rem; }
    .disclaimer { margin-top: 2rem; padding: 1rem; background: #fff7e6; border-left: 4px solid #d97706; font-size: 0.95rem; }
    @media print { body { padding: 0; } .receipt { border: none; } }
  </style>
</head>
<body>
  <main class="receipt">
    <h1>GoodBois 回执 / Receipt</h1>
    <p class="id">${escapeHtml(receipt.id)}</p>
    <p class="meta">${escapeHtml(receipt.generatedAt)}</p>
    ${c ? renderCaseBlock(c) : ""}
    <div class="disclaimer">
      <p><strong>${escapeHtml(DISCLAIMER_ZH)}</strong></p>
      <p>${escapeHtml(DISCLAIMER_EN)}</p>
    </div>
  </main>
</body>
</html>`;
}

function renderCaseBlock(c: Case): string {
  const steps = c.suggestedNextSteps
    .map((s) => `<li>${escapeHtml(s)}</li>`)
    .join("");
  return `
    <h2>案件 / Case</h2>
    <p class="id">${escapeHtml(c.id)}</p>
    ${c.summaryUserLanguage ? `<p>${escapeHtml(c.summaryUserLanguage)}</p>` : ""}
    <p>${escapeHtml(c.summaryEnglish)}</p>
    ${steps ? `<h2>建议下一步 / Suggested next steps</h2><ul>${steps}</ul>` : ""}
  `;
}

function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
```

- [ ] **Step 4: Run the unit test to verify it passes**

```bash
npm test
```

Expected: PASS — render tests green.

- [ ] **Step 5: Wire `GET /receipts/:id` into `workers/src/index.ts`**

This is the first place in `index.ts` where we need access to repos. We construct them lazily from the seed and store them on a module-level singleton — D1-backed repos will replace this later.

Add the following near the top of `workers/src/index.ts`, after the existing imports:

```ts
import { agencies as seedAgencies } from "./db/seeds/agencies";
import { createMemoryRepos } from "./db/memory";
import type { Repos } from "./db/repos";
import { renderReceiptHtml } from "./receipt/render";

let repos: Repos | null = null;
function getRepos(): Repos {
  if (!repos) repos = createMemoryRepos(seedAgencies);
  return repos;
}

const RECEIPT_ID_RE = /^GBR-\d{8}-\d{3}$/;
```

Then, before `export default app;`, insert:

```ts
app.get("/receipts/:id", async (c) => {
  const id = c.req.param("id");
  if (!RECEIPT_ID_RE.test(id)) {
    return c.json({ code: "INVALID_ID", message: "Receipt id format is wrong." }, 400);
  }
  const r = getRepos();
  const receipt = await r.receipts.getById(id);
  if (!receipt) return c.json({ code: "NOT_FOUND", message: "Receipt not found." }, 404);
  const linkedCase = receipt.caseId ? (await r.cases.getById(receipt.caseId)) ?? undefined : undefined;
  const html = renderReceiptHtml({ receipt, case: linkedCase });
  return c.html(html);
});
```

- [ ] **Step 6: Add an integration test for the route**

Append to `workers/src/receipt/render.test.ts` a separate `describe` block that exercises the Hono app:

```ts
import app from "../index";

describe("GET /receipts/:id", () => {
  it("returns 400 for a malformed id", async () => {
    const res = await app.request("/receipts/not-an-id");
    expect(res.status).toBe(400);
  });

  it("returns 404 for an unknown id", async () => {
    const res = await app.request("/receipts/GBR-20260509-999");
    expect(res.status).toBe(404);
  });
});
```

(Note: a "happy-path" test that creates a receipt then fetches it would cross-contaminate the in-memory singleton between test files, so we keep the route test minimal here. The end-to-end happy path is covered manually in Task 17.)

- [ ] **Step 7: Run all tests**

```bash
npm test
```

Expected: PASS — render tests + 2 route tests + every previous test still green.

- [ ] **Step 8: Commit**

```bash
git add workers/src/receipt/render.ts workers/src/receipt/render.test.ts workers/src/index.ts
git commit -m "feat: bilingual HTML receipt render and GET /receipts/:id route"
```

---

## Task 15: CSV export serialiser (TDD)

**Files:**
- Create: `workers/src/export/casesCsv.ts`
- Test: `workers/src/export/casesCsv.test.ts`

RFC 4180 quoting; `;`-joined `suggestedNextSteps`; column order matches `data-contracts.md`.

- [ ] **Step 1: Write the failing test**

`workers/src/export/casesCsv.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { casesToCsv } from "./casesCsv";
import type { Case } from "../types/contracts";

const HEADER =
  "id,createdAt,language,summaryEnglish,transcript,suggestedNextSteps,residentBlock,residentUnit,residentNameAlias,kioskId,status,sessionId";

const sample: Case = {
  id: "GBC-20260509-001",
  sessionId: "s1",
  language: "zh-Hans",
  summaryEnglish: 'Lift broken; "urgent" repair needed.',
  summaryUserLanguage: "电梯坏了。",
  transcript: "Block 123 lift broken.\nBlock 123 level 8.",
  suggestedNextSteps: ["Call HDB", "Talk to RC"],
  residentBlock: "123",
  residentUnit: "Level 8",
  kioskId: "demo-laptop",
  status: "queued",
  createdAt: "2026-05-09T10:00:00+08:00",
};

describe("casesToCsv", () => {
  it("emits the documented header on the first line", () => {
    const csv = casesToCsv([]);
    expect(csv.split("\r\n")[0]).toBe(HEADER);
  });

  it("emits one data row per case in the documented column order", () => {
    const csv = casesToCsv([sample]);
    const lines = csv.split("\r\n");
    expect(lines[0]).toBe(HEADER);
    expect(lines[1]).toContain("GBC-20260509-001");
    expect(lines[1]).toContain("zh-Hans");
  });

  it("joins suggestedNextSteps with ;", () => {
    const csv = casesToCsv([sample]);
    expect(csv).toContain("Call HDB;Talk to RC");
  });

  it("doubles embedded quotes and quotes fields with newlines", () => {
    const csv = casesToCsv([sample]);
    // Embedded quote in summaryEnglish
    expect(csv).toContain('"Lift broken; ""urgent"" repair needed."');
    // Newline in transcript
    expect(csv).toMatch(/"Block 123 lift broken\.\nBlock 123 level 8\."/);
  });

  it("emits empty fields for missing optional values", () => {
    const minimal: Case = {
      ...sample,
      summaryUserLanguage: undefined,
      residentBlock: undefined,
      residentUnit: undefined,
      residentNameAlias: undefined,
    };
    const csv = casesToCsv([minimal]);
    // residentBlock, residentUnit, residentNameAlias should appear as empty between commas
    expect(csv).toMatch(/,demo-laptop,/);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npm test
```

Expected: FAIL — `./casesCsv` does not exist.

- [ ] **Step 3: Implement `workers/src/export/casesCsv.ts`**

```ts
import type { Case } from "../types/contracts";

const COLUMNS = [
  "id",
  "createdAt",
  "language",
  "summaryEnglish",
  "transcript",
  "suggestedNextSteps",
  "residentBlock",
  "residentUnit",
  "residentNameAlias",
  "kioskId",
  "status",
  "sessionId",
] as const;

export function casesToCsv(cases: readonly Case[]): string {
  const lines = [COLUMNS.join(",")];
  for (const c of cases) {
    lines.push(
      [
        c.id,
        c.createdAt,
        c.language,
        c.summaryEnglish,
        c.transcript,
        c.suggestedNextSteps.join(";"),
        c.residentBlock ?? "",
        c.residentUnit ?? "",
        c.residentNameAlias ?? "",
        c.kioskId,
        c.status,
        c.sessionId,
      ]
        .map(quote)
        .join(","),
    );
  }
  return lines.join("\r\n");
}

function quote(value: string): string {
  if (value === "") return "";
  if (/[",\r\n]/.test(value)) {
    return `"${value.replaceAll('"', '""')}"`;
  }
  return value;
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npm test
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add workers/src/export/casesCsv.ts workers/src/export/casesCsv.test.ts
git commit -m "feat: cases CSV serialiser with rfc 4180 quoting and ;-joined steps"
```

---

## Task 16: `GET /export/cases.csv` route with token auth + integration test

**Files:**
- Modify: `workers/src/index.ts`
- Modify: `workers/src/receipt/render.test.ts` (add new describe block — file is already created; reuse it for export-route tests for now)
- Create: `workers/src/export/casesCsv.route.test.ts`

- [ ] **Step 1: Add the route to `workers/src/index.ts`**

Insert near the top, with the existing imports:

```ts
import { casesToCsv } from "./export/casesCsv";
```

Then, before `export default app;`, add:

```ts
app.get("/export/cases.csv", async (c) => {
  const token = c.req.query("token");
  const expected = c.env.EXPORT_TOKEN;
  if (!expected || !token || !constantTimeEqual(token, expected)) {
    return c.json({ code: "UNAUTHORIZED", message: "Invalid or missing token." }, 401);
  }
  const r = getRepos();
  const cases = await r.cases.listForExport();
  const now = new Date().toISOString();
  for (const x of cases) await r.cases.markExported(x.id, now);
  const csv = casesToCsv(cases);
  return new Response(csv, {
    status: 200,
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="goodbois-cases-${now.slice(0, 10)}.csv"`,
    },
  });
});

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
```

- [ ] **Step 2: Write the route integration test**

`workers/src/export/casesCsv.route.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import app from "../index";

describe("GET /export/cases.csv", () => {
  const env = { EXPORT_TOKEN: "test-token" };

  it("returns 401 when token is missing", async () => {
    const res = await app.request("/export/cases.csv", {}, env);
    expect(res.status).toBe(401);
  });

  it("returns 401 when token is wrong", async () => {
    const res = await app.request("/export/cases.csv?token=wrong", {}, env);
    expect(res.status).toBe(401);
  });

  it("returns 200 with text/csv when token is correct", async () => {
    const res = await app.request("/export/cases.csv?token=test-token", {}, env);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toMatch(/text\/csv/);
    const body = await res.text();
    expect(body.split("\r\n")[0]).toBe(
      "id,createdAt,language,summaryEnglish,transcript,suggestedNextSteps,residentBlock,residentUnit,residentNameAlias,kioskId,status,sessionId",
    );
  });
});
```

- [ ] **Step 3: Run all tests**

```bash
npm test
```

Expected: PASS — including 3 new export-route tests and every previous test.

- [ ] **Step 4: Commit**

```bash
git add workers/src/index.ts workers/src/export/casesCsv.route.test.ts
git commit -m "feat: GET /export/cases.csv with token auth, marks cases exported on success"
```

---

## Task 17: Document env, update wrangler example, run full verification

**Files:**
- Modify: `workers/wrangler.toml.example`
- Modify: `.env.example`

- [ ] **Step 1: Update `workers/wrangler.toml.example`**

Add a `[vars]` block at the bottom:

```toml
[vars]
EXPORT_TOKEN = "replace-with-strong-random-string"
WORKER_URL = "http://127.0.0.1:8787"
```

- [ ] **Step 2: Update `.env.example`**

Append:

```
# Worker (local dev)
# Set in workers/.dev.vars after copying wrangler.toml:
# EXPORT_TOKEN=replace-with-strong-random-string
# WORKER_URL=http://127.0.0.1:8787
```

- [ ] **Step 3: Run lint**

```bash
npm run lint
```

Expected: clean (lint runs on Next.js source, not workers/, so this should pass unchanged).

- [ ] **Step 4: Run the full test suite**

```bash
npm test
```

Expected: PASS — every test from every task.

- [ ] **Step 5: Run typecheck on workers/**

```bash
npx tsc -p workers/tsconfig.json --noEmit
```

Expected: no errors.

- [ ] **Step 6: Manual smoke (optional but recommended)**

If wrangler is set up locally:

```bash
cd workers
cp wrangler.toml.example wrangler.toml
# Edit wrangler.toml — replace EXPORT_TOKEN value with anything for local dev.
npx wrangler dev --local
```

In another terminal:

```bash
curl http://127.0.0.1:8787/health
# Expected: {"ok":true,"service":"goodbois-worker"}

curl -i http://127.0.0.1:8787/receipts/not-an-id
# Expected: 400 INVALID_ID

curl -i "http://127.0.0.1:8787/export/cases.csv"
# Expected: 401 UNAUTHORIZED

curl -i "http://127.0.0.1:8787/export/cases.csv?token=YOUR_TOKEN"
# Expected: 200, header line returned
```

The processing agent's happy path is exercised by the unit tests, not curl, because there is no orchestrator yet.

- [ ] **Step 7: Commit**

```bash
git add workers/wrangler.toml.example .env.example
git commit -m "chore: document EXPORT_TOKEN and WORKER_URL for local worker dev"
```

---

## Self-review

**Spec coverage** (matched against `docs/superpowers/specs/2026-05-09-dev-b-tools-cases-design.md`):

| Spec section | Task |
|---|---|
| Tools: signpost | Task 9 |
| Tools: findNearby (text-first stub) | Task 10 |
| Tools: generateReceipt | Task 11 |
| Tools: escalateToMpRc | Task 12 |
| Tool registry / allowlist | Task 8 |
| Repository interfaces | Task 5 |
| In-memory repo impl | Task 6 |
| Agency seed (15–25, EN+ZH, every category) | Task 7 |
| ID generator (GBC-/GBR-, daily counter, SGT) | Task 4 |
| Processing agent + dispatch table | Task 13 |
| `simulate_booking` rejected via `TOOL_NOT_ALLOWED` | Task 13 |
| `out_of_scope` falls back to curated hotline | Task 13 |
| `AGENCY_NOT_ALLOWED` / `TOOL_NOT_ALLOWED` / `PROCESSING_FAILED` codes | Task 13 |
| Receipt HTML render + bilingual + disclaimer | Task 14 |
| `GET /receipts/:id` route + id regex 400 | Task 14 |
| CSV serialiser + RFC 4180 + `;`-join | Task 15 |
| `GET /export/cases.csv` + token auth + `markExported` side effect | Task 16 |
| Hono migration | Task 2 |
| Vitest set up | Task 1 |
| `TriageResult`, `ToolInvocation` types | Task 3 |
| `wrangler.toml.example` env vars | Task 17 |
| Suggested-next-steps phone validation | Task 12 |

Items not implemented (intentional, per spec deviations table): pdf-lib + R2 (HTML receipt instead), `simulateBooking` tool body, real D1 wiring, signed URL tokens, webhook/email export, hazard reporting.

**Type consistency:** `runProcessing(input, repos)` second arg is `Repos` everywhere. `ProcessingInput` adds three orchestrator-supplied fields (`findNearbyCategory`, `summaryEnglish`, `suggestedNextSteps`, `kioskId`) on top of what the spec listed; this is a small spec-handoff gap. The handoff doc says Dev A "passes in `ProcessingInput`"; these extra fields will need to be reflected back in the handoff doc when Task 13 lands. Add a sentence to the handoff doc in Task 17 if Dev A has not reviewed it by then.

**Placeholders:** none.

---

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-05-09-dev-b-tools-and-cases.md`. Two execution options:**

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration.

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints.

**Which approach?**
