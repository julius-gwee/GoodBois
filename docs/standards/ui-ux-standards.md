# UI and UX Standards

## Design Direction

Care Access Map should feel like a practical care operations tool, not a marketing page or generic map clone. It should be calm, readable, and quick for tired caregivers and older users.

## Global UI Rules

- Mobile-first.
- Large default text.
- High contrast.
- Clear icon plus label for critical actions.
- No map-only workflows.
- Keep controls stable. Filters, buttons, and cards should not jump when content changes.
- Avoid dense tiny map labels. Put important details in list/detail panels.
- Use plain language: "Pickup point", "Accessible toilet", "Help desk", "Blocked ramp".

## Elderly Mode

Elderly mode should:

- Show 3-5 primary actions at a time.
- Use larger touch targets, at least 44px high.
- Prefer immediate need buttons over complex filters:
  - Toilet
  - Pickup point
  - Help desk
  - Safe route
  - Call/share
- Use short labels.
- Avoid hidden gestures.
- Keep confirmation screens simple.

Elderly mode should not:

- Hide verification status.
- Remove all fallback controls for voice.
- Encourage walking while staring at the phone.

## Caregiver Mode

Caregiver mode should:

- Show filters, verification, practical route notes, sharing, Grab handoff, and safety ping setup.
- Support planning before a trip.
- Make uncertainty visible.
- Let caregivers copy/share instructions for siblings, drivers, and volunteers.

## Voice UX

Voice search must always be optional.

Required pattern:

1. User taps microphone.
2. App listens with visible state.
3. Transcript appears in the search box.
4. User can edit transcript.
5. Search results update.

Fallback:

- If speech recognition fails, show typed search and immediate need buttons.
- Do not block any core task behind voice-only interaction.

## Map UX

The map is a spatial overview, not the only interface.

Map must show:

- Large category markers.
- Selected resource state.
- Hazard/maintenance warning markers.
- Route overlay for demo journey.
- Confidence labels in detail/list panels.

List/detail must show:

- Name.
- Category.
- Address.
- Access notes.
- Verification status.
- Last verified date.
- Hazards affecting the resource or route.

## Accessibility Checklist

- Buttons have accessible names.
- Form fields have labels.
- Color is not the only status indicator.
- Text remains readable at mobile width.
- Critical actions are reachable by keyboard.
- Focus state is visible.
- Images/photos have useful alt text or are marked decorative.

## Visual Tone

Use:

- Neutral backgrounds.
- Strong contrast.
- Category colors sparingly.
- Simple icons.
- Cards for individual resources only.

Avoid:

- Decorative gradient blobs.
- Tiny gray text.
- Overly rounded toy-like UI.
- Huge hero sections.
- Marketing copy on the first screen.

## Component Architecture

These rules apply to every workstream. Treat them as part of "done".

### File layout

- `src/components/ui/*` — shadcn primitives. Generated via `npx shadcn@latest add <name>`. Do not edit by hand unless customising the variant API; if you customise, leave a one-line comment naming the variant added.
- `src/components/atoms/*` — small reusable wrappers around shadcn primitives or native elements (e.g. `IconLabelButton`, `VerificationBadge`, `ConfidenceChip`). Use atoms when the same control appears in 2+ places with the same shape.
- `src/components/<feature>/*` — feature-scoped composites owned by one lane (e.g. `src/components/map/ResourceMarker.tsx`). Do not import another lane's feature components without coordinating.
- One component per file. Filename matches the default export. Co-locate component-only types and styles.

### Build with shadcn first

- Reach for `src/components/ui` (shadcn) before writing custom Tailwind. Default primitives to add as needed: `button`, `input`, `label`, `card`, `dialog`, `sheet`, `badge`, `switch`, `slider`, `select`, `tabs`, `toast`, `tooltip`, `separator`, `skeleton`.
- Add a primitive only when you actually need it. Do not bulk-install upfront.
- Style via the primitive's variant API and `cn()` from `@/lib/utils`. Do not duplicate Tailwind class strings across files — promote to an atom.

### Atoms

- An atom exists when a control is used in 2+ places and carries product semantics (verification status, confidence, hazard severity, elderly-mode sizing). Atoms hide repeated class strings, enforce accessible labels, and centralise the elderly-mode sizing rules from this file.
- Atoms must not own data fetching, navigation, or feature state. They take props and emit events.
- Every interactive atom must accept (or forward) `aria-label` / `aria-labelledby` and a visible focus state. Touch targets stay ≥44px in elderly mode.

### Refactor trigger

When a page or feature component crosses ~150 lines, has 3+ distinct UI sections, or repeats the same JSX block twice, split it. Inline JSX with Tailwind is fine for one-offs; extract the moment it repeats.

### Memoisation rules

Default to no memoisation. Add it only when there is a measurable reason:

- `useMemo` for derived data with non-trivial cost (filtering large resource lists, computing route corridors, parsing seed data).
- `useCallback` only when the function is passed to a memoised child or used as a dependency of another hook.
- `React.memo` for list-row components rendered in long maps/lists (resource cards, hazard markers).
- Keep referentially stable objects (style configs, adapter instances, constant arrays) outside the component or in `useMemo` with `[]` deps.

Do not wrap every callback in `useCallback`. Premature memoisation hides re-render bugs and adds noise.

### Definition of done

Before marking a UI task done:

- No duplicated class-string blocks (>3 lines) across components in the same lane.
- Every reusable control lives in `ui/` or `atoms/`, not pasted inline.
- Memoisation is justified by a comment if the reason is not obvious.
- Component renders correctly in elderly mode and at mobile width.
