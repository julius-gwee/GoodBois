# Care Access Map PRD and Product Backlog

## 1. Product Summary

**Working name:** Care Access Map

**Hackathon problem statement:** PS2 - "How might we reduce manual and time-consuming tasks within the eldercare ecosystem so that more seniors are well-supported?"

**One-line pitch:** Care Access Map is a verified neighbourhood accessibility and care-asset map that helps caregivers, seniors, wheelchair users, and frontline staff find usable nearby support without calling around or relying on outdated word-of-mouth.

**Core idea:** Singapore already has many eldercare and accessibility assets, but they are fragmented, unevenly documented, and often invisible at the moment caregivers need them. Care Access Map creates a maintainable local layer of practical access knowledge: accessible toilets, drop-off points, equipment loan/rental, form-filling help, digital assistance, caregiver waiting spots, and care-related community resources.

This is not a generic map. It is a caregiver and eldercare operations map maintained by NGOs, SACs, RCs, volunteers, and community partners.

## 2. Problem

Caregivers and frontline workers repeatedly spend time finding basic operational information:

- Where can a wheelchair user safely alight?
- Which entrance has a ramp or lift?
- Where is the nearest accessible restroom that actually works?
- Where can someone borrow or rent a wheelchair, walking frame, commode, or hospital bed?
- Where can an elderly person get help with QR codes, Singpass, form filling, vouchers, or appointment booking?
- Where can a caregiver safely wait while the senior attends SAC, clinic, or community activities?

This information often exists, but it is scattered across websites, mall pages, WhatsApp chats, staff memory, outdated PDFs, posters, and word-of-mouth. The result is repeated phone calls, failed trips, caregiver stress, duplicated staff work, and seniors being less supported than they could be.

## 3. Grounded Insights

The product is based on themes from the REACH engagement notes and hackathon research:

- Caregivers face "a lot of taps" when moving a bedridden or wheelchair-bound senior out and back for appointments.
- Wheelchair transport, enabling services, and adjacent support can feel confusing or unreliable.
- Digital and physical systems often assume the senior can self-authenticate, scan QR codes, travel, collect vouchers, or use Singpass.
- Caregivers lose meaningful time with loved ones to form filling, appointment admin, and service navigation.
- Some caregivers want nearby, practical, "digital kampong" support within a few blocks.
- Caregivers may need support while waiting at SACs, RCs, clinics, or community locations.

## 4. Target Users

### Primary Users

**Family caregivers**

- Adult children caring for elderly parents.
- Caregivers supporting wheelchair users, seniors with mobility limits, or PWDs.
- Caregivers who need practical help before, during, or after outings and appointments.

**Frontline community staff and volunteers**

- Staff at NGOs, SACs, RCs, FSCs, community partners, and grassroots groups.
- Volunteers helping residents find local support.
- Citizen builders or community mappers verifying local assets.

### Secondary Users

**Seniors and PWDs**

- Users who may directly search for accessible amenities if digitally able.

**Transport providers and escorts**

- Wheelchair taxi operators, medical escorts, volunteer drivers, or family drivers who need accurate accessible pickup/drop-off information.

**Venue operators**

- Malls, clinics, CCs, SACs, libraries, and community spaces that want to publish reliable accessibility and caregiver information.

## 5. User Personas

### Persona A: Mei, Family Caregiver

Mei cares for her father, who uses a wheelchair after a stroke. She has to bring him to a hospital appointment and also help him with a voucher/form issue. Her pain is not finding the hospital on a map. Her pain is knowing where to alight, where the accessible toilet is, how to avoid stairs, and where to get help if something goes wrong.

### Persona B: Ravi, Community Volunteer

Ravi volunteers at an RC. Residents often ask him where to borrow wheelchairs, where to get form help, or which nearby mall has usable accessible toilets. He currently relies on memory and WhatsApp messages. He needs a shared, verified list that other volunteers can maintain.

### Persona C: Aisha, NGO Programme Staff

Aisha helps caregivers navigate services. She spends time answering repeated questions and maintaining ad hoc resource lists. She needs a way to see local assets, know what is verified, and assign volunteers to recheck outdated entries.

## 6. Product Goals

1. Reduce repeated manual search and phone calls for caregiver-relevant resources.
2. Make practical accessibility information visible and trustworthy.
3. Help community organisations maintain local knowledge without relying on one staff member's memory.
4. Support safer and less stressful wheelchair-related outings.
5. Give caregivers and frontline workers fast, actionable information at the point of need.

## 7. Non-Goals

The MVP will not:

- Replace Google Maps, OneMap, or official transport planning tools.
- Provide real-time restroom occupancy.
- Provide direct transport booking, payments, voucher redemption, or formal API-level transport provider integration.
- Guarantee nationwide accessibility accuracy.
- Provide clinical, legal, or emergency advice.
- Handle formal case management.
- Process payments, bookings, vouchers, or government applications.
- Directly dispatch government agencies or maintenance teams.
- Provide live AR navigation or official street-level safety certification.
- Claim official endorsement from venues or agencies unless provided.

## 8. Core Value Proposition

For caregivers:

> "I can quickly find practical, verified access help near me instead of calling around or discovering barriers only after reaching the location."

For NGOs and community partners:

> "We can maintain and share local care-access knowledge as an operational asset, instead of keeping it in staff memory, posters, and WhatsApp threads."

For volunteers:

> "I know what needs verification, how to check it, and how to contribute useful local knowledge safely."

## 9. MVP Scope

The hackathon MVP should focus on one neighbourhood or simulated district, with enough realistic data to demonstrate the workflow.

### MVP Resource Types

1. Accessible restrooms
2. Accessible pickup/drop-off points
3. Equipment loan/rental points
4. Form-filling and digital help points
5. Caregiver waiting spots

### MVP User Modes

1. **Caregiver search mode**
   - Search nearby resources.
   - Filter by need.
   - View accessibility details and verification status.
   - Plan an accessible route using practical route notes.
   - Share route, pickup, and safety information with family members or drivers.

2. **Volunteer contribution mode**
   - Submit a new resource.
   - Upload notes/photos.
   - Mark issues, hazards, or maintenance problems.

3. **NGO admin mode**
   - Review pending submissions.
   - Approve/reject updates.
   - See resources needing re-verification.
   - Export hazard and maintenance reports in a structured format for later routing to relevant agencies or venue operators.

4. **Elderly simplified mode**
   - Use larger touch targets, clearer text, and fewer visible controls.
   - Support voice search and spoken guidance prompts.
   - Prioritise immediate needs such as toilet, pickup point, help desk, and safe route.

### MVP Map Approach

The MVP should use OneMap-compatible coordinates and Singapore location data as the geospatial foundation, but present the experience through a custom elderly-friendly interface.

- Store all resources using latitude and longitude so data can work across OneMap, Google Maps, or other web map providers later.
- Use OneMap search/geocoding/routing where suitable for Singapore-specific address accuracy.
- Render a simplified care-access overlay with large category icons, plain-language labels, route notes, confidence status, and hazard warnings.
- Avoid making users rely only on the base map visual; every map result must also appear in list/detail format.
- Keep map provider choice replaceable so the product can start with OneMap-compatible data and later test Google Maps or another map renderer without rewriting the resource model.

## 10. Key User Stories

### Caregiver Search

- As a caregiver, I want to search for accessible restrooms near a destination so that I can plan a safer outing.
- As a caregiver, I want to know the exact accessible drop-off point so that I do not arrive at the wrong entrance.
- As a caregiver, I want to filter by "open now" so that I do not go to a closed help point.
- As a caregiver, I want to see the last verified date so that I can judge whether the information is trustworthy.
- As a caregiver, I want practical notes like "nearest lift is beside entrance B" so that I can act without guessing.
- As a caregiver, I want a clearer elderly-friendly map UI so that I do not have to interpret a cluttered government map.
- As a caregiver, I want to use voice search and spoken prompts so that I can search hands-free while supporting a senior.
- As a caregiver, I want to open a planned pickup/drop-off in Grab so that I can hand off the journey without retyping addresses.
- As a caregiver of a senior with dementia, I want an opt-in safety ping if the senior deviates from the suggested route so that I can check in quickly.

### Senior Direct Use

- As a senior, I want a simplified mode with larger buttons and fewer choices so that I can find key help without navigating complex filters.
- As a senior, I want to search by speaking so that I do not need to type long addresses or resource names.

### Community Volunteer

- As a volunteer, I want to add a newly discovered resource so that other caregivers can benefit.
- As a volunteer, I want a verification checklist so that I know what details matter.
- As a volunteer, I want to report that an entry is wrong or outdated so that inaccurate information is not left unchallenged.
- As a volunteer, I want to report a maintenance issue or hazard, such as a blocked ramp, lift breakdown, unsafe crossing, or construction obstruction, so that future users can avoid it.

### NGO Admin

- As an NGO admin, I want to review submissions before they go live so that the map stays credible.
- As an NGO admin, I want to see entries older than a set threshold so that volunteers can recheck them.
- As an NGO admin, I want to export or share a neighbourhood resource list so that staff and residents can use it offline.
- As an NGO admin, I want to export hazard and maintenance reports in a structured format so that they can later be sent to the relevant agency, town council, venue operator, or community partner.

## 11. Functional Requirements

### FR1: Map and List View

- Display resource markers on a map.
- Use OneMap-compatible latitude/longitude coordinates as the canonical location format.
- Present the map through a custom elderly-friendly UI layer with larger markers, clearer category icons, simplified labels, and high-contrast route overlays.
- Provide a list view for users who prefer scanning text.
- Let users switch between map and list.
- Show basic marker categories with distinct icons or colours.

### FR2: Search and Filters

Users must be able to filter by:

- Resource type
- Wheelchair accessible
- Open now
- Verified only
- Distance
- Language support
- Free/paid, where relevant
- Hazard or maintenance status

### FR2A: Voice Search and Guidance

- Users can tap a microphone button to search by voice.
- Voice search should support common phrases such as "nearest accessible toilet", "wheelchair pickup point", "help with forms", and destination names.
- Search results must remain editable as text after transcription.
- The app should provide short spoken guidance prompts for selected routes or resource details.
- All voice features must have non-voice fallbacks for users, devices, or browsers where speech support is unreliable.

### FR2B: Elderly and Caregiver UI Modes

- Users can switch between elderly mode and caregiver mode.
- Elderly mode should show larger touch targets, fewer filters, clearer action buttons, and immediate need categories.
- Caregiver mode should expose planning details, verification status, filters, sharing, Grab handoff, and safety ping setup.
- The selected mode should persist for the session or user profile where accounts exist.

### FR3: Resource Detail Page

Each resource must show:

- Name
- Category
- Address
- Opening hours
- Contact details, if available
- Accessibility notes
- Photos, if available
- Last verified date
- Verified by role or organisation, not necessarily individual name
- Confidence status: verified, community submitted, needs recheck
- Report issue button

### FR4: Accessible Restroom Details

Accessible restroom entries should support:

- Floor or unit location
- Nearest lift/escalator/entrance
- Whether caregiver can enter with user
- Door/space notes, where known
- Adult changing bench, if available
- Cleanliness/safety notes
- Photo proof, if available

### FR5: Pickup/Drop-Off Details

Pickup/drop-off entries should support:

- Exact location description
- Whether sheltered
- Ramp/lift route from drop-off
- Whether wheelchair taxi can stop safely
- Nearby waiting area
- Known obstacles
- Photo proof, if available

### FR6: Equipment Loan/Rental Details

Equipment entries should support:

- Equipment types available
- Loan/rental terms
- Deposit/cost
- Eligibility requirements
- Contact method
- Collection/delivery notes

### FR7: Form-Filling and Digital Help Details

Help point entries should support:

- Types of help available
- Languages supported
- Walk-in vs appointment
- Opening hours
- Documents commonly required
- Whether staff can help with Singpass, QR codes, vouchers, forms, appointment booking, or subsidy navigation

### FR8: Caregiver Waiting Spot Details

Waiting spot entries should support:

- Seating availability
- Quietness level
- Nearby accessible toilet
- Charging point availability
- Food/drink nearby
- Caregiver support activity availability
- Suitability while senior attends SAC/clinic/community activity

### FR9: Submission Workflow

- Users can submit a new resource.
- Users can suggest edits to an existing resource.
- Users can report an issue.
- Users can report hazards and maintenance problems affecting access routes or resources.
- Submissions enter pending status before being approved.

### FR9A: Hazard and Maintenance Reporting

Hazard reports should support:

- Hazard type: blocked ramp, lift outage, toilet closed, construction, unsafe crossing, poor lighting, obstacle, route inaccessible, other.
- Severity: info, caution, avoid, urgent review.
- Affected resource or route segment.
- Location coordinates and plain-language location description.
- Photo evidence, if available.
- Reported time and optional expected end date.
- Verification status and admin review status.
- Public display rules so unverified reports are clearly labelled and do not overclaim certainty.

### FR10: Verification Workflow

- Admins can approve, reject, or request recheck.
- Entries have verification status.
- Entries become "needs recheck" after a configurable period.
- Volunteers can be assigned or prompted to verify entries.
- Admins can mark a hazard report as active, resolved, duplicate, rejected, or needs recheck.
- Active hazards can downgrade the confidence of affected resources or routes.

### FR11: Shareable Resource Cards

- Users can share a resource as a concise WhatsApp-friendly card.
- Shared card should include name, address, access notes, verification date, and link.

### FR12: Offline/Low-Tech and Report Export

- Admins can export a filtered list as PDF or printable page.
- This supports seniors or caregivers who do not use apps comfortably.
- Admins can export hazard and maintenance reports as CSV or JSON with coordinates, category, severity, evidence links, and status.
- Exported reports should be structured so future integrations can route them to town councils, venue operators, government agencies, or other maintenance partners.

### FR13: Grab Deep-Link Handoff

- Users can open a route or pickup/drop-off point in Grab where supported by device/app deep links.
- If deep linking is unavailable, the app should copy a formatted pickup/drop-off message with address, coordinates, entrance note, and accessibility instructions.
- The MVP must not process bookings, payments, vouchers, or driver allocation inside Care Access Map.

### FR14: Opt-In Route Deviation Safety Ping

- Caregivers can create an opt-in route safety session for a senior or care recipient.
- The app can compare current location against the suggested route corridor during the active session.
- If the user deviates beyond a configurable threshold, the caregiver receives a safety ping or demo notification.
- The feature must clearly explain consent, purpose, duration, and who receives alerts.
- Location tracking should stop when the route session ends.
- The MVP can simulate notifications for hackathon demo purposes if live messaging is not available.

## 12. Non-Functional Requirements

### Accessibility

- Mobile-first responsive design.
- Large text option or readable default font size.
- High contrast.
- Clear icons with labels.
- Keyboard-accessible controls.
- Screen-reader-friendly labels.
- Avoid map-only interaction; provide list view.

### Trust and Safety

- Show verification status clearly.
- Do not hide uncertainty.
- Encourage users to call ahead for critical resources.
- Provide report issue flow.
- Keep contributor identity private unless they opt into organisational attribution.
- Clearly label unverified hazards and avoid presenting community reports as official closures.
- Safety pings are assistive check-in alerts, not emergency response or clinical monitoring.

### Privacy

- Do not collect senior medical details in the MVP.
- Do not require caregiver identity for browsing.
- Contributor accounts can be role-based or simulated for hackathon.
- Photos should not include identifiable people unless consent is handled.
- Route deviation safety pings require explicit opt-in consent, a visible active-session state, and a clear end-session control.
- Store only the minimum location data needed for the active safety session; avoid retaining route traces unless required for a demo and clearly labelled.

### Performance

- Map and list should load quickly on mobile.
- MVP can use mocked/static data if live backend is not ready.

### Maintainability

- Data model should support adding new resource categories later.
- Verification status should be first-class, not a note field.
- Resource attributes should be structured enough for filtering.
- Map provider dependencies should be isolated so OneMap, Google Maps, or another renderer can be swapped without changing core resource data.
- Hazard report exports should use stable field names so future agency or partner integrations can consume them.

## 13. Data Model

### Resource

- id
- name
- category
- description
- address
- latitude
- longitude
- openingHours
- contactPhone
- contactUrl
- costType
- languages
- accessibilityFeatures
- practicalNotes
- photos
- verificationStatus
- lastVerifiedAt
- verifiedByRole
- confidenceLevel
- source
- mapProviderReference
- routeNotes
- currentHazardStatus
- createdAt
- updatedAt

### Category-Specific Details

**Accessible Restroom**

- floor
- nearestLift
- caregiverEntryPossible
- adultChangingBench
- doorSpaceNotes
- cleanlinessNotes

**Pickup/Drop-Off**

- sheltered
- vehicleTypeSupported
- routeToEntrance
- wheelchairTaxiSuitable
- waitingAreaNotes
- obstacleNotes

**Equipment**

- equipmentTypes
- availabilityStatus
- deposit
- rentalCost
- eligibility
- collectionInstructions

**Digital/Form Help**

- helpTypes
- appointmentRequired
- documentsNeeded
- singpassHelpAvailable
- voucherHelpAvailable

**Waiting Spot**

- seating
- quietness
- chargingAvailable
- foodNearby
- supportActivityAvailable

### Submission

- id
- resourceId, optional
- submissionType: new, edit, issue
- submittedByRole
- submittedAt
- status: pending, approved, rejected, needsInfo
- proposedChanges
- photos
- reviewerNotes

### HazardReport

- id
- resourceId, optional
- routeSegmentId, optional
- hazardType
- severity
- description
- latitude
- longitude
- locationDescription
- photos
- reportedByRole
- reportedAt
- expectedEndAt, optional
- status: pending, active, resolved, duplicate, rejected, needsRecheck
- reviewedByRole
- reviewedAt
- exportStatus

### RouteSafetySession

- id
- seniorAlias
- caregiverContact
- startLatitude
- startLongitude
- destinationLatitude
- destinationLongitude
- suggestedRoutePolyline
- allowedDeviationMeters
- startedAt
- endedAt
- status: active, completed, cancelled
- lastKnownLatitude
- lastKnownLongitude
- lastPingAt
- consentConfirmed

## 14. MVP Demo Scenario

### Scenario: Hospital Visit With Wheelchair-Bound Father

Mei needs to bring her wheelchair-bound father to a hospital appointment and handle a form/voucher issue after the visit.

1. Mei searches for the hospital or nearby destination.
2. The app shows the result on a simplified elderly-friendly map using OneMap-compatible coordinates and a custom care-access overlay.
3. The app shows the recommended accessible drop-off point with photo and notes.
4. Mei views the route note from drop-off to lift/entrance and sees an active warning that one ramp nearby is blocked.
5. Mei filters for accessible restrooms nearby and sees one verified last month.
6. Mei finds a nearby form-filling or digital help point that supports Singpass/voucher help.
7. Mei opens the pickup/drop-off point in Grab or copies a formatted pickup note for the driver.
8. Mei starts an opt-in route safety session for her father so she receives a ping if he deviates from the suggested route.
9. In volunteer mode, Ravi submits an update about a blocked ramp.
10. In admin mode, Aisha reviews the report, marks the affected route as "avoid", and exports the hazard report as CSV/JSON for future routing to the relevant maintenance owner.

### Demo Message

> "We are not building another generic map. We are building a maintainable care-access layer for the neighbourhood: the practical details caregivers and frontline staff need, verified by the community, so seniors can actually use the support around them."

## 15. Success Metrics

### Hackathon Demo Metrics

- Time to find accessible drop-off point.
- Time to find verified accessible restroom.
- Time to generate shareable resource card.
- Time to report and admin-review a hazard.
- Time to export a structured hazard report.
- Time to switch between elderly and caregiver modes.
- Number of resource types demonstrated.
- Number of verification states demonstrated.

### Real-World Pilot Metrics

- Number of verified resources per neighbourhood.
- Percentage of resources reverified within target interval.
- Number of caregiver/staff searches.
- Reduction in repeated staff queries for common resources.
- Number of issue reports resolved.
- Caregiver/staff satisfaction after using resource information.
- Number of successful referrals or completed trips supported.

## 16. Risks and Mitigations

### Risk: Data Becomes Outdated

Mitigation:

- Verification status and date visible everywhere.
- Automatic "needs recheck" status after threshold.
- Volunteer recheck workflow.
- Report issue button.
- Hazard and maintenance reports can temporarily lower route/resource confidence until reviewed.

### Risk: Incorrect Accessibility Information Causes Failed Trip

Mitigation:

- Show uncertainty clearly.
- Encourage call-ahead for critical trips.
- Require photos for high-confidence verification.
- Keep notes practical and specific.

### Risk: Too Broad to Maintain

Mitigation:

- Start with one neighbourhood and five resource types.
- Prioritise wheelchair journey resources first.
- Add categories only when a partner can maintain them.

### Risk: Duplicates Existing Maps

Mitigation:

- Position as a caregiver-specific operational layer, not general navigation.
- Include verification, practical notes, and NGO maintenance workflow.
- Integrate or reference official resources where possible in later versions.

### Risk: Privacy Issues From Photos

Mitigation:

- Guide contributors to avoid faces and personal data.
- Admin review before publishing.
- Remove photos that expose identifiable people.

### Risk: Route Deviation Safety Ping Feels Like Surveillance

Mitigation:

- Make route safety sessions opt-in, time-bound, and visible.
- Explain who receives pings before the session starts.
- Stop location tracking when the route session ends.
- Use minimum necessary location data and avoid storing full route traces in the MVP.

### Risk: Hazard Reports Are Mistaken for Official Agency Data

Mitigation:

- Label community reports separately from verified or official reports.
- Require admin review before a hazard strongly affects public route recommendations.
- Export structured reports for agencies or venue operators, but do not claim that export means official dispatch or resolution.

### Risk: NPOs Lack Capacity to Maintain

Mitigation:

- Use volunteers/citizen builders for mapping tasks.
- Keep verification checklists simple.
- Provide printable outputs so value is not limited to digital usage.

## 17. Product Backlog

Priority labels:

- **P0:** Required for hackathon MVP.
- **P1:** Strong if time allows.
- **P2:** Future pilot.
- **P3:** Long-term expansion.

### Epic 1: Caregiver Discovery Experience

| ID | Priority | User Story | Acceptance Criteria |
| --- | --- | --- | --- |
| E1-01 | P0 | As a caregiver, I can view resources on a custom elderly-friendly map. | Map loads with large category markers, high-contrast labels, and seeded resources using OneMap-compatible coordinates. |
| E1-02 | P0 | As a caregiver, I can switch to list view. | List shows same filtered resources as the map. |
| E1-03 | P0 | As a caregiver, I can filter resources by category. | Selecting a category updates map and list. |
| E1-04 | P0 | As a caregiver, I can view resource details. | Detail page shows address, notes, category, verification status, and last verified date. |
| E1-05 | P0 | As a caregiver, I can filter to verified resources only. | Unverified resources are hidden when filter is active. |
| E1-06 | P0 | As a caregiver, I can search by destination or postal code. | Search recentres map and returns relevant nearby assets. |
| E1-07 | P1 | As a caregiver, I can filter by open now. | Resources outside opening hours are hidden or labelled closed. |
| E1-08 | P1 | As a caregiver, I can share a resource card. | WhatsApp-friendly text is generated with access notes and verification date. |
| E1-09 | P0 | As a caregiver, I can open a pickup/drop-off point in Grab or copy driver instructions. | App provides a Grab handoff where supported and a copyable fallback with address, coordinates, entrance note, and accessibility instructions. |
| E1-10 | P0 | As a caregiver, I can use voice search and spoken guidance. | Microphone search supports key resource phrases; transcribed search remains editable; spoken route/resource prompts have text fallback. |

### Epic 1A: User Mode Switching

| ID | Priority | User Story | Acceptance Criteria |
| --- | --- | --- | --- |
| E1A-01 | P0 | As a senior, I can switch to elderly mode. | Elderly mode shows larger controls, fewer filters, immediate need buttons, and clearer text. |
| E1A-02 | P0 | As a caregiver, I can switch to caregiver mode. | Caregiver mode exposes planning details, verification, filters, share, Grab handoff, and safety setup. |
| E1A-03 | P1 | As a returning user, my selected mode is remembered. | Mode persists for the current session or account. |

### Epic 2: Resource Detail Quality

| ID | Priority | User Story | Acceptance Criteria |
| --- | --- | --- | --- |
| E2-01 | P0 | As a caregiver, I can see exact accessible restroom details. | Restroom detail includes floor, nearest lift, notes, and verification status. |
| E2-02 | P0 | As a caregiver, I can see accessible pickup/drop-off details. | Detail includes sheltered status, route note, and wheelchair taxi suitability. |
| E2-03 | P0 | As a caregiver, I can see equipment loan/rental details. | Detail includes equipment types, terms, cost/deposit, and contact. |
| E2-04 | P0 | As a caregiver, I can see form/digital help details. | Detail includes help types, languages, walk-in/appointment, and documents needed. |
| E2-05 | P1 | As a caregiver, I can view photos for confidence. | Detail supports at least one photo per resource. |
| E2-06 | P1 | As a caregiver, I can see caregiver waiting spot features. | Detail includes seating, quietness, charging, toilet, and support activity notes. |

### Epic 3: Community Submission

| ID | Priority | User Story | Acceptance Criteria |
| --- | --- | --- | --- |
| E3-01 | P0 | As a volunteer, I can submit a new resource. | Submission form captures category, location, notes, and verification evidence. |
| E3-02 | P0 | As a user, I can report an issue with an entry. | Issue report creates pending submission linked to resource. |
| E3-03 | P0 | As a volunteer, I can report a hazard or maintenance issue. | Report captures type, severity, location, affected resource/route, description, and optional photo. |
| E3-04 | P1 | As a volunteer, I can suggest edits to existing resources. | Proposed changes are stored for admin review. |
| E3-05 | P1 | As a volunteer, I can follow a verification checklist. | Checklist fields change based on resource category. |
| E3-06 | P2 | As a volunteer, I can claim a recheck task. | Task status changes to assigned and records volunteer role. |

### Epic 4: NGO Admin and Verification

| ID | Priority | User Story | Acceptance Criteria |
| --- | --- | --- | --- |
| E4-01 | P0 | As an admin, I can see pending submissions. | Admin page lists pending new resources and issue reports. |
| E4-02 | P0 | As an admin, I can approve or reject submissions. | Approved submissions update the public resource list; rejected submissions are hidden. |
| E4-03 | P0 | As an admin, I can mark a resource as needs recheck. | Resource status changes and is visible to users. |
| E4-04 | P0 | As an admin, I can review hazard and maintenance reports. | Admin can mark reports active, resolved, duplicate, rejected, or needs recheck. |
| E4-05 | P0 | As an admin, I can export hazard and maintenance reports. | CSV/JSON export includes coordinates, affected resource/route, type, severity, evidence, status, and timestamps. |
| E4-06 | P1 | As an admin, I can edit a resource directly. | Admin can update details and verification fields. |
| E4-07 | P1 | As an admin, I can view resources sorted by last verified date. | Oldest resources appear first. |
| E4-08 | P2 | As an admin, I can assign verification tasks to volunteers. | Task has resource, due date, and assignee role. |

### Epic 5: Printable and Shareable Outputs

| ID | Priority | User Story | Acceptance Criteria |
| --- | --- | --- | --- |
| E5-01 | P1 | As a caregiver, I can copy a WhatsApp-ready resource summary. | Summary includes resource name, access notes, address, and verification date. |
| E5-02 | P1 | As an NGO staff member, I can print a resource list. | Printable view shows selected resources in readable format. |
| E5-03 | P2 | As an NGO staff member, I can export filtered resources as PDF. | Export contains selected categories and verification dates. |
| E5-04 | P0 | As a caregiver, I can share or copy route and pickup details. | Shared text includes destination, pickup/drop-off note, accessible route note, hazards, and verification date. |

### Epic 6: Accessibility and Inclusion

| ID | Priority | User Story | Acceptance Criteria |
| --- | --- | --- | --- |
| E6-01 | P0 | As a user, I can use the product on mobile. | Layout works on phone width and key actions are reachable. |
| E6-02 | P0 | As a user, I can read resource details without relying only on map markers. | List and detail pages expose all key information. |
| E6-03 | P0 | As a low-vision user, I can read text comfortably. | Text contrast and sizing meet basic accessibility expectations. |
| E6-04 | P0 | As a screen-reader user, I can identify buttons and categories. | Controls have labels and semantic roles. |
| E6-05 | P0 | As a user who cannot or does not want to type, I can use voice search with fallback controls. | Voice search is available where supported, and all actions remain possible through touch/text controls. |

### Epic 7: Data Seeding and Demo Content

| ID | Priority | User Story | Acceptance Criteria |
| --- | --- | --- | --- |
| E7-01 | P0 | As a demo user, I can explore a realistic sample neighbourhood. | Seed data includes at least 20 resources across categories. |
| E7-02 | P0 | As a judge, I can see verified, submitted, and needs-recheck states. | Seed data includes examples of each status. |
| E7-03 | P0 | As a judge, I can follow the hospital visit scenario end to end. | Seed data supports accessible drop-off, restroom, and form-help journey. |
| E7-04 | P1 | As a judge, I can see before/after workflow comparison. | Demo includes manual-search pain and map-assisted result. |

### Epic 8: Opt-In Route Safety

| ID | Priority | User Story | Acceptance Criteria |
| --- | --- | --- | --- |
| E8-01 | P0 | As a caregiver, I can start a route safety session. | Caregiver can set destination, route, contact, consent confirmation, and active session duration. |
| E8-02 | P0 | As a caregiver, I receive a ping when the senior deviates from the suggested route. | Demo notification or live alert triggers when simulated/current location exceeds the route deviation threshold. |
| E8-03 | P0 | As a senior or caregiver, I can clearly end location sharing. | End-session control stops tracking and updates session status. |

## 18. Hackathon Build Breakdown

### Must Build

1. Mobile-first custom elderly-friendly map and list interface using OneMap-compatible coordinates.
2. Seeded resource data for one realistic neighbourhood or care journey.
3. Resource detail pages with practical accessibility notes.
4. Filters by resource type and verification status.
5. Submission/report issue form.
6. Hazard and maintenance reporting with admin review and structured CSV/JSON export.
7. Admin review screen with approve/reject/needs-recheck/active/resolved states.
8. Shareable resource and route card output.
9. Elderly/caregiver UI mode switch.
10. Voice search and basic spoken guidance with non-voice fallback.
11. Grab deep-link or copyable pickup/drop-off handoff.
12. Opt-in route deviation safety ping demo.

### Should Build

1. Category-specific verification checklist.
2. Printable resource list.
3. Photo support using seeded images or placeholders.
4. Open-now filter.
5. Caregiver journey demo mode.
6. Session-based persistence for selected UI mode.

### Could Build

1. Volunteer recheck task queue.
2. Multi-language labels.
3. PDF export.
4. Partner/venue profile pages.
5. More advanced voice command phrases.
6. Live notification channel for safety pings instead of simulated/demo notifications.

### Do Not Build During Hackathon

1. Direct Grab booking, payments, voucher redemption, or driver allocation.
2. Formal Grab API integration or commercial partnership flow.
3. Government dispatch or work-order integration.
4. Google Street View live AR directions.
5. Live restroom occupancy.
6. Real-time equipment availability.
7. Government authentication flows.
8. Nationwide map coverage.
9. Clinical, emergency, or medical monitoring advice.

## 19. Suggested Demo Data

Minimum 20 resources:

- 5 accessible restrooms
- 4 accessible pickup/drop-off points
- 4 equipment loan/rental points
- 4 form-filling/digital help points
- 3 caregiver waiting spots

Each should include:

- 1 practical note
- verification status
- last verified date
- category-specific detail

Include at least:

- 12 verified resources
- 5 community-submitted resources
- 3 needs-recheck resources
- 2 reported issues
- 4 hazard or maintenance reports across different statuses
- 2 sample accessible routes with route notes and one avoid warning
- 1 simulated route deviation safety ping scenario
- 1 Grab handoff example with copyable pickup/drop-off instructions

## 20. Pitch Structure

### Opening

"Caregivers and frontline staff do not just need more services. They need to find the practical access points that already exist: the correct wheelchair drop-off, the usable accessible restroom, the place to borrow equipment, the desk that helps with forms. Today this knowledge lives in staff memory, WhatsApp chats, and outdated lists."

### Problem

"Every failed search becomes another phone call, another delayed appointment, another stressful trip, and more duplicated work across the eldercare ecosystem."

### Solution

"Care Access Map is a verified neighbourhood care-access layer maintained by NGOs, volunteers, and community partners, with a clearer elderly-friendly map, voice search, hazard reporting, and caregiver safety tools."

### Why Now

"Singapore has a growing ageing population and many community resources, but resource discovery and accessibility details remain fragmented. The ecosystem needs maintainable local knowledge, not another generic directory."

### Impact

"We reduce manual search and coordination tasks so caregivers and frontline staff can spend less time finding help and more time supporting seniors."

## 21. Future Extensions

These features are intentionally left outside the hackathon MVP, but the MVP data model and workflows should make them easier to add later.

### Government and Maintenance Dispatch

- Route exported hazard and maintenance reports to relevant agencies, town councils, venue operators, or facilities teams.
- Support status sync from external maintenance systems so a report can move from submitted to acknowledged, in progress, and resolved.
- Add escalation rules for repeated reports or high-severity hazards.

### Grab and Transport Partnerships

- Move from simple Grab deep-link/copy handoff to formal collaboration with Grab or other transport providers.
- Support API-level ride handoff, accessible vehicle options, caregiver ride notes, and status updates where partnerships allow.
- Explore transport vouchers, subsidy eligibility prompts, or sponsored rides for eligible seniors.

### Street View, AR, and Route Preview

- Add Google Street View or equivalent route preview for caregivers to inspect entrances, crossings, and pickup points before a trip.
- Explore AR-style guidance only after safety testing, because elderly users should not be encouraged to walk while focusing on a phone camera.
- Use AR as a caregiver planning or escort aid before considering senior direct-use navigation.

### Official Map and Routing Integrations

- Test whether verified hazard exports can feed official or partner routing systems.
- Explore Waze for Cities-style data exchange only with eligible public-sector or infrastructure partners.
- Add provider-specific adapters while keeping the Care Access Map resource and hazard model provider-neutral.

## 22. Open Questions

1. Which neighbourhood or care journey should be used for the demo?
2. Which organisation persona should own verification: NGO, SAC, RC, or volunteer network?
3. Should the MVP focus more on wheelchair journeys or broader caregiver assets?
4. Should multilingual support be included in the first demo or left as future work?
5. What official datasets, if any, can be safely referenced without overpromising integration?
6. What is the safest consent flow for route deviation safety pings in a hackathon demo?
7. Which export format should be prioritised first for hazard reports: CSV for staff review, JSON for system integration, or both?

## 23. Recommended MVP Positioning

For the hackathon, position the product as:

> A community-maintained operational map for eldercare access, starting with wheelchair-friendly journeys, hazard-aware route notes, voice-enabled search, caregiver handoff, and opt-in safety pings.

Do not position it as:

- "Google Maps for elderly people."
- "Grab for wheelchair users."
- "Live government maintenance dispatch."
- "Live mall accessibility infrastructure."
- "All-in-one caregiver superapp."
- "AR navigation for seniors."

The strength is not the map itself. The strength is verified, practical, caregiver-specific local knowledge that the eldercare ecosystem can maintain.
