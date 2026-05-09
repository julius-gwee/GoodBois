# Dev C Map Discovery Handoff

Last updated: 2026-05-09

Owner: Dev C map/discovery

## Current Status

- Branch: `juliusc/build-map-discovery-agent`
- Committed real-map slice: `a6e8af3 feat: add real Kawan map data path`
- Frontend now uses Leaflet with OneMap XYZ tiles.
- Frontend loads `/resources` and `/routes` from `NEXT_PUBLIC_WORKER_URL`, with fixture fallback.
- Worker exposes `/resources` and `/routes`.
- Worker `/routes` now attempts OneMap live routing when OneMap credentials are configured, then falls back to demo routes.
- OneMap BFA is treated honestly: if no separate BFA route type/API is provided, wheelchair mode uses OneMap walking as a fallback label.

## 1. What Dev C Needs To Do

### 1.1 Worker URL

Use the local Worker URL during development:

```env
NEXT_PUBLIC_WORKER_URL=http://127.0.0.1:8787
```

Where to find it:

1. Start the Worker from the `workers` folder with Wrangler.
2. Wrangler prints the local URL in the terminal, usually `http://127.0.0.1:8787`.
3. Put that URL in frontend `.env.local` as `NEXT_PUBLIC_WORKER_URL`.
4. Restart `npm run dev` after changing `.env.local`.

For deployed Worker:

1. Deploy the Cloudflare Worker.
2. Copy the deployed Worker URL from the Cloudflare dashboard or Wrangler output.
3. Set `NEXT_PUBLIC_WORKER_URL=https://<worker-name>.<account>.workers.dev` in the frontend deployment environment.

### 1.2 OneMap Credentials

Do not put OneMap credentials in frontend `.env.local`.

For local/deployed Worker secrets:

```powershell
cd workers
wrangler secret put ONEMAP_ACCESS_TOKEN
```

or, if the team wants the Worker to request tokens:

```powershell
cd workers
wrangler secret put ONEMAP_EMAIL
wrangler secret put ONEMAP_PASSWORD
```

Non-secret Worker vars live in `workers/wrangler.toml`:

```toml
[vars]
ONEMAP_API_BASE_URL = "https://www.onemap.gov.sg"
ONEMAP_WHEELCHAIR_ROUTE_TYPE = "walk"
```

Notes:

- OneMap token generation is documented as `POST /api/auth/post/getToken` using registered email/password.
- Public routing is documented around `/api/public/routingsvc/route`.
- BFA exists in OneMap product coverage, but the public route API surface for BFA is not clearly documented in the browsable docs. Until SLA provides a BFA route parameter or endpoint, keep `ONEMAP_WHEELCHAIR_ROUTE_TYPE="walk"` and label it as a BFA fallback.

### 1.3 Suggested Kiosk Origin

Recommended tentative origin:

```ts
{
  label: "Kawan kiosk at Jalan Kukoh void deck",
  latitude: 1.28741,
  longitude: 103.83924,
  address: "Jalan Kukoh / Blk 8A void-deck area, Singapore"
}
```

Rationale:

- Jalan Kukoh has public rental-flat context and public reporting about overcrowded/poor living conditions.
- Public volunteer/programme sources explicitly describe outreach to seniors living alone in rental flats in Jalan Kukoh.
- The neighbourhood has real nearby facilities matching Kawan's map use case: Active Ageing Centre, RC, CatchPlus Centre, community club, social support, nearby supermarkets and clinics.
- The location is within Outram/Bukit Merah/River Valley area where public BFA coverage sources say OneMap BFA is available in selected nearby areas.

Important caveat:

- This is a demo/site-planning recommendation, not an official statement that a specific block has a quantified elderly concentration. Use official resident-level data only if a government/partner dataset is provided.

### 1.4 Resource Datapoints To Seed Next

Use these as the first real Jalan Kukoh fixture/D1 seed candidates.

| Resource | Category | Address | Phone | Source confidence | Notes |
|---|---|---:|---:|---|---|
| Chinatown Active Ageing Centre (Jalan Kukoh) | `senior_activity` | 8 Jalan Kukoh, #04-35, S162008 | 6732 1286 | High | Direct match for senior activity/resource discovery. |
| Jalan Kukoh RC | `rc_centre` | Blk 10 Jalan Kukoh, #04-61, S162010 | 6732 0060 | Medium | Useful for volunteer help/forms/community referral. Confirm with PA/RC before production. |
| CatchPlus Centre | `digital_form_help` | 10 Jalan Kukoh, #04-55, S162010 | TBD | Medium | Listed by Kreta Ayer-Kim Seng PA page. Confirm service scope before production. |
| Kreta Ayer Community Club | `digital_form_help` / agency link | 28A Kreta Ayer Road, S088995 | 6222 3597 | High | Good fallback for community support and adviser/session signposting. |
| Social Service Office @ Kreta Ayer | agency link, not `Resource` unless mapped | Kreta Ayer area | 1800 222 0000 | High | Keep as `AgencyContact` unless there is a walk-in location to map. |
| Chinatown Active Ageing Centre (Chin Swee) | `senior_activity` | 51 Chin Swee Road, #04-83, S160051 | 6533 3202 | High | Nearby secondary AAC. |
| Chinatown Active Ageing Centre (Banda) | `senior_activity` | 5 Banda Street, #03-68, S050005 | 6225 1490 | High | Nearby secondary AAC. |
| Transit Point @ Jalan Kukoh | agency/shelter link | Jalan Kukoh area | Use New Hope CS channels | High | Transitional shelter context; do not present as casual walk-in without referral. |

For map coordinates, use OneMap search as source of truth:

```text
https://www.onemap.gov.sg/api/common/elastic/search?searchVal=<address or postal>&returnGeom=Y&getAddrDetails=Y&pageNum=1
```

Store only WGS84 `latitude` / `longitude` canonically.

## 2. What Codex Needs To Do

### 2.1 Implemented In This Pass

- Added Worker CORS handling.
- Added Worker OneMap route client.
- Added Worker secret/env placement docs.
- Added handoff doc.
- Committed prior real-map slice.

### 2.2 Remaining Implementation Plan

1. Replace demo frontend fixtures with the real Jalan Kukoh resources above.
2. Mirror those resources in Worker fixtures, then later move to D1 when Dev B confirms schema ownership.
3. Add route-source UI copy:
   - Worker live OneMap route
   - Worker fixture fallback
   - OneMap walking fallback for wheelchair/BFA
4. Add stricter Worker validation:
   - reject invalid `category`, `language`, `mode`
   - return JSON errors with CORS headers
5. Add Worker route tests:
   - no OneMap env returns fixtures
   - OneMap error returns fixtures
   - valid mocked OneMap response maps into `RouteOption`
6. Add browser smoke test for:
   - map render
   - directory search
   - place details
   - directions
   - language switch
7. Update pitch/demo script with Jalan Kukoh scenario.

## 3. Handoffs

### From Dev A To Dev C

- Voice-to-map launch contract:
  - `sessionId`
  - `language`
  - optional `resourceId`
  - optional `query`
  - optional `category`
- Back-to-chat navigation target and expected persisted state.
- Final language list and whether `nan-Hant` remains the Hokkien display key.

### From Dev C To Dev A

- Map can accept voice context once URL/state handoff is agreed.
- Back-to-chat UI is already available when `fromChat` is true.
- Dev C needs Dev A to pass selected language into map shell.

### From Dev B To Dev C

- Confirm whether `/resources` and `/routes` remain Dev C Worker endpoints or become allowlisted tools in Dev B registry.
- Confirm D1 ownership and migration timing for `Resource`.
- Confirm receipt adapter payload shape.
- Confirm when to replace printable preview with real receipt/PDF flow.

### From Dev C To Dev B

Route print payload required:

```ts
type RoutePrintPayload = {
  destinationName: string;
  routeMode: "walk" | "wheelchair" | "drive";
  distanceMeters: number;
  durationMinutes: number;
  generatedAt: string;
  kioskLocation: string;
  steps: string[];
  disclaimerEnglish: string;
};
```

Disclaimer:

```text
This is a guide, not an official dispatch.
```

### From Dev D To Dev C

- Confirm the exact demo block and opening story.
- Confirm which seeded resources must be visible for judging.
- Confirm whether route failure should be scripted as a fallback moment or invisible to judges.

### From Dev C To Dev D

- Recommended story location: Jalan Kukoh void-deck kiosk.
- Best first route: kiosk to Chinatown AAC (Jalan Kukoh).
- Best demo actions:
  - search "forms"
  - select CatchPlus or RC
  - open wheelchair route to AAC
  - print directions
  - switch language to Mandarin/Malay/Tamil

## 4. Manual Testing Flow

### Flow A: Fixture Fallback

1. Remove or unset `NEXT_PUBLIC_WORKER_URL`.
2. Run frontend.
3. Confirm yellow notice: "Demo data shown. Worker connection is not active."
4. Search for a resource.
5. Confirm map markers and directory rows change together.

Look for:

- No blank map.
- No console runtime errors.
- Directory and pins stay in parity.

### Flow B: Worker Resources

1. Start Worker locally.
2. Set `NEXT_PUBLIC_WORKER_URL=http://127.0.0.1:8787`.
3. Restart frontend.
4. Open map.
5. Confirm no fixture warning if Worker responds.
6. Search/category filter.

Look for:

- `/resources` returns `{ resources: [...] }`.
- CORS errors do not appear.
- Empty searches do not crash the UI.

### Flow C: Routes Without OneMap Credentials

1. Do not set OneMap secrets.
2. Open directions.
3. Confirm the app still shows fixture route options.

Look for:

- Wheelchair/walk/drive tabs all work.
- Route line renders on map.
- Print preview still opens.

### Flow D: Routes With OneMap Credentials

1. Set Worker secrets:
   - `ONEMAP_ACCESS_TOKEN`, or
   - `ONEMAP_EMAIL` and `ONEMAP_PASSWORD`
2. Restart Worker.
3. Open directions for a resource.
4. Confirm provider label changes to OneMap route label.

Look for:

- Distance/time come from OneMap.
- Route steps are readable.
- If wheelchair uses `walk` fallback, copy must say BFA fallback.

### Flow E: Language Switching

1. Switch to Mandarin, Hokkien, Malay, Tamil.
2. Open details.
3. Open directions.
4. Open print preview.

Look for:

- No mojibake.
- English fallback appears where translations are missing.
- Buttons remain readable and do not overflow.

## 5. Sources

- OneMap basemap docs: https://www.onemap.gov.sg/docs/maps/
- OneMap API docs entrypoint: https://www.onemap.gov.sg/apidocs/
- OneMap API endpoint context: https://dlthub.com/context/source/one-map-singapore
- OneMap BFA coverage/product context: https://geospatial.sla.gov.sg/geospatial-for-good/social-sector-use-cases/
- Chinatown/Kreta Ayer facility listings: https://kretaayer-kimseng.pa.gov.sg/about-kreta-ayer-kim-seng/
- Kreta Ayer support resources: https://kretaayer-kimseng.pa.gov.sg/support-resources/
- Chinatown AAC/Jalan Kukoh listing: https://street-directory.com/aic_site_prm/routing.php?buildingname1=&company=Chinatown+Active+Ageing+Centre+%28Jalan+Kukoh%29&postalcode=162008&tel=67321286+&unitno=%2304-35
- Jalan Kukoh rental-flat reporting: https://www.ricemedia.co/current-affairs-features-jalan-kukoh-overcrowding-singapore-rental-housing/
- SportCares Jalan Kukoh senior outreach: https://sportcares.sportsingapore.gov.sg/media/stories/koc2022/
- Transit Point @ Jalan Kukoh: https://www.newhopecs.org.sg/tp-jk
