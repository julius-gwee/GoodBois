# UI and UX Standards

## Design Direction

GoodBois should feel like a calm, single-purpose appliance: a kiosk on the wall of an HDB void deck, used by elderly residents who may be hesitant, in a hurry, or unfamiliar with screens. Every screen should be obvious, slow-paced, and forgiving.

## Global UI Rules

- Kiosk-first; mobile/tablet fallback only matters for the NTH map feature.
- Large default text (≥18px body; ≥24px on the listening / response screen).
- High contrast, neutral palette.
- Clear icon + label for critical actions.
- No reliance on color alone for state.
- Plain language across all languages: use the resident's everyday wording, not government jargon.
- Use the same field labels as the curated `AgencyContact` directory ("Hotline", "Address", "Opening Hours") — no clever synonyms.

## Kiosk Shell

The kiosk runs full-screen on the demo laptop. The user is always in one of these states:

1. **Idle / language picker** — large language tiles in the user-language script. Tap to start.
2. **Consent banner** (first session only) — one paragraph + one tap-to-accept button.
3. **Listening** — visible animation; transcript fills in as STT returns; "stop" button reachable at all times.
4. **Thinking** — visible spinner; transcript stays on screen while triage runs.
5. **Response card** — bilingual response (user language large, English smaller). Includes the agency name, hotline, address, opening hours from the directory.
6. **Receipt PDF** — full-screen PDF view; one "回去 / Back" button.
7. **Follow-up** — same as listening, but with the kiosk's question shown above the listening state.

Idle reset: 30s of inactivity returns to the language picker and clears the KV session.

Touch fallback: every screen exposes a "I want to type instead" affordance. Activates a touch keyboard and routes through the same pipeline.

## Kiosk UI Rules

- Language tiles: ≥120px square, native script, no English co-label (the language is the entry point).
- Listening animation: subtle, non-strobing (some users have dementia / vertigo).
- Transcript panel: user language large; English smaller, in a muted tone — a verification cue, not the main content.
- Response card: hotline appears as a tap-to-call link AND a large legible number (kiosks may not have phone capability).
- Receipt PDF: bilingual; ≥18px font; QR code at the bottom linking to the case (R2 signed URL) — useful when a real printer is added later.
- "Stop" / "Back" / "I want to type" buttons must be reachable from every screen.
- Never auto-dial. Never auto-call.

## Voice UX

Voice is the primary path; touch is the always-available fallback.

Required pattern:

1. User taps language tile or microphone.
2. Consent banner shown if first session.
3. Kiosk listens with visible state.
4. Transcript appears in the user's language.
5. Kiosk thinks (visible spinner).
6. Response card appears + TTS plays.
7. If follow-up needed, kiosk asks; loop with bounded retry (≤3).
8. Receipt PDF if applicable.

Fallback:

- Touch keyboard reachable from every screen.
- If STT fails 2× in a row, the kiosk auto-prompts the touch fallback.
- Browser Web Speech API + `SpeechSynthesis` are the last-resort path if Workers AI is unreachable.

## Map UX (NTH)

Used only for the NTH `findNearby` map render. Same rules as before:

- Map is a spatial overview, not the only interface. Always pair with a list/text description.
- Large category markers; selected resource state visible.
- Confidence labels in the response card, not the map.

## Elderly Mode (held over — NTH)

The prior product had an elderly/caregiver mode switch. That feature is held over to NTH. Until rebuilt, the kiosk shell is single-mode (elderly).

## Accessibility Checklist

- Buttons have accessible names.
- Form fields (touch fallback) have labels.
- Color is not the only status indicator.
- Text remains readable at the kiosk display resolution.
- Critical actions are reachable by keyboard (a stylus or attached keyboard variant should still work).
- Focus state is visible.
- Images / receipts have useful alt text or are marked decorative.
- Touch targets ≥44px; language tiles ≥120px.
- Animations non-strobing; respect `prefers-reduced-motion`.

## Visual Tone

Use:

- Neutral backgrounds.
- Strong contrast.
- Category colors sparingly.
- Simple icons.
- Cards for individual response blocks.

Avoid:

- Decorative gradient blobs.
- Tiny gray text.
- Toy-like rounded UI.
- Marketing copy on the language picker.

## Component Architecture

These rules apply to every workstream. Treat them as part of "done". They predate the kiosk pivot and apply unchanged.

### File layout

- `src/components/ui/*` — shadcn primitives. Generated via `npx shadcn@latest add <name>`. Do not edit by hand unless customising the variant API; if you customise, leave a one-line comment naming the variant added.
- `src/components/atoms/*` — small reusable wrappers around shadcn primitives or native elements (e.g. `LanguageTile`, `ListeningPulse`, `AgencyCard`, `ReceiptBlock`). Use atoms when the same control appears in 2+ places with the same shape.
- `src/components/<feature>/*` — feature-scoped composites owned by one lane (e.g. `src/components/kiosk/ListeningScreen.tsx`). Do not import another lane's feature components without coordinating.
- One component per file. Filename matches the default export. Co-locate component-only types and styles.

### Build with shadcn first

- Reach for `src/components/ui` (shadcn) before writing custom Tailwind. Default primitives to add as needed: `button`, `input`, `label`, `card`, `dialog`, `sheet`, `badge`, `switch`, `slider`, `select`, `tabs`, `toast`, `tooltip`, `separator`, `skeleton`.
- Add a primitive only when you actually need it. Do not bulk-install upfront.
- Style via the primitive's variant API and `cn()` from `@/lib/utils`. Do not duplicate Tailwind class strings across files — promote to an atom.

### Atoms

- An atom exists when a control is used in 2+ places and carries product semantics (language tile, listening pulse, agency card, receipt block, confidence chip). Atoms hide repeated class strings, enforce accessible labels, and centralise the kiosk-mode sizing rules.
- Atoms must not own data fetching, navigation, or feature state. They take props and emit events.
- Every interactive atom must accept (or forward) `aria-label` / `aria-labelledby` and a visible focus state. Touch targets stay ≥44px (≥120px for language tiles).

### Refactor trigger

When a page or feature component crosses ~150 lines, has 3+ distinct UI sections, or repeats the same JSX block twice, split it. Inline JSX with Tailwind is fine for one-offs; extract the moment it repeats.

### Memoisation rules

Default to no memoisation. Add it only when there is a measurable reason:

- `useMemo` for derived data with non-trivial cost (parsing seed data, filtering large directories).
- `useCallback` only when the function is passed to a memoised child or used as a dependency of another hook.
- `React.memo` for list-row components rendered in long lists (agency cards in NTH search, hazard markers).
- Keep referentially stable objects (style configs, adapter instances, constant arrays) outside the component or in `useMemo` with `[]` deps.

Do not wrap every callback in `useCallback`. Premature memoisation hides re-render bugs and adds noise.

### Definition of done

Before marking a UI task done:

- No duplicated class-string blocks (>3 lines) across components in the same lane.
- Every reusable control lives in `ui/` or `atoms/`, not pasted inline.
- Memoisation is justified by a comment if the reason is not obvious.
- Component renders correctly at the demo display resolution.
- Idle reset clears the visible session.
